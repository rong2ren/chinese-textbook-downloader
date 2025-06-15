#!/usr/bin/env python3
"""
Dynamic Chinese Textbook Data Generator with Location-Aware URL Testing
Fetches textbook data directly from GitHub repository: https://github.com/TapXWorld/ChinaTextbook
Uses GitHub Trees API for efficient single-call repository structure retrieval.
Automatically discovers subjects, publishers, grades, and PDF files including split files.
Tests jsDelivr CDN compatibility for each PDF and generates location-aware URLs.
Supports flexible configuration via textbook-config.json file.
"""

import json
import os
import re
import requests
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import urllib.parse
import fnmatch
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

class URLTester:
    """URL testing class for jsDelivr CDN compatibility and fallback generation"""
    
    def __init__(self, max_workers: int = 10):
        """Initialize URL tester
        
        Args:
            max_workers (int): Maximum number of concurrent threads for testing
        """
        self.max_workers = max_workers
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        
        # URL templates
        self.jsdelivr_template = "https://cdn.jsdelivr.net/gh/TapXWorld/ChinaTextbook@master/{}"
        self.fallback_template = "https://ghfast.top/https://raw.githubusercontent.com/TapXWorld/ChinaTextbook/master/{}"
    
    def test_jsdelivr_link(self, file_path: str) -> Tuple[str, bool, int, str]:
        """Test a single jsDelivr link
        
        Args:
            file_path (str): The file path in the repository
            
        Returns:
            Tuple[str, bool, int, str]: (file_path, success, status_code, error_message)
        """
        encoded_path = urllib.parse.quote(file_path, safe='/')
        jsdelivr_url = self.jsdelivr_template.format(encoded_path)
        
        try:
            # Use HEAD request to avoid downloading the entire file
            response = self.session.head(jsdelivr_url, timeout=10)
            success = response.status_code == 200
            return file_path, success, response.status_code, ""
        except requests.exceptions.RequestException as e:
            return file_path, False, 0, str(e)
    
    def get_optimal_urls(self, github_url: str, file_path: str) -> Dict[str, str]:
        """Get optimal URLs for international and China users with real-time testing
        
        Args:
            github_url (str): Original GitHub raw URL
            file_path (str): File path in repository for testing
            
        Returns:
            Dict[str, str]: Dictionary with international_url and china_url
        """
        result = {
            'international_url': github_url,  # International users always use GitHub direct
            'china_url': github_url  # Default fallback
        }
        
        # Test jsDelivr for China users
        _, jsdelivr_works, status_code, error_msg = self.test_jsdelivr_link(file_path)
        
        if jsdelivr_works:
            # jsDelivr works, use it for China users
            encoded_path = urllib.parse.quote(file_path, safe='/')
            result['china_url'] = self.jsdelivr_template.format(encoded_path)
        else:
            # jsDelivr failed, use fallback proxy for China users
            encoded_path = urllib.parse.quote(file_path, safe='/')
            result['china_url'] = self.fallback_template.format(encoded_path)
        
        return result, jsdelivr_works, status_code
    
    def test_multiple_urls(self, url_data: List[Tuple[str, str]]) -> Dict[str, Dict]:
        """Test multiple URLs concurrently
        
        Args:
            url_data: List of (github_url, file_path) tuples
            
        Returns:
            Dict mapping github_url to url results and test info
        """
        results = {}
        total_files = len(url_data)
        completed = 0
        
        print(f"🚀 Testing {total_files} jsDelivr links with {self.max_workers} threads...")
        print("⏳ This may take a few minutes...")
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all tasks
            future_to_data = {
                executor.submit(self.get_optimal_urls, github_url, file_path): (github_url, file_path)
                for github_url, file_path in url_data
            }
            
            # Process completed tasks
            for future in as_completed(future_to_data):
                completed += 1
                github_url, file_path = future_to_data[future]
                
                try:
                    url_result, jsdelivr_works, status_code = future.result()
                    results[github_url] = {
                        'urls': url_result,
                        'jsdelivr_works': jsdelivr_works,
                        'status_code': status_code,
                        'file_path': file_path
                    }
                    
                    status_icon = "✅" if jsdelivr_works else "❌"
                    print(f"{status_icon} [{completed}/{total_files}] {file_path}")
                    
                except Exception as e:
                    # Fallback in case of error
                    encoded_path = urllib.parse.quote(file_path, safe='/')
                    fallback_url = self.fallback_template.format(encoded_path)
                    results[github_url] = {
                        'urls': {
                            'international_url': github_url,
                            'china_url': fallback_url
                        },
                        'jsdelivr_works': False,
                        'status_code': 0,
                        'file_path': file_path,
                        'error': str(e)
                    }
                    print(f"❌ [{completed}/{total_files}] {file_path} (Error: {e})")
                
                # Progress update and rate limiting
                if completed % 50 == 0:
                    print(f"📊 Progress: {completed}/{total_files} ({completed/total_files*100:.1f}%)")
                    time.sleep(1)
        
        # Print summary
        working_count = sum(1 for r in results.values() if r['jsdelivr_works'])
        failed_count = total_files - working_count
        success_rate = (working_count / total_files * 100) if total_files > 0 else 0
        
        print(f"\n📊 URL Testing Summary:")
        print(f"✅ jsDelivr working: {working_count}")
        print(f"❌ jsDelivr failed: {failed_count}")
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        return results

class GitHubTextbookScanner:
    """GitHub Textbook Scanner class for fetching and parsing Chinese textbook data.
    
    This class is specifically designed for the TapXWorld/ChinaTextbook repository:
    https://github.com/TapXWorld/ChinaTextbook
    
    The parsing logic is hardcoded for Chinese educational materials and will NOT work
    with other repositories due to:
    - Chinese filename parsing patterns
    - Chinese education level structure (小学/初中/高中/大学)
    - Chinese subject recognition (语文/数学/英语 etc.)
    - Chinese publisher naming conventions
    
    Attributes:
        owner (str): Fixed as "TapXWorld"
        repo (str): Fixed as "ChinaTextbook"
        token (Optional[str]): GitHub API token for authentication
        trees_api_url (str): GitHub Trees API endpoint for ChinaTextbook repo
        raw_base_url (str): Base URL for accessing raw files from ChinaTextbook repo
        session (requests.Session): Requests session for API calls
        cache_file (str): Local cache file path for repository tree data
        config (Dict): Configuration settings loaded from textbook-config.json
        url_tester (URLTester): URL testing instance for jsDelivr compatibility
    """

    def __init__(self, token: Optional[str] = None, test_urls: bool = True):
        """Initialize GitHubTextbookScanner for TapXWorld/ChinaTextbook repository.

        Args:
            token (Optional[str], optional): GitHub API token for higher rate limits. 
                                           Defaults to None.
            test_urls (bool, optional): Whether to test URLs for jsDelivr compatibility. Defaults to True.
        """
        # Hardcoded for TapXWorld/ChinaTextbook repository only
        self.owner = "TapXWorld"
        self.repo = "ChinaTextbook"
        self.token = token
        self.test_urls = test_urls
        
        # Use default configuration (no external config file needed)
        self.config = self.get_default_config()
        
        # Fixed API URLs for the specific repository
        self.trees_api_url = f"https://api.github.com/repos/{self.owner}/{self.repo}/git/trees/master"
        self.raw_base_url = f"https://raw.githubusercontent.com/{self.owner}/{self.repo}/master"
        self.session = requests.Session()
        
        # Initialize URL tester if testing is enabled
        # url tester is to test jsDelivr compatibility for each PDF
        if self.test_urls:
            self.url_tester = URLTester(max_workers=15)  # Increased workers for faster testing
            print("🔗 URL testing enabled - will test jsDelivr compatibility for each PDF")
        else:
            self.url_tester = None
            print("🔗 URL testing disabled - using GitHub URLs only")
        
        # Set up authentication if token provided
        if token:
            self.session.headers.update({'Authorization': f'token {token}'})
            print("🔑 Using GitHub token for higher rate limits")
        
        # Fixed cache file for the specific repository
        self.cache_file = "textbook-tree-cache.json"
                
    def get_default_config(self) -> Dict:
        """Get default configuration (no external config file needed)"""
        config = {
            "levels": {
                "xiaoxue": {"enabled": True, "ignorePatterns": [], "showGrades": True, "requireGrades": False},
                "chuzhong": {"enabled": True, "ignorePatterns": [], "showGrades": True, "requireGrades": False},
                "gaozhong": {"enabled": True, "ignorePatterns": [], "showGrades": True, "requireGrades": False},
                "daxue": {"enabled": True, "ignorePatterns": [], "showGrades": False, "requireGrades": False},
                "xiaoxue45": {"enabled": True, "ignorePatterns": [], "showGrades": True, "requireGrades": False},
                "chuzhong45": {"enabled": True, "ignorePatterns": [], "showGrades": True, "requireGrades": False}
            }
        }
        return config

    def should_ignore_path(self, path: str, level_key: str) -> bool:
        """Check if a path should be ignored based on configuration"""
        if level_key not in self.config.get("levels", {}):
            return False
            
        level_config = self.config["levels"][level_key]
        if not level_config.get("enabled", True):
            return True
            
        ignore_patterns = level_config.get("ignorePatterns", [])
        for pattern in ignore_patterns:
            if fnmatch.fnmatch(path, pattern):
                print(f"🚫 Ignoring path: {path} (matches pattern: {pattern})")
                return True
        return False

    def get_level_key_from_path(self, path: str) -> Optional[str]:
        """Map path to configuration level key"""
        path_parts = path.split('/')
        if not path_parts:
            return None
            
        level_name = path_parts[0]
        level_mapping = {
            "小学": "xiaoxue",
            "初中": "chuzhong", 
            "高中": "gaozhong",
            "大学": "daxue",
            "小学45学制": "xiaoxue45",
            "初中45学制": "chuzhong45"
        }
        
        return level_mapping.get(level_name)

    def should_show_grades_for_level(self, level_key: str) -> bool:
        """Check if grades should be shown for a specific level"""
        if level_key not in self.config.get("levels", {}):
            return True
            
        level_config = self.config["levels"][level_key]
        return level_config.get("showGrades", True)


        
    def get_repository_tree(self) -> Optional[List[Dict]]:
        """Get entire repository tree structure in one API call"""
        
        # Try to load from cache first
        tree_data = self.load_tree_cache()
        if tree_data:
            print(f"📂 Loaded repository tree from cache textbook-tree-cache.json - ({len(tree_data)} entries)")
            return tree_data
        
        print("🌳 Fetching repository tree structure from GitHub API...")
        
        try:
            # Make API call with recursive=1 to get all files
            response = self.session.get(f"{self.trees_api_url}?recursive=1")
            
            if response.status_code == 200:
                data = response.json()
                tree_data = data.get('tree', [])
                print(f"✅ Successfully fetched {len(tree_data)} tree entries from GitHub API")
                
                # Save to cache
                self.save_tree_cache(tree_data)
                return tree_data
                
            elif response.status_code == 403:
                print("❌ Rate limited or access denied")
                return None
            else:
                print(f"❌ Error fetching tree: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Exception fetching tree: {e}")
            return None
    
    def save_tree_cache(self, tree_data: List[Dict]):
        """Save tree data to cache file"""
        try:
            cache_data = {
                'timestamp': datetime.now().isoformat(),
                'tree': tree_data
            }
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
            print(f"💾 Saved tree cache to {self.cache_file}")
        except Exception as e:
            print(f"⚠️ Could not save cache: {e}")
    
    def load_tree_cache(self) -> Optional[List[Dict]]:
        """Load tree data from cache file"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    cache_data = json.load(f)
                return cache_data.get('tree', [])
        except Exception as e:
            print(f"⚠️ Could not load cache: {e}")
        return None
    
    def _parse_textbook_metadata(self, filename: str, path: str = None) -> Dict[str, str]:
        """Parse textbook path and filename using systematic pattern recognition
        
        Handles all directory structure patterns in TapXWorld/ChinaTextbook repository:
        - Pattern A: {level}/{subject}/{publisher}/{direct_pdf_file}
        - Pattern B: {level}/{subject}/{publisher}/{grade}/{pdf_file_or_merge_folder}
        - Pattern C: Split files in _merge_folder directories
        - Pattern D: Math practice materials in special directory
        - Pattern E: {level}/{subject}/{direct_pdf_file} (no publisher, common in university level)
        - Special: Five-four education systems
        - Enhanced: Complex filenames with special handling
        
        Args:
            filename (str): The PDF filename to parse
            path (str, optional): Full file path for structured parsing
            
        Returns:
            Dict[str, str]: Complete metadata including all textbook information
        """
        # Initialize default values
        result = {
            'original_name': filename,
            'parsed_name': filename.replace('.pdf', '').replace('.PDF', ''),
            'subject': 'unknown',
            'grade': 'unknown', 
            'semester': 'unknown',
            'level': 'unknown',
            'publisher': '未知出版社',
            'part_number': None,
            'is_split': False
        }
        
        # Handle split files first (applies to all patterns)
        name = result['parsed_name']
        split_match = re.search(r'\.(\d+)$', name)
        if split_match:
            result['part_number'] = int(split_match.group(1))
            result['parsed_name'] = name[:split_match.start()]
            result['is_split'] = True
        
        # If no path provided, fall back to filename-only parsing
        if not path:
            return self._parse_from_filename_only(result)
        
        # Split path and determine pattern
        path_parts = path.split('/')
        
        # Pattern D: Math practice materials
        if path.startswith('学数学最重要的刷习题在这里/'):
            print(f"🧮 Processing math practice file: {path}")
            return self._parse_math_practice_pattern(path_parts, result)
        
        # Patterns A, B, C: Regular textbooks
        elif len(path_parts) >= 3:
            parsed_result = self._parse_regular_textbook_pattern(path_parts, result)
            
            # If regular parsing didn't extract enough information, try special handling
            if (parsed_result['subject'] == 'unknown' or 
                parsed_result['grade'] == 'unknown' or 
                parsed_result['grade'] == result['parsed_name']):  # Grade equals filename indicates parsing failure
                
                special_result = self._parse_special_complex_filename(result['parsed_name'], path)
                if special_result['subject'] != 'unknown':
                    # Merge special parsing results, keeping path-based level if available
                    for key, value in special_result.items():
                        if value != 'unknown' and value != '未知出版社':
                            if key == 'level' and parsed_result['level'] != 'unknown':
                                continue  # Keep path-based level
                            parsed_result[key] = value
            
            return parsed_result
        
        # Invalid/unknown pattern - fall back to filename parsing
        else:
            return self._parse_from_filename_only(result)
    
    def _parse_regular_textbook_pattern(self, path_parts: List[str], result: Dict[str, str]) -> Dict[str, str]:
        """Parse regular textbook patterns A, B, and C"""
        
        # Extract level (first component)
        result['level'] = path_parts[0] if path_parts[0] else 'unknown'
        
        # Check configuration for grade handling for this level
        level_key = self.get_level_key_from_path('/'.join(path_parts))
        show_grades = self.should_show_grades_for_level(level_key) if level_key else True
        
        # Extract subject (second component)  
        result['subject'] = path_parts[1] if len(path_parts) > 1 and path_parts[1] else 'unknown'
        
        # Determine if third component is publisher or direct file
        if len(path_parts) >= 3:
            third_component = path_parts[2]
            
            # Check if third component is a PDF file or merge folder (no publisher case)
            if (third_component.endswith('.pdf') or 
                re.search(r'\.pdf\.\d+$', third_component) or  # Split PDF files
                '.pdf_merge_folder' in third_component or
                third_component.startswith('义务教育教科书')):
                # Pattern: {level}/{subject}/{direct_pdf_file} - no publisher
                result['publisher'] = '未知出版社'
                if show_grades:
                    # Try special complex filename parsing first
                    special_result = self._parse_special_complex_filename(result['parsed_name'])
                    if special_result['grade'] != 'unknown':
                        result['grade'] = special_result['grade']
                    else:
                        result['grade'] = self._extract_grade_from_name(result['parsed_name']) or 'unknown'
                else:
                    result['grade'] = 'course'  # For university level, use 'course' instead of grade
            else:
                # Third component is publisher
                result['publisher'] = self._clean_publisher_name(third_component)
                
                # Determine if we have Pattern A (direct files) or Pattern B (grade directories)
                if len(path_parts) >= 4:
                    fourth_component = path_parts[3]
                    
                    # Check if fourth component is a file or merge folder (Pattern A)
                    if (fourth_component.endswith('.pdf') or 
                        re.search(r'\.pdf\.\d+$', fourth_component) or  # Split PDF files
                        '.pdf_merge_folder' in fourth_component or
                        fourth_component.startswith('义务教育教科书')):
                        # Pattern A: Direct PDF file, extract grade from filename
                        if show_grades:
                            # Try special complex filename parsing first
                            special_result = self._parse_special_complex_filename(result['parsed_name'])
                            if special_result['grade'] != 'unknown':
                                result['grade'] = special_result['grade']
                            else:
                                result['grade'] = self._extract_grade_from_name(result['parsed_name']) or 'unknown'
                        else:
                            result['grade'] = 'course'
                    else:
                        # Pattern B: Grade directory exists
                        if show_grades:
                            result['grade'] = fourth_component
                        else:
                            result['grade'] = 'course'
                else:
                    # Only three components: {level}/{subject}/{publisher} - unusual case
                    result['grade'] = 'course' if not show_grades else 'unknown'
        
        # Extract semester from filename
        result['semester'] = self._extract_semester_from_name(result['parsed_name']) or 'unknown'
        
        return result
    
    def _parse_math_practice_pattern(self, path_parts: List[str], result: Dict[str, str]) -> Dict[str, str]:
        """Parse math practice materials (Pattern D) - assign to appropriate education levels"""
        
        # Default practice values
        result['subject'] = '数学练习'
        result['grade'] = '练习题'
        result['publisher'] = '练习题集'
        result['semester'] = 'practice'
        
        # Assign to appropriate education level based on path
        if len(path_parts) >= 2:
            second_part = path_parts[1]  # e.g., "初中练习题_带答案"
            
            if '初中练习题' in second_part:
                result['level'] = '初中'
                # Determine if it's 中考 (middle school entrance exam)
                full_path = '/'.join(path_parts)
                if '中考' in result['original_name'] or '中考' in full_path:
                    result['subject'] = '中考数学'
                    result['grade'] = '中考练习'
                else:
                    result['subject'] = '数学练习'
                    result['grade'] = self._extract_grade_from_name(result['parsed_name']) or '数学练习'
                    
            elif '高中练习题' in second_part:
                result['level'] = '高中'
                # Determine if it's 高考 (college entrance exam)
                full_path = '/'.join(path_parts)
                if '高考' in result['original_name'] or '高考' in full_path:
                    result['subject'] = '高考数学'
                    result['grade'] = '高考练习'
                else:
                    result['subject'] = '数学练习'
                    result['grade'] = self._extract_grade_from_name(result['parsed_name']) or '数学练习'
                    
            elif '小学练习题' in second_part:
                result['level'] = '小学'
                result['subject'] = '数学练习'
                result['grade'] = self._extract_grade_from_name(result['parsed_name']) or '数学练习'
            else:
                # Fallback - if we can't determine level, default to 初中
                result['level'] = '初中'
        else:
            # Fallback for incomplete paths
            result['level'] = '初中'
        
        # Try to extract more specific publisher from test name (third component)
        if len(path_parts) >= 3:
            test_name = path_parts[2]
            # If test name contains publisher info, use it
            if any(indicator in test_name for indicator in ['版', '出版社']):
                result['publisher'] = self._clean_publisher_name(test_name)
            else:
                # Use test name as a more specific identifier
                result['publisher'] = test_name if test_name else '练习题集'
        
        print(f"🧮 Math practice parsed: level={result['level']}, subject={result['subject']}, grade={result['grade']}")
        return result
    
    def _parse_from_filename_only(self, result: Dict[str, str]) -> Dict[str, str]:
        """Fallback parsing using only filename when path is unavailable or invalid"""
        
        name = result['parsed_name']
        
        # First try special complex filename patterns
        special_result = self._parse_special_complex_filename(name)
        if special_result['subject'] != 'unknown':
            # Merge special parsing results with existing result
            for key, value in special_result.items():
                if value != 'unknown' and value != '未知出版社':
                    result[key] = value
            return result
        
        # Try to extract subject from filename
        subject = self._extract_subject_from_name(name)
        if subject:
            result['subject'] = subject
        
        # Try to extract grade from filename  
        grade = self._extract_grade_from_name(name)
        if grade:
            result['grade'] = grade
            
        # Try to extract semester from filename
        semester = self._extract_semester_from_name(name)
        if semester:
            result['semester'] = semester
        
        return result
    
    def _clean_publisher_name(self, publisher_raw: str) -> str:
        """Clean and normalize publisher names from path components"""
        if not publisher_raw:
            return '未知出版社'
        
        # Handle combined publisher names like "华中师大版-华中师范大学出版社"
        if '-' in publisher_raw:
            parts = publisher_raw.split('-')
            first_part = parts[0]
            
            # If first part ends with '版', use it (it's the short form)
            if first_part.endswith('版'):
                return first_part
            else:
                # Otherwise use the second part and normalize it
                second_part = parts[-1]
                if second_part.endswith('出版社'):
                    return second_part.replace('出版社', '版')
                else:
                    return second_part + '版' if not second_part.endswith('版') else second_part
        
        # Handle single publisher names
        publisher = publisher_raw
        
        # Normalize naming: prefer '版' ending over '出版社'
        if publisher.endswith('出版社'):
            publisher = publisher.replace('出版社', '版')
        elif not publisher.endswith('版') and not publisher.endswith('社'):
            publisher += '版'
        
        return publisher
    
    def _normalize_grade_format(self, grade: str) -> str:
        """Normalize grade format to use Chinese characters consistently"""
        # Convert Arabic numerals to Chinese characters for year grades
        arabic_to_chinese = {
            '1': '一', '2': '二', '3': '三', '4': '四', '5': '五',
            '6': '六', '7': '七', '8': '八', '9': '九', '10': '十'
        }
        
        # Handle patterns like "4年级" -> "四年级"
        if re.match(r'\d+年级', grade):
            number = re.search(r'(\d+)', grade).group(1)
            if number in arabic_to_chinese:
                return arabic_to_chinese[number] + '年级'
        
        # Handle patterns like "必修1" -> keep as is (these are fine with numbers)
        # Handle patterns like "选修2" -> keep as is
        
        return grade

    def _extract_grade_from_name(self, name: str) -> Optional[str]:
        """Extract grade information from filename with enhanced pattern recognition"""
        grade_patterns = [
            # Standard grade patterns
            r'([一二三四五六七八九十]年级)',
            r'(\d+年级)',
            r'(必修\d+)',
            r'(选修\d+)',
            r'(全一册)',
            
            # Enhanced patterns for special cases
            r'(低年级)',      # For "小学低年级" cases
            r'(高年级)',      # For "小学高年级" cases  
            r'(中年级)',      # For "小学中年级" cases
            r'(幼儿园)',      # For kindergarten materials
            r'(学前班)',      # For pre-school materials
            
            # High school specific patterns
            r'(高一)',
            r'(高二)', 
            r'(高三)',
            
            # Middle school specific patterns  
            r'(初一)',
            r'(初二)',
            r'(初三)',
            r'(七年级)',
            r'(八年级)',
            r'(九年级)',
            
            # University course patterns
            r'(大一)',
            r'(大二)',
            r'(大三)',
            r'(大四)',
            
            # Special educational materials
            r'(中考)',
            r'(高考)',
            r'(练习题)',
            r'(复习)',
            r'(预习)',
            
            # Semester-based patterns
            r'(上学期)',
            r'(下学期)',
            r'(第一学期)',
            r'(第二学期)',
        ]
        
        for pattern in grade_patterns:
            match = re.search(pattern, name)
            if match:
                grade = match.group(1)
                return self._normalize_grade_format(grade)
        return None
        
    def _extract_semester_from_name(self, name: str) -> Optional[str]:
        """Extract semester information from filename"""
        if '上册' in name:
            return 'first'
        elif '下册' in name:
            return 'second'
        elif '全一册' in name or '必修' in name or '选修' in name:
            return 'complete'
        return None
    
    def _extract_subject_from_name(self, name: str) -> Optional[str]:
        """Extract subject information from filename with enhanced pattern recognition"""
        
        # Special case patterns for complex titles
        special_patterns = [
            (r'习近平新时代中国特色社会主义思想学生读本', '道德与法治'),
            (r'思想品德', '道德与法治'),
            (r'品德与生活', '道德与法治'),
            (r'品德与社会', '道德与法治'),
            (r'思想政治', '政治'),
            (r'生物学', '生物学'),
            (r'生物(?!学)', '生物学'),  # Match "生物" but not "生物学"
        ]
        
        # Check special patterns first
        for pattern, subject in special_patterns:
            if re.search(pattern, name):
                return subject
        
        # Standard subject patterns
        subject_patterns = [
            r'(语文)', r'(数学)', r'(英语)', r'(物理)', r'(化学)', r'(生物学)', 
            r'(历史)', r'(地理)', r'(政治)', r'(道德与法治)', r'(科学)',
            r'(音乐)', r'(美术)', r'(体育与健康)', r'(信息技术)',
            r'(高等数学)', r'(线性代数)', r'(概率论)', r'(大学物理)', r'(大学英语)',
            r'(计算机)', r'(思想品德)', r'(社会)', r'(自然)', 
            r'(综合实践)', r'(通用技术)', r'(俄语)', r'(日语)',
            r'(人文地理)', r'(心理健康)', r'(劳动技术)', r'(书法)',
            r'(传统文化)', r'(国学)', r'(经典诵读)'
        ]
        
        for pattern in subject_patterns:
            match = re.search(pattern, name)
            if match:
                subject = match.group(1)
                return subject
        return None
    
    def _parse_special_complex_filename(self, name: str, path: str = None) -> Dict[str, str]:
        """Handle special complex filenames that don't fit standard patterns"""
        result = {
            'subject': 'unknown',
            'grade': 'unknown', 
            'semester': 'unknown',
            'level': 'unknown',
            'publisher': '未知出版社'
        }
        
        # Special handling for "习近平新时代中国特色社会主义思想学生读本" series
        if '习近平新时代中国特色社会主义思想学生读本' in name:
            result['subject'] = '道德与法治'
            result['publisher'] = '人民出版社'  # This is typically published by People's Publishing House
            
            # Extract grade information
            if '小学低年级' in name:
                result['grade'] = '低年级'
                result['level'] = '小学'
            elif '小学高年级' in name:
                result['grade'] = '高年级'
                result['level'] = '小学'
            elif '小学中年级' in name:
                result['grade'] = '中年级'
                result['level'] = '小学'
            elif '初中' in name:
                result['grade'] = '全册'
                result['level'] = '初中'
            elif '高中' in name:
                result['grade'] = '全册'
                result['level'] = '高中'
            elif '小学' in name:
                result['grade'] = '全册'
                result['level'] = '小学'
            
            # Try to extract level from path if not found in filename
            if result['level'] == 'unknown' and path:
                path_parts = path.split('/')
                if len(path_parts) > 0:
                    first_part = path_parts[0]
                    if first_part in ['小学', '初中', '高中', '大学']:
                        result['level'] = first_part
                        if result['grade'] == 'unknown':
                            result['grade'] = '全册'
                
                result['semester'] = 'complete'
                return result
        
        # Handle other special cases here as needed
        # For example, traditional culture materials, special education books, etc.
        
        return result
    
    def process_tree_data(self, tree_data: List[Dict]) -> List[Dict]:
        """Process tree data to extract PDF file information with configuration filtering and URL testing"""
        textbooks = []
        pdf_count = 0
        ignored_count = 0
        total_files = len(tree_data)
        
        print(f"🔍 Processing {total_files} repository tree entries to find PDF files...")
        
        # First pass: collect all PDF files and create basic entries
        url_test_data = []  # For batch URL testing
        
        for item in tree_data:
            path = item.get('path', '')
            item_type = item.get('type', '')
            file_size = item.get('size', 0)
            
            # Only process PDF files (blobs in git terminology)
            # Include regular PDFs and split files (.pdf.1, .pdf.2, etc.)
            is_pdf = (path.endswith('.pdf') or path.endswith('.PDF'))
            is_split_pdf = bool(re.search(r'\.pdf\.\d+$', path, re.IGNORECASE))
            
            if item_type == 'blob' and (is_pdf or is_split_pdf):
                pdf_count += 1
                
                # Check if this path should be ignored based on configuration
                level_key = self.get_level_key_from_path(path)
                if level_key and self.should_ignore_path(path, level_key):
                    ignored_count += 1
                    continue
                
                # Extract filename from path
                pdf_filename = os.path.basename(path)
                
                # Parse file information - function handles both regular and math practice materials
                parsed = self._parse_textbook_metadata(pdf_filename, path)
                
                # Create GitHub raw URL
                github_url = f"{self.raw_base_url}/{urllib.parse.quote(path)}"
                
                textbook_entry = {
                    'level': parsed['level'],
                    'subject': parsed['subject'] or 'unknown',
                    'grade': parsed['grade'] or 'unknown',
                    'semester': parsed['semester'] or 'unknown',
                    'publisher': parsed['publisher'],
                    'title': parsed['parsed_name'],
                    'file_path': path,
                    'file_name': pdf_filename,
                    'download_url': github_url,  # Keep for backward compatibility
                    'international_url': github_url,  # International users always use GitHub direct
                    'china_url': github_url,  # Will be updated after URL testing
                    'is_split': parsed['is_split'],
                    'part_number': parsed['part_number'],
                    'file_size': file_size
                }
                
                textbooks.append(textbook_entry)
                
                # Collect data for URL testing
                if self.test_urls:
                    url_test_data.append((github_url, path))
        
        print(f"✅ Found and processed {pdf_count} PDF files out of {total_files} total repository entries")
        if ignored_count > 0:
            print(f"🚫 Ignored {ignored_count} files based on path patterns")
        print(f"📊 Generated {len(textbooks)} textbook entries (each split part shown separately)")
        
        # Second pass: test URLs and update china_url field
        if self.test_urls and url_test_data and self.url_tester:
            print(f"\n🔗 Starting URL testing for {len(url_test_data)} PDF files...")
            url_results = self.url_tester.test_multiple_urls(url_test_data)
            
            # Update textbook entries with tested URLs
            for textbook in textbooks:
                github_url = textbook['download_url']
                if github_url in url_results:
                    result_data = url_results[github_url]
                    textbook['china_url'] = result_data['urls']['china_url']
                    # Add testing metadata for debugging
                    textbook['jsdelivr_works'] = result_data['jsdelivr_works']
                    textbook['test_status_code'] = result_data['status_code']
            
            print(f"✅ URL testing completed and china_url fields updated")
        
        return textbooks

def generate_javascript_file(textbook_data: List[Dict], output_file: str = 'textbook-data.js'):
    """Generate JavaScript file with comprehensive textbook data including location-aware URLs"""
    
    # Generate statistics
    stats = {
        'total_entries': len(textbook_data),
        'main_files': len([t for t in textbook_data if not t['is_split']]),
        'split_files': len([t for t in textbook_data if t['is_split']]),
        'levels': len(set(t['level'] for t in textbook_data)),
        'subjects': len(set(t['subject'] for t in textbook_data)),
        'publishers': len(set(t['publisher'] for t in textbook_data))
    }
    
    # Add URL testing statistics if available
    tested_entries = [t for t in textbook_data if 'jsdelivr_works' in t]
    if tested_entries:
        jsdelivr_working = len([t for t in tested_entries if t.get('jsdelivr_works', False)])
        jsdelivr_failed = len(tested_entries) - jsdelivr_working
        stats.update({
            'url_tested': len(tested_entries),
            'jsdelivr_working': jsdelivr_working,
            'jsdelivr_failed': jsdelivr_failed,
            'jsdelivr_success_rate': round((jsdelivr_working / len(tested_entries) * 100), 1) if tested_entries else 0
        })
    
    js_content = f"""// Dynamic Chinese Textbook Data with Location-Aware URLs
// Auto-generated from GitHub repository: https://github.com/TapXWorld/ChinaTextbook
// Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
// Statistics: {json.dumps(stats, ensure_ascii=False)}
//
// URL Structure:
// - international_url: GitHub direct (for international users)
// - china_url: jsDelivr CDN or ghfast.top fallback (for China users)
// - download_url: GitHub direct (backward compatibility)

const TEXTBOOK_DATA = {json.dumps(textbook_data, ensure_ascii=False, indent=2)};

// Create TextbookData class for easy data access
class TextbookData {{
    constructor(data) {{
        this.data = data;
    }}
    
    getLevels() {{
        return [...new Set(this.data.map(book => book.level))];
    }}
    
    getSubjects(level) {{
        return [...new Set(this.data.filter(book => book.level === level).map(book => book.subject))];
    }}
    
    getGrades(level, subject) {{
        return [...new Set(this.data.filter(book => book.level === level && book.subject === subject).map(book => book.grade))];
    }}
    
    filter(criteria) {{
        return this.data.filter(book => {{
            return Object.keys(criteria).every(key => book[key] === criteria[key]);
        }});
    }}
    
    getStats() {{
        return {json.dumps(stats, ensure_ascii=False)};
    }}
}}

// Create global instance
window.textbookData = new TextbookData(TEXTBOOK_DATA);
"""

    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    return output_file, stats

def main():
    print("🚀 Dynamic Chinese Textbook Data Generator")
    print("📡 Specifically designed for TapXWorld/ChinaTextbook repository")
    print("📚 Using GitHub Trees API for efficient data retrieval...")
    
    # Initialize scanner - hardcoded for TapXWorld/ChinaTextbook repository
    # You can optionally provide a GitHub token for higher rate limits:
    # scanner = GitHubTextbookScanner(token="your_github_token_here")
    scanner = GitHubTextbookScanner()
    
    try:
        # Get repository tree structure
        tree_data = scanner.get_repository_tree()
        
        if not tree_data:
            print("❌ Failed to fetch repository tree. Exiting.")
            return
        
        # Process tree data to extract PDF information
        raw_textbooks = scanner.process_tree_data(tree_data)
        
        # Filter out unknown entries for cleaner data
        print(f"🧹 Filtering out entries with unknown level or subject...")
        unknown_before = len([book for book in raw_textbooks if book['level'] == 'unknown' or book['subject'] == 'unknown'])
        
        filtered_data = [
            book for book in raw_textbooks 
            if book['level'] != 'unknown' and book['subject'] != 'unknown'
        ]
        
        print(f"📊 Filtered out {unknown_before} entries with unknown data")
        print(f"✅ Final processed textbook entries: {len(filtered_data)}")
        
        # Generate JavaScript file
        print("📝 Generating JavaScript data file...")
        output_file, stats = generate_javascript_file(filtered_data)
        
        print(f"🎉 Successfully generated {output_file}")
        print(f"📊 Statistics:")
        for key, value in stats.items():
            if key.startswith('jsdelivr_'):
                print(f"   🔗 {key}: {value}")
            else:
                print(f"   📚 {key}: {value}")
        
        # Show URL testing summary if available
        if 'url_tested' in stats:
            print(f"\n🔗 URL Testing Summary:")
            print(f"   ✅ jsDelivr working: {stats['jsdelivr_working']}")
            print(f"   ❌ jsDelivr failed: {stats['jsdelivr_failed']}")
            print(f"   📈 Success rate: {stats['jsdelivr_success_rate']}%")
            print(f"   💡 China users will get jsDelivr for working URLs, ghfast.top fallback for failed ones")
            print(f"   🌍 International users always get GitHub direct URLs")
        
        # Show sample data
        print(f"\n🔍 Sample entries:")
        for i, entry in enumerate(filtered_data[:5]):
            split_info = f" (part {entry['part_number']})" if entry.get('is_split') else ""
            jsdelivr_status = ""
            if 'jsdelivr_works' in entry:
                jsdelivr_status = " ✅" if entry['jsdelivr_works'] else " ❌"
            print(f"   {i+1}. {entry['level']}/{entry['subject']}/{entry['grade']} - {entry['publisher']}{split_info}{jsdelivr_status}")
        
        print(f"\n💡 The generated file can be used directly in your web application!")
        print(f"   Include it with: <script src='{output_file}'></script>")
        print(f"   Access URLs: entry.international_url (international) or entry.china_url (China)")
        
        # Show unique levels, subjects, and publishers found
        levels = sorted(set(book['level'] for book in filtered_data if book['level'] != 'unknown'))
        subjects = sorted(set(book['subject'] for book in filtered_data if book['subject'] != 'unknown'))
        publishers = sorted(set(book['publisher'] for book in filtered_data if book['publisher'] != '未知出版社'))
        
        print(f"\n📋 Found data structure:")
        print(f"   Levels: {levels}")
        print(f"   Subjects: {subjects[:10]}{'...' if len(subjects) > 10 else ''}")
        print(f"   Publishers: {publishers[:10]}{'...' if len(publishers) > 10 else ''}")
        
    except KeyboardInterrupt:
        print("\n⚠️ Process interrupted by user")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main() 
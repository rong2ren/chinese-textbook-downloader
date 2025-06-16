// Global variables
let textbookDataInstance;
let isChinaUser = null; // Cache the China detection result

// Level configuration and management
function getLevelConfig(level) {
    const configs = {
        '小学': { icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12M12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"/></svg>', english: 'Elementary School' },
        '小学（五•四学制）': { icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12M12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"/></svg>', english: 'Elementary (5-4 System)' },
        '初中': { icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9L12 15L21 11V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/></svg>', english: 'Middle School' },
        '初中（五•四学制）': { icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9L12 15L21 11V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/></svg>', english: 'Middle School (5-4 System)' },
        '高中': { icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9L12 15L21 11V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/></svg>', english: 'High School' },
        '大学': { icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L2 7V10H22V7L12 3M4 11V16H6V11H4M18 11V16H20V11H18M8 11V16H10V11H8M14 11V16H16V11H14M2 17H22V19H2V17Z"/></svg>', english: 'University' },
    };
    
    // Return config or create dynamic fallback
    return configs[level] || { 
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 2L14 6.5V17.5L19 13V2M6.5 5C4.55 5 2.45 5.4 1 6.5V21.16C1 21.41 1.25 21.66 1.5 21.66C1.6 21.66 1.65 21.59 1.75 21.59C3.1 20.94 5.05 20.5 6.5 20.5C8.45 20.5 10.55 20.9 12 22C13.45 20.9 15.55 20.5 17.5 20.5C18.95 20.5 20.9 20.94 22.25 21.59C22.35 21.59 22.4 21.66 22.5 21.66C22.75 21.66 23 21.41 23 21.16V6.5C21.55 5.4 19.45 5 17.5 5C15.55 5 13.45 5.4 12 6.5C10.55 5.4 8.45 5 6.5 5Z"/></svg>', 
        english: level.includes('学制') ? level.replace('（', ' (').replace('）', ')') : level 
    };
}

// Level behavior utility functions
function shouldIgnoreGrades(level) {
    // University level ignores grade filtering
    return level === '大学';
}

function shouldUseWideCards(level) {
    // University level uses wide cards
    return level === '大学';
}

function shouldUseDirectSubjectAccess(level) {
    // University level goes directly to subjects
    return level === '大学';
}



// Education level sorting
function sortEducationLevels(levels) {
    const LEVEL_ORDER = ['小学', '小学（五•四学制）', '初中', '初中（五•四学制）', '高中', '大学'];
    
    return levels.sort((a, b) => {
        const indexA = LEVEL_ORDER.indexOf(a);
        const indexB = LEVEL_ORDER.indexOf(b);
        
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }
        
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        return a.localeCompare(b, 'zh-CN');
    });
}

function sortGrades(grades) {
    return grades.sort((a, b) => {
        // Extract numbers for numeric comparison
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        
        // Enhanced special handling for different grade types
        const gradeTypeOrder = {
            '练习题': 1000,  // Practice materials go last
            '中考数学': 900,  // Middle school entrance exam
            '高考数学': 901,  // College entrance exam
            '数学练习': 902,  // Math practice
            'university': 800,  // University courses
            'unknown': 1001
        };
        
        // Check if grades have special ordering
        if (gradeTypeOrder[a] && gradeTypeOrder[b]) {
            return gradeTypeOrder[a] - gradeTypeOrder[b];
        }
        if (gradeTypeOrder[a]) return 1;  // a goes after regular grades
        if (gradeTypeOrder[b]) return -1; // b goes after regular grades
        
        // Handle year-based grades (一年级, 二年级, etc.)
        if (a.includes('年级') && b.includes('年级')) {
            const yearA = convertChineseNumberToInt(a.match(/[一二三四五六七八九十]+/)?.[0] || '0');
            const yearB = convertChineseNumberToInt(b.match(/[一二三四五六七八九十]+/)?.[0] || '0');
            return yearA - yearB;
        }
        
        // Handle middle/high school grades (七年级, 八年级, 九年级)
        if ((a.includes('年级') || b.includes('年级')) && (numA > 0 || numB > 0)) {
            return numA - numB;
        }
        
        // Handle high school grades (高一, 高二, 高三) and middle school (初一, 初二, 初三)
        if ((a.includes('高') || a.includes('初')) && (b.includes('高') || b.includes('初'))) {
            return numA - numB;
        }
        
        // Handle university courses (必修, 选修)
        if (a.includes('必修') && b.includes('必修')) {
            return numA - numB;
        }
        if (a.includes('选修') && b.includes('选修')) {
            return numA - numB;
        }
        if (a.includes('必修') && b.includes('选修')) return -1; // 必修 before 选修
        if (a.includes('选修') && b.includes('必修')) return 1;
        
        // Handle practice materials
        if (a.includes('练习') && b.includes('练习')) {
            return a.localeCompare(b, 'zh-CN');
        }
        
        // Default to numeric comparison, then alphabetical
        if (numA !== numB && numA > 0 && numB > 0) {
            return numA - numB;
        }
        
        return a.localeCompare(b, 'zh-CN');
    });
}

function convertChineseNumberToInt(chineseNum) {
    const chineseToNum = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
    };
    
    // Handle simple cases like 一, 二, 三
    if (chineseToNum[chineseNum]) {
        return chineseToNum[chineseNum];
    }
    
    // Handle 十 (10) and compound numbers like 一十一, 一十二 (rare in grades)
    if (chineseNum === '十') return 10;
    
    return 0; // fallback
}

// Initialize the application
async function initializeApp() {
    // Use the global textbookData instance from textbook-data.js
    textbookDataInstance = window.textbookData;
    
    // Initialize China detection using browser-based detection
    const isChina = initializeChinaDetection();
    updateUIForRegion(isChina);
    
    // Hide loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    console.log('✅ Location detection complete using browser fallback');
    
    // Remove debug console logs for production
    // console.log('Textbook data loaded with stats:', textbookDataInstance.getStats());
    // console.log('Available levels:', textbookDataInstance.getLevels());
    
    // Generate navigation and sections
    generateNavigation();
    generateLevelSections();
    updateStats();
    initializeDownloadCount();
    
    // Close button is now handled by the form method="dialog" automatically
    
    // Show first level by default
    const rawLevels = textbookDataInstance.getLevels();
    const sortedLevels = sortEducationLevels(rawLevels);
    const firstLevel = sortedLevels[0];
    if (firstLevel) {
        showLevel(firstLevel);
    }
}

// Call the initialization function
// Check if DOM is already loaded, if so run immediately, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already loaded, run immediately
    initializeApp();
}

// Update UI based on detected region
function updateUIForRegion(isChina) {
    const regionIndicator = document.getElementById('region-indicator');
    
    if (regionIndicator) {
        if (isChina) {
            regionIndicator.innerHTML = `
                <span class="region-text">中国用户 - <a href="location-detection.html" target="_blank" style="color: inherit; text-decoration: underline;">测试下载</a></span>
            `;
            regionIndicator.className = 'region-china';
        } else {
            regionIndicator.innerHTML = `<span class="region-text">国际用户 - <a href="location-detection.html" target="_blank" style="color: inherit; text-decoration: underline;">测试下载</a></span>
            `;
            regionIndicator.className = 'region-international';
        }
    }
}

// Generate navigation dynamically
function generateNavigation() {
    const navButtons = document.querySelector('.nav-buttons');
    if (!navButtons) return;
    
    // Clear existing navigation
    navButtons.innerHTML = '';
    
    // Get levels and sort them properly
    const rawLevels = textbookDataInstance.getLevels();
    const levels = sortEducationLevels(rawLevels);
    
    levels.forEach((level, index) => {
        const config = getLevelConfig(level);
        
        const button = document.createElement('button');
        button.className = `nav-btn ${index === 0 ? 'active' : ''}`;
        button.setAttribute('data-level', level);
        // Create elements safely to prevent XSS
        const icon = document.createElement('span');
        icon.innerHTML = config.icon;
        
        const span = document.createElement('span');
        span.textContent = level;
        
        const small = document.createElement('small');
        small.textContent = config.english;
        
        button.appendChild(icon);
        button.appendChild(span);
        button.appendChild(small);
        
        button.addEventListener('click', function() {
            // Update button states
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show appropriate content
            showLevel(level);
        });
        
        navButtons.appendChild(button);
    });
}

// Generate level sections dynamically
function generateLevelSections() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    // Clear existing sections (keep footer)
    const existingSections = mainContent.querySelectorAll('.level-section');
    existingSections.forEach(section => section.remove());
    
    // Get levels and sort them properly
    const rawLevels = textbookDataInstance.getLevels();
    const levels = sortEducationLevels(rawLevels);
    
    levels.forEach((level, index) => {
        const levelSection = document.createElement('div');
        levelSection.className = `level-section ${index === 0 ? 'active' : ''}`;
        levelSection.id = `level-${level}`;
        
        // Create header
        const levelConfig = getLevelConfig(level);
        
        const header = document.createElement('h2');
        // Create header safely to prevent XSS
        const headerIcon = document.createElement('span');
        headerIcon.innerHTML = levelConfig.icon;
        header.appendChild(headerIcon);
        header.appendChild(document.createTextNode(` ${level}教材 ${levelConfig.english}`));
        levelSection.appendChild(header);
        
        // Create grade grid
        const gradeGrid = document.createElement('div');
        gradeGrid.className = 'grade-grid';
        
        // Get all unique grades for this level and sort them
        let subjects = [];
        const allGrades = new Set();
        
        try {
            subjects = textbookDataInstance.getSubjects(level);
            if (subjects && Array.isArray(subjects)) {
                subjects.forEach(subject => {
                    const grades = textbookDataInstance.getGrades(level, subject);
                    if (grades && Array.isArray(grades)) {
                        grades.forEach(grade => allGrades.add(grade));
                    }
                });
            }
        } catch (e) {
            console.error('Error loading level data for', level, ':', e);
        }
        
        const gradesArray = sortGrades(Array.from(allGrades));
        
        // Handle levels based on configuration
        if (shouldUseDirectSubjectAccess(level)) {
            // Levels that use direct subject access (like university) get a single wide card
            const displayName = shouldIgnoreGrades(level) ? 
                `${level}课程 ${getLevelConfig(level).english}` : 
                getGradeDisplayName('university');
            const gradeCard = createGradeCard(level, 'university', displayName, shouldUseWideCards(level));
            gradeGrid.appendChild(gradeCard);
        } else {
            // Create grade cards for each grade
            gradesArray.forEach(grade => {
                const gradeCard = createGradeCard(level, grade, getGradeDisplayName(grade), shouldUseWideCards(level));
                gradeGrid.appendChild(gradeCard);
            });
        }
        
        levelSection.appendChild(gradeGrid);
        mainContent.appendChild(levelSection);
    });
}

// Create a grade card
function createGradeCard(level, grade, displayName, isWide = false) {
    const gradeCard = document.createElement('div');
    gradeCard.className = `grade-card ${isWide ? 'wide' : ''}`;
    gradeCard.setAttribute('data-level', level);
    gradeCard.setAttribute('data-grade', grade);
    
    const header = document.createElement('h3');
    header.textContent = displayName;
    gradeCard.appendChild(header);
    
    const subjectsContainer = document.createElement('div');
    subjectsContainer.className = isWide ? 'subjects university-subjects' : 'subjects';
    gradeCard.appendChild(subjectsContainer);
    
    // Create inline publisher section
    const inlineSection = document.createElement('div');
    inlineSection.className = 'inline-publishers';
    inlineSection.style.display = 'none';
    inlineSection.innerHTML = `
        <h4 class="publisher-title">选择版本 Choose Version</h4>
        <div class="publisher-options"></div>
        <div class="inline-downloads" style="display: none;">
            <div class="download-buttons"></div>
        </div>
    `;
    gradeCard.appendChild(inlineSection);
    
    // Populate subjects immediately
    populateSubjects(gradeCard, level, grade);
    
    return gradeCard;
}

// Get display name for grade
function getGradeDisplayName(grade) {
    const gradeDisplayMap = {
        'university': '大学课程 University Courses',
        'unknown': '其他教材 Other Materials'
    };
    
    return gradeDisplayMap[grade] || grade;
}

// Show level
function showLevel(level) {
    
    // Cache DOM queries for better performance
    const allLevelSections = document.querySelectorAll('.level-section');
    const targetLevelSection = document.getElementById(`level-${level}`);
    
    // Hide all level sections
    allLevelSections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected level
    if (targetLevelSection) {
        targetLevelSection.classList.add('active');
    }
    
    // Hide all publisher sections
    hideAllPublisherSections();
}

// Populate subjects dynamically based on available data
function populateSubjects(gradeCard, level, grade) {
    const subjectsContainer = gradeCard.querySelector('.subjects');
    if (!subjectsContainer || !textbookDataInstance) return;
    
    let subjects;
    try {
        if (shouldUseDirectSubjectAccess(level)) {
            // For levels with direct subject access, get all subjects for the level
            subjects = textbookDataInstance.getSubjects(level);
        } else {
            // For grade-based levels, get subjects that have books for this specific grade
            const allSubjects = textbookDataInstance.getSubjects(level);
            if (allSubjects && Array.isArray(allSubjects)) {
                subjects = allSubjects.filter(subject => {
                    const grades = textbookDataInstance.getGrades(level, subject);
                    return grades && Array.isArray(grades) && grades.includes(grade);
                });
            } else {
                subjects = [];
            }
        }
    } catch (e) {
        console.error('Error loading subjects:', e);
        subjects = [];
    }
    
    // Sort subjects for better organization
    const sortedSubjects = sortSubjects(subjects);
    
    // Clear existing subjects
    subjectsContainer.innerHTML = '';
    
    // Add subject buttons with special styling for different subjects
    sortedSubjects.forEach(subject => {
        const subjectBtn = document.createElement('button');
        
        // Determine subject type and apply appropriate styling
        const isPractice = subject.includes('练习') || subject.includes('中考数学') || subject.includes('高考数学');
        const isMath = subject.includes('数学') && !isPractice;
        const isChinese = subject.includes('语文') || subject.includes('中文') || subject.includes('汉语');
        
        // Apply appropriate CSS classes
        let className = 'subject-btn';
        if (isPractice) {
            className += ' practice-subject';
        } else if (isMath) {
            className += ' math-subject';
        } else if (isChinese) {
            className += ' chinese-subject';
        }
        subjectBtn.className = className;
        
        // No icons for subjects - just text
        subjectBtn.appendChild(document.createTextNode(subject));
        
        subjectBtn.addEventListener('click', function() {
            selectSubject(this, gradeCard, level, grade, subject);
        });
        subjectsContainer.appendChild(subjectBtn);
    });
}

// Handle subject selection
function selectSubject(subjectBtn, gradeCard, level, grade, subject) {
    // Update subject button states
    gradeCard.querySelectorAll('.subject-btn').forEach(btn => btn.classList.remove('active'));
    subjectBtn.classList.add('active');
    
    // Clear any existing downloads section when switching subjects
    const downloadsSection = gradeCard.querySelector('.inline-downloads');
    if (downloadsSection) {
        downloadsSection.style.display = 'none';
        const downloadButtons = downloadsSection.querySelector('.download-buttons');
        if (downloadButtons) {
            downloadButtons.innerHTML = '';
        }
    }
    
    // Clear any active publisher selections
    gradeCard.querySelectorAll('.publisher-option').forEach(option => {
        option.classList.remove('active');
    });
    
    // Load publisher options
    loadInlinePublisherOptions(gradeCard, level, subject, grade);
}

// Create better publisher name from filename when publisher is unknown
function createPublisherFromFilename(filename, originalPublisher) {
    // If publisher is not unknown, return as is
    if (originalPublisher !== "未知出版社") {
        return originalPublisher;
    }
    
    // Input validation
    if (!filename || typeof filename !== 'string') {
        return '未知出版社';
    }
    
    // Remove file extension and split file indicators (.pdf.1, .pdf.2, etc.)
    let baseName = filename.replace(/\.pdf(\.\d+)?$/i, '').trim();
    
    if (!baseName) {
        return '未知出版社';
    }
    
    // Extract meaningful publisher information from common patterns
    
    // Pattern 1: Publisher name in parentheses - e.g., "概率论与数理统计(浙大四版).pdf" -> "浙大四版"
    const publisherInParens = baseName.match(/\(([^)]+)\)$/);
    if (publisherInParens && publisherInParens[1].trim()) {
        return publisherInParens[1].trim();
    }
    
    // Pattern 2: University name at start - e.g., "同济大学《线性代数》..." -> "同济大学"
    const universityMatch = baseName.match(/^([^《]+大学)/);
    if (universityMatch && universityMatch[1].trim()) {
        return universityMatch[1].trim();
    }
    
    // Pattern 3: Edition information - e.g., "离散数学及其应用(第6版)" -> "离散数学及其应用(第6版)"
    const editionMatch = baseName.match(/^([^(]+\([^)]*版[^)]*\))/);
    if (editionMatch && editionMatch[1].trim()) {
        return editionMatch[1].trim();
    }
    
    // Pattern 4: For English titles, extract main title before edition info
    const englishMatch = baseName.match(/^([^0-9]+?)(?:\s+\d+(?:st|nd|rd|th)?\s+Edition|\s+\d{4})/i);
    if (englishMatch && englishMatch[1].trim()) {
        return englishMatch[1].trim();
    }
    
    // Pattern 5: Extract main title before version/edition numbers
    const mainTitleMatch = baseName.match(/^([^第]+?)(?:第\d+版|版本|\d+版)/);
    if (mainTitleMatch && mainTitleMatch[1].trim()) {
        return mainTitleMatch[1].trim();
    }
    
    // Pattern 6: For practice/answer books, use the main subject
    if (baseName.includes('练习题') || baseName.includes('答案') || baseName.includes('习题')) {
        const practiceMatch = baseName.match(/^(\d*版?[^练习题答案习题]*)/);
        if (practiceMatch && practiceMatch[1].trim()) {
            return practiceMatch[1].trim() + ' (练习材料)';
        }
    }
    
    // Fallback: Use first meaningful part of filename (up to 25 characters for better readability)
    const fallback = baseName.substring(0, 25).trim();
    return fallback + (baseName.length > 25 ? '...' : '');
}

// Group books by enhanced publisher (considering filename-based publishers)
function groupBooksByEnhancedPublisher(books) {
    const publisherGroups = {};
    
    books.forEach(book => {
        const enhancedPublisher = createPublisherFromFilename(book.file_name, book.publisher);
        
        if (!publisherGroups[enhancedPublisher]) {
            publisherGroups[enhancedPublisher] = [];
        }
        
        publisherGroups[enhancedPublisher].push({
            ...book,
            enhanced_publisher: enhancedPublisher
        });
    });
    
    return publisherGroups;
}

// Load inline publisher options
function loadInlinePublisherOptions(gradeCard, level, subject, grade) {
    const publishersSection = gradeCard.querySelector('.inline-publishers');
    if (!publishersSection) return;
    
    const publisherOptions = publishersSection.querySelector('.publisher-options');
    if (!publisherOptions) return;
    
    // Clear existing options
    publisherOptions.innerHTML = '';
    
    // Also ensure downloads section is hidden when loading new publishers
    const downloadsSection = gradeCard.querySelector('.inline-downloads');
    if (downloadsSection) {
        downloadsSection.style.display = 'none';
        const downloadButtons = downloadsSection.querySelector('.download-buttons');
        if (downloadButtons) {
            downloadButtons.innerHTML = '';
        }
    }
    
    // Find matching textbooks for this level, subject, and grade
    if (!textbookDataInstance) return;
    
    let matchingBooks;
    try {
        if (shouldIgnoreGrades(level)) {
            // For levels that ignore grades, filter without grade constraint
            matchingBooks = textbookDataInstance.filter({
                level: level,
                subject: subject
            });
        } else {
            // For grade-based levels, include grade in filtering
            // Check if grade is actually a filename
            if (grade && grade.includes('.pdf')) {
                matchingBooks = textbookDataInstance.filter({
                    level: level,
                    subject: subject
                });
            } else {
                matchingBooks = textbookDataInstance.filter({
                    level: level,
                    subject: subject,
                    grade: grade
                });
            }
        }
    } catch (e) {
        console.error('Error loading books:', e);
        matchingBooks = [];
    }
    
    if (matchingBooks.length === 0) {
        publisherOptions.innerHTML = '<p>暂无可用教材</p>';
        return;
    }
    
    // Group books by enhanced publisher (using filename when publisher is unknown)
    const publisherGroups = groupBooksByEnhancedPublisher(matchingBooks);
    
    // Create publisher options
    Object.entries(publisherGroups).forEach(([enhancedPublisher, books]) => {
        const publisherOption = document.createElement('div');
        publisherOption.className = 'publisher-option';
        publisherOption.textContent = enhancedPublisher;
        
        publisherOption.addEventListener('click', function() {
            selectInlinePublisher(publisherOption, gradeCard, level, subject, grade, enhancedPublisher, books);
        });
        
        publisherOptions.appendChild(publisherOption);
    });
    
    // Show publishers section
    publishersSection.style.display = 'block';
}

// Book grouping strategies
const BookGroupingStrategies = {
    byBaseTitle: (books) => {
        const groups = new Map();
        
        books.forEach(book => {
            // Extract base title by removing common suffixes and normalizing
            let baseTitle = book.title
                .replace(/[上下]册$/, '')
                .replace(/第[一二三四五六七八九十]+册$/, '')
                .replace(/\s*\([^)]*\)$/, '') // Remove parenthetical info
                .trim();
            
            // Normalize whitespace and punctuation for consistent grouping
            baseTitle = baseTitle
                .replace(/\s*·\s*/g, '·')  // Normalize spaces around ·
                .replace(/\s*\.\s*/g, '.')  // Normalize spaces around .
                .replace(/\s+/g, ' ')       // Normalize multiple spaces to single space
                .trim();
            
            if (!groups.has(baseTitle)) {
                groups.set(baseTitle, new Map());
            }
            
            const titleGroup = groups.get(baseTitle);
            const semester = book.semester || 'unknown';
            
            if (!titleGroup.has(semester)) {
                titleGroup.set(semester, { mains: [], splits: [] });
            }
            
            const semesterGroup = titleGroup.get(semester);
            if (book.is_split) {
                semesterGroup.splits.push(book);
            } else {
                semesterGroup.mains.push(book);
            }
        });
        
        return groups;
    }
};

// UI Component builders
const UIComponents = {
    createDownloadButton: (book, className = 'download-btn main-file-btn') => {
        const button = document.createElement('button');
        button.className = className;
        
        const icon = document.createElement('i');
        icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 20H19V18H5M19 9H15V3H9V9H5L12 16L19 9Z"/></svg>';
        button.appendChild(icon);
        button.appendChild(document.createTextNode(` ${book.title}`));
        
        button.addEventListener('click', () => {
            downloadFromUrl(getDownloadUrl(book), book.file_name, book);
        });
        
        return button;
    },
    
    createSplitFileSection: (splitBooks, semester = 'unknown') => {
        if (!splitBooks || splitBooks.length === 0) return null;
        
        const section = document.createElement('div');
        section.className = 'split-files-section';
        
        // Create split files header with warning and help button
        const header = document.createElement('div');
        header.className = 'split-files-header';
        
        // Warning message
        const warning = document.createElement('div');
        warning.className = 'split-warning';
        
        const icon = document.createElement('i');
        icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 14H11V10H13M13 18H11V16H13M1 21H23L12 2L1 21Z"/></svg>';
        warning.appendChild(icon);
        
        // Get base filename for warning
        const baseFileName = splitBooks[0]?.file_name?.replace(/\.pdf(\.\d+)?$/, '.pdf') || '该文件';
        warning.appendChild(document.createTextNode(` ${baseFileName} 文件太大，请下载分割文件：`));
        
        // Help button
        const helpButton = document.createElement('button');
        helpButton.className = 'help-btn split-help-btn';
        helpButton.onclick = openHelpModal;
        
        const helpIcon = document.createElement('i');
        helpIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M12 17C11.45 17 11 16.55 11 16S11.45 15 12 15 13 15.45 13 16 12.55 17 12 17M13 13H11V6H13V13Z"/></svg>';
        helpButton.appendChild(helpIcon);
        helpButton.appendChild(document.createTextNode(' 分割文件说明'));
        
        header.appendChild(warning);
        header.appendChild(helpButton);
        section.appendChild(header);
        
        // Create split buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'split-container';
        
        // Get semester display name for button labels
        const semesterDisplayName = getSemesterDisplayName(semester);
        const semesterShort = semester === 'first' ? '上册' : semester === 'second' ? '下册' : '';
        
        splitBooks
            .sort((a, b) => (a.part_number || 0) - (b.part_number || 0))
            .forEach((splitBook, index) => {
                const partLabel = semesterShort 
                    ? `${semesterShort}第${splitBook.part_number || (index + 1)}部分`
                    : `第${splitBook.part_number || (index + 1)}部分`;
                
                const button = UIComponents.createDownloadButton(
                    {
                        ...splitBook,
                        title: partLabel
                    },
                    'download-btn split-file-btn'
                );
                buttonsContainer.appendChild(button);
            });
        
        section.appendChild(buttonsContainer);
        return section;
    },
    
    createTitleSection: (baseTitle, semesterGroups, publisherName = '') => {
        const section = document.createElement('div');
        section.className = 'title-section';
        
        // Title header with publisher prefix (avoid duplication)
        const header = document.createElement('h4');
        header.className = 'title-header';
        
        // Don't add publisher prefix if:
        // 1. No publisher name provided
        // 2. Publisher is unknown/default
        // 3. Publisher name is already contained in the base title (or vice versa)
        // 4. Publisher and base title are very similar (one is substring of other)
        const shouldAddPublisher = publisherName && 
                                  publisherName !== '未知出版社' && 
                                  !baseTitle.includes(publisherName) &&
                                  !publisherName.includes(baseTitle) &&
                                  publisherName !== baseTitle;
        
        const displayTitle = shouldAddPublisher ? `${publisherName} ${baseTitle}` : baseTitle;
        header.textContent = displayTitle;
        section.appendChild(header);
        
        // Content container
        const content = document.createElement('div');
        content.className = 'title-downloads';
        
        // Collect and render main files
        const allMainFiles = [];
        
        semesterGroups.forEach((books) => {
            allMainFiles.push(...books.mains);
        });
        
        // Render main files in a row
        if (allMainFiles.length > 0) {
            const mainFilesRow = document.createElement('div');
            mainFilesRow.className = 'main-files-row';
            
            allMainFiles.forEach(book => {
                const button = UIComponents.createDownloadButton(book);
                mainFilesRow.appendChild(button);
            });
            
            content.appendChild(mainFilesRow);
        }
        
        // Render split files by semester
        semesterGroups.forEach((books, semester) => {
            if (books.splits && books.splits.length > 0) {
                const splitSection = UIComponents.createSplitFileSection(books.splits, semester);
                if (splitSection) {
                    content.appendChild(splitSection);
                }
            }
        });
        
        section.appendChild(content);
        return section;
    },


};

// Main functions with improved architecture
function selectInlinePublisher(publisherOption, gradeCard, level, subject, grade, enhancedPublisher, books) {
    
    // Update UI state
    gradeCard.querySelectorAll('.publisher-option').forEach(option => {
        option.classList.remove('active');
    });
    publisherOption.classList.add('active');
    
    // Clear and prepare downloads section
    const downloadsSection = gradeCard.querySelector('.inline-downloads');
    const downloadButtons = downloadsSection?.querySelector('.download-buttons');
    
    if (downloadButtons) {
        downloadButtons.innerHTML = '';
        downloadsSection.style.display = 'none';
    }
    
    // Validate input
    const matchingBooks = books || [];
    if (matchingBooks.length === 0) {
        if (downloadButtons) {
            downloadButtons.innerHTML = '<p>暂无可用下载</p>';
            downloadsSection.style.display = 'block';
        }
        return;
    }
    
    // Transform data and render
    const groupedBooks = BookGroupingStrategies.byBaseTitle(matchingBooks);
    renderBookGroups(downloadButtons, groupedBooks, enhancedPublisher);
    
    if (downloadsSection) {
        downloadsSection.style.display = 'block';
    }
}

function renderBookGroups(container, groupedBooks, publisherName = '') {
    if (!container || !groupedBooks) return;
    
    container.innerHTML = '';
    
    // Sort groups by title for consistent display
    const sortedGroups = Array.from(groupedBooks.entries())
        .sort(([titleA], [titleB]) => titleA.localeCompare(titleB, 'zh-CN'));
    
    sortedGroups.forEach(([baseTitle, semesterGroups]) => {
        const titleSection = UIComponents.createTitleSection(baseTitle, semesterGroups, publisherName);
        container.appendChild(titleSection);
    });
}



// Get display name for semester
function getSemesterDisplayName(semester) {
    const semesterMap = {
        'first': '上册 (First Semester)',
        'second': '下册 (Second Semester)', 
        'complete': '全册 (Complete)',
        'practice': '练习题 (Practice Materials)',
        'unknown': '教材 (Textbook)'
    };
    
    return semesterMap[semester] || semester;
}

// Detect if user is in China and should use China-friendly URLs
// Initialize China detection once and cache the result
function initializeChinaDetection() {
    // Check for URL parameter override first
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('isChina')) {
        const isChinaParam = urlParams.get('isChina').toLowerCase();
        isChinaUser = isChinaParam === 'true' || isChinaParam === '1';
        console.log(`🔧 URL parameter override detected: isChina=${isChinaParam} → ${isChinaUser ? 'China mode' : 'International mode'}`);
        return isChinaUser;
    }
    

    
    // Fallback to browser-based detection
    const language = navigator.language || navigator.userLanguage;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Check for Chinese language or China timezone
    isChinaUser = language.includes('zh-CN') || 
                  language.includes('zh') || 
                  timezone.includes('Shanghai') || 
                  timezone.includes('Beijing');
    
    return isChinaUser;
}

// Get cached China detection result (called during downloads)
function shouldUseChinaUrls() {
    // Return cached result if available
    if (isChinaUser !== null) {
        return isChinaUser;
    }
    
    // Initialize if not cached yet (fallback)
    return initializeChinaDetection();
}

// Get appropriate download URL based on user location
function getDownloadUrl(book) {
    // Use shouldUseChinaUrls which handles URL parameter override and location detection
    const isChina = shouldUseChinaUrls();
    
    if (isChina) {
        // For China users: Use pre-computed china_url (jsDelivr or configurable proxy fallback)
        if (book.jsdelivr_works) {
            return book.china_url;
        } else {
            const proxy = window.FALLBACK_PROXY_CONFIG ? window.FALLBACK_PROXY_CONFIG.getCurrentProxy() : 'https://ghfast.top/';
            return proxy + book.china_url;
        }
    } else {
        // For international users: Use pre-computed international_url (GitHub direct)
        return book.international_url;
    }
}

// Download from URL - uses pre-computed location-aware URLs with fallback support
function downloadFromUrl(url, filename, book = null) {
    // Use pre-computed location-aware URL if available
    const actualUrl = book ? getDownloadUrl(book) : url;
    const isChina = shouldUseChinaUrls();
    
    // Log download initiation
    console.log(`📥 Initiating download: ${filename}`);
    console.log(`🔗 Download URL: ${actualUrl}`);
    
    // Show download warning for large files if user is in China
    if (book && isChina) {
        if (!showDownloadWarning(book, null)) {
            return; // User cancelled download
        }
    }
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = actualUrl;
    link.download = filename;
    
    // Add error handling for China users with fallback URLs
    if (book && book._fallbackUrl && isChina) {
        link.addEventListener('error', function() {
            console.warn('⚠️ Primary download failed, trying fallback URL');
            
            // Show user that we're trying fallback
            const fallbackNotification = document.createElement('div');
            fallbackNotification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f39c12;
                color: white;
                padding: 15px;
                border-radius: 8px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                font-size: 14px;
                max-width: 300px;
            `;
            fallbackNotification.innerHTML = `
                <strong>🔄 正在尝试备用下载链接...</strong><br>
                <small>Primary link failed, trying backup proxy</small>
            `;
            document.body.appendChild(fallbackNotification);
            
            // Try fallback URL
            const fallbackLink = document.createElement('a');
            fallbackLink.href = book._fallbackUrl;
            fallbackLink.download = filename;
            
            document.body.appendChild(fallbackLink);
            fallbackLink.click();
            document.body.removeChild(fallbackLink);
            
            // Remove notification after 3 seconds
            setTimeout(() => {
                if (fallbackNotification.parentNode) {
                    document.body.removeChild(fallbackNotification);
                }
            }, 3000);
        });
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Update download count
    updateDownloadCount();
}

// Hide all publisher sections
function hideAllPublisherSections(exceptGradeCard = null) {
    const allInlinePublishers = document.querySelectorAll('.inline-publishers');
    const allGradeCards = document.querySelectorAll('.grade-card');
    
    allInlinePublishers.forEach(section => {
        section.style.display = 'none';
        const downloads = section.querySelector('.inline-downloads');
        if (downloads) downloads.style.display = 'none';
    });
    
    allGradeCards.forEach(card => {
        // Only remove expanded class and clear selections for cards other than the exception
        if (card !== exceptGradeCard) {
            card.classList.remove('expanded');
            card.querySelectorAll('.subject-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        }
    });
}

// Update statistics - enhanced to handle new data structure
function updateStats() {
    if (!textbookDataInstance) return;
    
    try {
        const stats = textbookDataInstance.getStats();
        
        // Cache DOM queries for better performance
        const totalElement = document.querySelector('[data-stat="total"]');
        const publishersElement = document.querySelector('[data-stat="publishers"]');
        const levelsElement = document.querySelector('[data-stat="levels"]');
        const subjectsElement = document.querySelector('[data-stat="subjects"]');
        const splitFilesElement = document.querySelector('[data-stat="split-files"]');
        
        // Update statistics safely
        if (totalElement) {
            totalElement.textContent = stats.total_entries || stats.totalTextbooks || '0';
        }
        
        if (publishersElement) {
            publishersElement.textContent = stats.publishers || '0';
        }
        
        if (levelsElement) {
            levelsElement.textContent = stats.levels || '0';
        }
        
        if (subjectsElement) {
            subjectsElement.textContent = stats.subjects || '0';
        }
        
        if (splitFilesElement) {
            splitFilesElement.textContent = stats.split_files || '0';
        }
    } catch (e) {
        console.error('Error updating statistics:', e);
    }
}

// Download count functionality
function updateDownloadCount() {
    const today = new Date().toDateString();
    let downloadCount = parseInt(localStorage.getItem(`downloads_${today}`) || '0');
    downloadCount++;
    localStorage.setItem(`downloads_${today}`, downloadCount.toString());
    
    const downloadElement = document.querySelector('[data-stat="downloads"]');
    if (downloadElement) {
        downloadElement.textContent = downloadCount;
    }
}

// Initialize download count on page load
function initializeDownloadCount() {
    const today = new Date().toDateString();
    const downloadCount = parseInt(localStorage.getItem(`downloads_${today}`) || '0');
    
    const downloadElement = document.querySelector('[data-stat="downloads"]');
    if (downloadElement) {
        downloadElement.textContent = downloadCount;
    }
}

// Show download warning for large files in China
function showDownloadWarning(book, button) {
    // Only show warning for files larger than 50MB
    const fileSizeBytes = book.file_size || 0;
    const fileSizeMB = fileSizeBytes / (1024 * 1024);
    
    if (fileSizeMB > 50) {
        const confirmed = confirm(
            `文件较大 (${fileSizeMB.toFixed(1)}MB)，可能下载较慢。\n` +
            `Large file (${fileSizeMB.toFixed(1)}MB), download may be slow.\n\n` +
            `是否继续下载？\nContinue download?`
        );
        
        if (!confirmed) {
            return false;
        }
    }
    
    return true;
}

// Configuration-driven subject sorting  
function sortSubjects(subjects) {
    const subjectOrder = [
        '语文', '数学', '英语', '物理', '化学', '生物学', '生物',
        '历史', '地理', '政治', '道德与法治', '思想品德', '科学',
        '音乐', '美术', '体育与健康', '信息技术', '书法',
        '综合实践', '通用技术', '传统文化', '国学', '经典诵读'
    ];
    
    return subjects.sort((a, b) => {
        const indexA = subjectOrder.indexOf(a);
        const indexB = subjectOrder.indexOf(b);
        
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }
        
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        return a.localeCompare(b, 'zh-CN');
    });
}

// Help Modal Functions (Global scope)
function openHelpModal() {
    const dialog = document.getElementById('helpModal');
    if (dialog) {
        // Check if showModal is supported (native dialog support)
        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        } else {
            // Fallback for browsers without native dialog support
            dialog.style.display = 'block';
            dialog.setAttribute('open', '');
            document.body.style.overflow = 'hidden';
        }
    }
}

function closeHelpModal() {
    const dialog = document.getElementById('helpModal');
    if (dialog) {
        // Check if close is supported (native dialog support)
        if (typeof dialog.close === 'function') {
            dialog.close();
        } else {
            // Fallback for browsers without native dialog support
            dialog.style.display = 'none';
            dialog.removeAttribute('open');
            document.body.style.overflow = '';
        }
    }
}

// Close dialog when clicking outside of it (on the backdrop)
document.getElementById('helpModal').addEventListener('click', function(event) {
    const dialog = event.target;
    const rect = dialog.getBoundingClientRect();
    
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) {
        dialog.close();
    }
});
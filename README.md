# Chinese Textbook Download Website

A comprehensive website for downloading Chinese textbooks from elementary to university level.

## Features

- **Complete Coverage**: Elementary (小学), Middle School (初中), High School (高中), and University (大学) textbooks
- **Multiple Publishers**: Support for 50+ publishers including 人教版, 北师大版, 苏教版, etc.
- **Streamlined Interface**: Single-step download process - select publisher and download immediately
- **Automatic Updates**: Automated script to sync with latest repository data

## Current Statistics

- **Total Textbooks**: 1,464 entries
- **Elementary**: 890 textbooks
- **Middle School**: 439 textbooks  
- **University**: 13 textbooks
- **Publishers**: 50+ different publishers

## TextBook data Updates

### Quick Update
```bash
python3 generate_textbook_data.py
```

### What the Script Does
1. **Fetches Latest Data**: Connects to TapXWorld/ChinaTextbook GitHub repository
2. **Analyzes Structure**: Processes 1,905+ PDF files across all education levels

### Script Features
- ✅ **GitHub API Integration**: Fetches real-time repository data
- ✅ **Intelligent Parsing**: Handles different path structures for each education level
- ✅ **Publisher Recognition**: Maps 50+ publishers with proper display names

### Output Example
```
🚀 Starting automatic textbook database update...
📡 Repository: TapXWorld/ChinaTextbook
🔄 Fetching latest repository data...
✅ Found 1905 PDF files in repository
📊 Analyzing repository structure...
✅ Generated 1464 configuration entries
✅ textbook-config.js updated successfully!

📚 BY EDUCATION LEVEL:
  小学 Elementary: 890 entries
  初中 Middle School: 439 entries
  大学 University: 13 entries

🎓 UNIVERSITY SUBJECTS (13 total):
  概率论: 1 entries
  离散数学: 3 entries
  线性代数: 2 entries
  高等数学: 7 entries
```

## File Structure

```
textbook/
├── index.html              # Main website interface
├── styles.css              # Website styling
├── script.js               # Website functionality
├── textbook-config.js      # Textbook database (auto-generated)
├── update_textbook_database.py  # Automation script
└── README.md               # This file
```

## Usage

### For End Users
1. Open `index.html` in a web browser
2. Select education level (小学/初中/高中/大学)
3. Choose subject and grade
4. Select publisher and download immediately

### For Administrators
1. Run the update script when needed:
   ```bash
   python3 update_textbook_database.py
   ```
2. Refresh the website to see latest textbooks
3. The script can be run periodically to stay synchronized with the source repository

## Technical Details

### Supported Education Levels
- **Elementary (小学)**: Grades 1-6, multiple subjects and publishers
- **Middle School (初中)**: Grades 7-9, comprehensive subject coverage
- **High School (高中)**: Grades 10-12, advanced subjects
- **University (大学)**: Higher mathematics, probability, discrete math, linear algebra

### Publisher Support
The system recognizes and properly displays 50+ publishers including:
- 人教版 (人民教育出版社)
- 北师大版 (北京师范大学出版社)
- 苏教版 (江苏教育出版社)
- 统编版 (人民教育出版社)
- 同济大学版 (同济大学出版社)
- And many more...

### Data Source
All textbook data is sourced from the [TapXWorld/ChinaTextbook](https://github.com/TapXWorld/ChinaTextbook) GitHub repository, ensuring access to the most comprehensive collection of Chinese educational materials.

## Requirements

- Python 3.6+
- `curl` command (for GitHub API access)
- Web browser (for website usage)

## License

This project is for educational purposes. All textbook content belongs to their respective publishers and copyright holders. 
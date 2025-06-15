// Display Configuration for Chinese Textbook Website
// This configuration controls how education levels are ordered and displayed

const DEFAULT_DISPLAY_CONFIG = {
    // Level ordering and basic information
    "levelOrder": [
        { 
            "key": "xiaoxue", 
            "name": "小学", 
            "icon": "fas fa-child", 
            "english": "Elementary School",
            "enabled": true
        },
        { 
            "key": "xiaoxue45", 
            "name": "小学（五•四学制）", 
            "icon": "fas fa-child", 
            "english": "Elementary (5-4 System)",
            "enabled": true
        },
        { 
            "key": "chuzhong", 
            "name": "初中", 
            "icon": "fas fa-user-graduate", 
            "english": "Middle School",
            "enabled": true
        },
        { 
            "key": "chuzhong45", 
            "name": "初中（五•四学制）", 
            "icon": "fas fa-user-graduate", 
            "english": "Middle School (5-4 System)",
            "enabled": true
        },
        { 
            "key": "gaozhong", 
            "name": "高中", 
            "icon": "fas fa-graduation-cap", 
            "english": "High School",
            "enabled": true
        },
        { 
            "key": "daxue", 
            "name": "大学", 
            "icon": "fas fa-university", 
            "english": "University",
            "enabled": true
        }
    ],

    // Display rules for each education level
    "levelDisplayRules": {
        "xiaoxue": {
            "primaryGroup": "grade",
            "secondaryGroup": "subject",
            "showFields": ["grade", "subject", "semester", "publisher"],
            "gradeLabel": "年级",
            "useWideCards": false,
            "behaviorFlags": {
                "ignoreGradeFiltering": false,
                "useDirectSubjectAccess": false,
                "useWideCards": false,
                "groupBySubject": false,
                "skipGradeValidation": false
            },
            "dataHandling": {
                "gradeField": "required",
                "primaryHierarchy": ["grade", "subject", "publisher"],
                "filterIgnoreFields": []
            },
            "handleUnknown": {
                "grade": { "show": true, "label": "其他年级", "groupSeparately": true },
                "subject": { "show": true, "label": "其他科目" },
                "semester": { "show": true, "fallback": "全册" },
                "publisher": { "show": true, "fallback": "未知出版社" }
            }
        },
        "xiaoxue45": {
            "primaryGroup": "grade",
            "secondaryGroup": "subject", 
            "showFields": ["grade", "subject", "semester", "publisher"],
            "gradeLabel": "年级",
            "useWideCards": false,
            "behaviorFlags": {
                "ignoreGradeFiltering": false,
                "useDirectSubjectAccess": false,
                "useWideCards": false,
                "groupBySubject": false,
                "skipGradeValidation": false
            },
            "dataHandling": {
                "gradeField": "required",
                "primaryHierarchy": ["grade", "subject", "publisher"],
                "filterIgnoreFields": []
            },
            "handleUnknown": {
                "grade": { "show": true, "label": "其他年级", "groupSeparately": true },
                "subject": { "show": true, "label": "其他科目" },
                "semester": { "show": true, "fallback": "全册" },
                "publisher": { "show": true, "fallback": "未知出版社" }
            }
        },
        "chuzhong": {
            "primaryGroup": "grade",
            "secondaryGroup": "subject",
            "showFields": ["grade", "subject", "semester", "publisher"],
            "gradeLabel": "年级", 
            "useWideCards": false,
            "behaviorFlags": {
                "ignoreGradeFiltering": false,
                "useDirectSubjectAccess": false,
                "useWideCards": false,
                "groupBySubject": false,
                "skipGradeValidation": false
            },
            "dataHandling": {
                "gradeField": "required",
                "primaryHierarchy": ["grade", "subject", "publisher"],
                "filterIgnoreFields": []
            },
            "handleUnknown": {
                "grade": { "show": true, "label": "其他年级", "groupSeparately": true },
                "subject": { "show": true, "label": "其他科目" },
                "semester": { "show": true, "fallback": "全册" },
                "publisher": { "show": true, "fallback": "未知出版社" }
            }
        },
        "chuzhong45": {
            "primaryGroup": "grade",
            "secondaryGroup": "subject",
            "showFields": ["grade", "subject", "semester", "publisher"],
            "gradeLabel": "年级",
            "useWideCards": false,
            "behaviorFlags": {
                "ignoreGradeFiltering": false,
                "useDirectSubjectAccess": false,
                "useWideCards": false,
                "groupBySubject": false,
                "skipGradeValidation": false
            },
            "dataHandling": {
                "gradeField": "required",
                "primaryHierarchy": ["grade", "subject", "publisher"],
                "filterIgnoreFields": []
            },
            "handleUnknown": {
                "grade": { "show": true, "label": "其他年级", "groupSeparately": true },
                "subject": { "show": true, "label": "其他科目" },
                "semester": { "show": true, "fallback": "全册" },
                "publisher": { "show": true, "fallback": "未知出版社" }
            }
        },
        "gaozhong": {
            "primaryGroup": "grade",
            "secondaryGroup": "subject",
            "showFields": ["grade", "subject", "semester", "publisher"],
            "gradeLabel": "年级",
            "useWideCards": false,
            "behaviorFlags": {
                "ignoreGradeFiltering": false,
                "useDirectSubjectAccess": false,
                "useWideCards": false,
                "groupBySubject": false,
                "skipGradeValidation": false
            },
            "dataHandling": {
                "gradeField": "required",
                "primaryHierarchy": ["grade", "subject", "publisher"],
                "filterIgnoreFields": []
            },
            "handleUnknown": {
                "grade": { "show": true, "label": "其他年级", "groupSeparately": true },
                "subject": { "show": true, "label": "其他科目" },
                "semester": { "show": true, "fallback": "全册" },
                "publisher": { "show": true, "fallback": "未知出版社" }
            }
        },
        "daxue": {
            "primaryGroup": "subject",
            "secondaryGroup": "publisher",
            "showFields": ["subject", "publisher"],
            "gradeLabel": "课程",
            "useWideCards": true,
            "specialHandling": "university",
            "behaviorFlags": {
                "ignoreGradeFiltering": true,      // Skip grade-based filtering
                "useDirectSubjectAccess": true,    // Go directly from level to subjects
                "useWideCards": true,              // Use wide layout cards
                "groupBySubject": true,            // Primary grouping by subject, not grade
                "skipGradeValidation": true        // Don't validate grade existence
            },
            "dataHandling": {
                "gradeField": "ignore",            // How to handle grade field
                "primaryHierarchy": ["subject", "publisher"],  // Skip grade level
                "filterIgnoreFields": ["grade"]    // Fields to ignore in filtering
            },
            "handleUnknown": {
                "grade": { "show": false },  // University doesn't show grades
                "subject": { "show": true, "label": "通用课程" },
                "semester": { "show": false },  // University doesn't typically use semesters
                "publisher": { "show": true, "fallback": "未知出版社" }
            }
        }
    },

    // Grade display names and sorting
    "gradeDisplayMap": {
        "一年级": "一年级 Grade 1",
        "二年级": "二年级 Grade 2", 
        "三年级": "三年级 Grade 3",
        "四年级": "四年级 Grade 4",
        "五年级": "五年级 Grade 5",
        "六年级": "六年级 Grade 6",
        "七年级": "初一 Grade 7",
        "八年级": "初二 Grade 8", 
        "九年级": "初三 Grade 9",
        "高一": "高一 Grade 10",
        "高二": "高二 Grade 11",
        "高三": "高三 Grade 12",
        "低年级": "低年级 Lower Elementary",
        "中年级": "中年级 Middle Elementary", 
        "高年级": "高年级 Upper Elementary",
        "练习题": "练习题 Practice",
        "数学练习": "数学练习 Math Practice", 
        "中考练习": "中考练习 Middle School Entrance Exam Practice",
        "高考练习": "高考练习 College Entrance Exam Practice",
        "中考数学": "中考数学 Middle School Entrance Exam",
        "高考数学": "高考数学 College Entrance Exam",
        "university": "大学课程 University Courses",
        "必修1": "必修1 Required Course 1",
        "必修2": "必修2 Required Course 2",
        "必修3": "必修3 Required Course 3",
        "必修4": "必修4 Required Course 4",
        "必修5": "必修5 Required Course 5",
        "选修1": "选修1 Elective Course 1",
        "选修2": "选修2 Elective Course 2",
        "选修3": "选修3 Elective Course 3",
        "全一册": "全一册 Complete Volume",
        "unknown": "其他教材 Other Materials"
    },

    // Subject sorting preferences
    "subjectOrder": [
        "语文", "数学", "英语", "物理", "化学", "生物学", "历史", "地理", "政治", 
        "道德与法治", "科学", "音乐", "美术", "体育与健康", "信息技术",
        "高等数学", "线性代数", "概率论", "大学物理", "大学英语", "计算机",
        "数学练习", "中考数学", "高考数学", "练习题"
    ]
};

// Configuration management class
class DisplayConfigManager {
    constructor() {
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            // Try to load from localStorage first
            const saved = localStorage.getItem('displayConfig');
            if (saved) {
                const parsed = JSON.parse(saved);
                console.log('Loaded display configuration from localStorage');
                return this.mergeWithDefaults(parsed);
            }
        } catch (e) {
            console.warn('Failed to load configuration from localStorage:', e);
        }

        return JSON.parse(JSON.stringify(DEFAULT_DISPLAY_CONFIG)); // Deep copy
    }

    mergeWithDefaults(userConfig) {
        // Merge user configuration with defaults to ensure all required fields exist
        const merged = JSON.parse(JSON.stringify(DEFAULT_DISPLAY_CONFIG)); // Deep copy defaults
        
        // Merge level order
        if (userConfig.levelOrder) {
            merged.levelOrder = userConfig.levelOrder;
        }
        
        // Merge level display rules
        if (userConfig.levelDisplayRules) {
            Object.keys(userConfig.levelDisplayRules).forEach(level => {
                if (merged.levelDisplayRules[level]) {
                    merged.levelDisplayRules[level] = {
                        ...merged.levelDisplayRules[level],
                        ...userConfig.levelDisplayRules[level]
                    };
                } else {
                    merged.levelDisplayRules[level] = userConfig.levelDisplayRules[level];
                }
            });
        }

        return merged;
    }

    saveConfig() {
        try {
            localStorage.setItem('displayConfig', JSON.stringify(this.config));
            console.log('Saved display configuration to localStorage');
        } catch (e) {
            console.error('Failed to save configuration:', e);
        }
    }

    // Get enabled levels in configured order
    getEnabledLevels() {
        return this.config.levelOrder
            .filter(level => level.enabled !== false)
            .map(level => ({
                key: level.key,
                name: level.name,
                icon: level.icon,
                english: level.english
            }));
    }

    // Get level configuration by name
    getLevelConfig(levelName) {
        // First find the level in levelOrder
        const levelInfo = this.config.levelOrder.find(level => level.name === levelName);
        if (!levelInfo) {
            return null;
        }

        // Then get the display rules
        const displayRules = this.config.levelDisplayRules[levelInfo.key];
        
        return {
            ...levelInfo,
            displayRules: displayRules
        };
    }

    // Get level key by name
    getLevelKey(levelName) {
        const levelInfo = this.config.levelOrder.find(level => level.name === levelName);
        return levelInfo ? levelInfo.key : null;
    }

    // Get level info by key (for reverse lookup)
    getLevelByKey(levelKey) {
        return this.config.levelOrder.find(level => level.key === levelKey);
    }

    // Update level order
    updateLevelOrder(newOrder) {
        this.config.levelOrder = newOrder;
        this.saveConfig();
    }

    // Toggle level enabled status
    toggleLevel(levelKey, enabled) {
        const level = this.config.levelOrder.find(l => l.key === levelKey);
        if (level) {
            level.enabled = enabled;
            this.saveConfig();
        }
    }

    // Get grade display name
    getGradeDisplayName(grade) {
        return this.config.gradeDisplayMap[grade] || grade;
    }

    // Get subject sorting order
    getSubjectOrder() {
        return this.config.subjectOrder;
    }
}

// Make configuration available globally
if (typeof window !== 'undefined') {
    window.DEFAULT_DISPLAY_CONFIG = DEFAULT_DISPLAY_CONFIG;
    window.DisplayConfigManager = DisplayConfigManager;
    window.displayConfig = new DisplayConfigManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DEFAULT_DISPLAY_CONFIG, DisplayConfigManager };
} 
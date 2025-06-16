# 中国教材下载中心 | Chinese Textbook Download Center

[![GitHub stars](https://img.shields.io/github/stars/rong2ren/chinese-textbook-downloader?style=social)](https://github.com/rong2ren/chinese-textbook-downloader/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/rong2ren/chinese-textbook-downloader?style=social)](https://github.com/rong2ren/chinese-textbook-downloader/network)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> 🎓 中国教材下载网站 
> Chinese textbook download website


## 📸 截图 | Screenshots

### 页面头部 | Header & Navigation
![Header Interface](screenshots/header.png)

### 小学界面 | Elementary School Interface
![Elementary School](screenshots/elementary.png)

### 初中界面 | Middle School Interface
![Middle School](screenshots/middle.png)

### 高中界面 | High School Interface
![High School](screenshots/high.png)

### 大学界面 | University Level Interface
![University Interface](screenshots/university.png)

## ✨ 主要功能 | Key Features

### 🌍 智能下载 | Smart Download
- **自动地区检测** | Automatic location detection
- **中国用户优化** | China-optimized with jsDelivr CDN + proxy fallback
- **国际用户支持** | International users with direct GitHub access

### 📚 完整教材库 | Complete Textbook Database
**数据来源 | Data Source**: [TapXWorld/ChinaTextbook](https://github.com/TapXWorld/ChinaTextbook) - 完整的中国教材收藏 | Complete Chinese textbook collection

- **2,371+ 本教材** | 2,371+ textbooks
- **6个教育阶段** | 6 education levels: 小学, 初中, 高中, 大学, etc.
- **27个学科** | 27 subjects: 数学, 语文, 英语, 科学, etc.
- **125+ 出版社** | 125+ publishers

## 🚀 快速开始 | Quick Start

### 在线访问 | Online Access
直接访问网站 | Visit directly:
- https://china-edu-books.vercel.app
- https://textbooks.schoolbase.org
(Cloudflare and Vercel)

### 本地运行 | Local Development
```bash
# 克隆仓库 | Clone repository
git clone https://github.com/rong2ren/chinese-textbook-downloader.git
cd chinese-textbook-downloader

# 启动本地服务器 | Start local server
python3 -m http.server 8000
# 或 | or: npx serve .

# 访问 | Access: http://localhost:8000
```

### 测试中国模式 | Test China Mode
```
http://localhost:8000/index.html?isChina=true
```

## 🔧 配置 | Configuration

### 代理配置 | Proxy Configuration
编辑 `fallback-proxy-config.js` | Edit `fallback-proxy-config.js`:
```javascript
window.FALLBACK_PROXY_CONFIG = {
    currentProxy: 'https://your-proxy-service.com/',
};
```

### CDN 缓存刷新 | CDN Cache Refresh
更新 `textbook-data.js` 后刷新 jsDelivr 缓存 | Refresh jsDelivr cache after updating `textbook-data.js`:

**方法1 | Method 1**: 浏览器访问 | Visit in browser:
```
https://purge.jsdelivr.net/gh/rong2ren/chinese-textbook-downloader@main/textbook-data.js
```

**方法2 | Method 2**: 命令行 | Command line:
```bash
curl "https://purge.jsdelivr.net/gh/rong2ren/chinese-textbook-downloader@main/textbook-data.js"
```

> 💡 **提示 | Tip**: 通常24小时内缓存会自动更新 | Cache usually updates automatically within 24 hours

## 📊 统计数据 | Statistics

| 指标 Metric | 数值 Value |
|-------------|------------|
| 教材总数 Total Textbooks | 2,371+ |
| 教育阶段 Education Levels | 6 |
| 学科数量 Subjects | 27 |
| 出版社 Publishers | 125+ |
| jsDelivr成功率 Success Rate | 63.3% |
| 备用覆盖率 Fallback Coverage | 100% |

## 🙏 致谢 | Acknowledgments

- **TapXWorld/ChinaTextbook**: 原始教材数据库 | Original textbook database
- **jsDelivr**: 中国用户CDN服务 | CDN service for China users
- **GitHub**: 可靠的文件托管 | Reliable file hosting
- **Vercel**: 网站托管平台 | Website hosting platform
- **Cloudflare**: 域名与DNS服务 | Domain and DNS services


本项目仅用于教育和研究目的。所有教材版权归各自出版社和作者所有。请支持正版出版物。

This project is for educational and research purposes only. All textbooks are property of their respective publishers and authors. Please support official publications.

---

<div align="center">
  <p>用❤️为中国教育而建 | Made with ❤️ for Chinese education</p>
</div> 

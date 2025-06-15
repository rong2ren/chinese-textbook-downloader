/**
 * Location-based Download Link Manager
 * Detects if user is in China and serves appropriate download links
 */

class LocationBasedDownloader {
    constructor() {
        this.userLocation = null;
        this.isChina = false;
        this.detectionComplete = false;
    }

    /**
     * Method 1: Using IP Geolocation API (Free tier available)
     */
    async detectLocationWithAPI() {
        try {
            // Using ipapi.co (free tier: 1000 requests/day)
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            this.userLocation = {
                country: data.country_name,
                countryCode: data.country_code,
                city: data.city,
                ip: data.ip
            };
            
            // Check if user is in China (including Hong Kong, Macau, Taiwan)
            this.isChina = ['CN', 'HK', 'MO', 'TW'].includes(data.country_code);
            this.detectionComplete = true;
            
            console.log(`🌍 User location detected: ${data.country_name} (${data.country_code})`);
            
            return this.isChina;
        } catch (error) {
            console.warn('⚠️ IP geolocation failed, falling back to timezone detection:', error);
            return this.detectLocationWithTimezone();
        }
    }

    /**
     * Method 2: Fallback using timezone detection
     */
    detectLocationWithTimezone() {
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            console.log(`🕐 User timezone: ${timezone}`);
            
            // China timezones
            const chinaTimezones = [
                'Asia/Shanghai',
                'Asia/Beijing',
                'Asia/Chongqing',
                'Asia/Harbin',
                'Asia/Kashgar',
                'Asia/Urumqi',
                'Asia/Hong_Kong',
                'Asia/Macau',
                'Asia/Taipei'
            ];
            
            this.isChina = chinaTimezones.includes(timezone);
            this.detectionComplete = true;
            
            return this.isChina;
        } catch (error) {
            console.warn('⚠️ Timezone detection failed, defaulting to China (safer):', error);
            this.isChina = true; // Default to China for safety
            this.detectionComplete = true;
            return true;
        }
    }

    /**
     * Method 3: Test connectivity to GitHub (alternative approach)
     */
    async testGitHubConnectivity() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
            
            const response = await fetch('https://api.github.com/zen', {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                console.log('✅ GitHub is accessible');
                return true;
            } else {
                console.log('❌ GitHub access limited');
                return false;
            }
        } catch (error) {
            console.log('❌ GitHub connectivity test failed:', error.message);
            return false;
        }
    }

    /**
     * Get appropriate download URL based on user location
     */
    getDownloadUrl(filePath) {
        if (!this.detectionComplete) {
            console.warn('⚠️ Location detection not complete, using China-safe URLs');
            return this.getChinaUrls(filePath);
        }

        if (this.isChina) {
            return this.getChinaUrls(filePath);
        } else {
            return this.getNonChinaUrls(filePath);
        }
    }

    /**
     * URLs for China users (jsDelivr + fallback)
     */
    getChinaUrls(filePath) {
        const encodedPath = encodeURIComponent(filePath);
        
        return {
            primary: `https://cdn.jsdelivr.net/gh/TapXWorld/ChinaTextbook@master/${encodedPath}`,
            fallback: `${window.FALLBACK_PROXY_CONFIG ? window.FALLBACK_PROXY_CONFIG.getCurrentProxy() : 'https://ghfast.top/'}https://raw.githubusercontent.com/TapXWorld/ChinaTextbook/master/${encodedPath}`,
            region: 'China'
        };
    }

    /**
     * URLs for non-China users (direct GitHub only)
     */
    getNonChinaUrls(filePath) {
        const encodedPath = encodeURIComponent(filePath);
        
        return {
            primary: `https://raw.githubusercontent.com/TapXWorld/ChinaTextbook/master/${encodedPath}`,
            fallback: null, // No fallback needed for international users
            region: 'International'
        };
    }

    /**
     * Smart download with automatic fallback
     */
    async downloadFile(filePath, filename) {
        const urls = this.getDownloadUrl(filePath);
        
        console.log(`📥 Attempting download for ${this.userLocation?.country || 'Unknown'} user`);
        console.log(`🔗 Primary URL: ${urls.primary}`);
        
        try {
            // Try primary URL first
            const response = await fetch(urls.primary, { method: 'HEAD' });
            
            if (response.ok) {
                console.log('✅ Primary URL accessible, starting download');
                this.triggerDownload(urls.primary, filename);
                return true;
            } else {
                throw new Error(`Primary URL failed: ${response.status}`);
            }
        } catch (error) {
            console.warn('⚠️ Primary URL failed, trying fallback:', error.message);
            console.log(`🔗 Fallback URL: ${urls.fallback}`);
            
            try {
                const fallbackResponse = await fetch(urls.fallback, { method: 'HEAD' });
                
                if (fallbackResponse.ok) {
                    console.log('✅ Fallback URL accessible, starting download');
                    this.triggerDownload(urls.fallback, filename);
                    return true;
                } else {
                    throw new Error(`Fallback URL also failed: ${fallbackResponse.status}`);
                }
            } catch (fallbackError) {
                console.error('❌ Both URLs failed:', fallbackError.message);
                this.showDownloadError(urls);
                return false;
            }
        }
    }

    /**
     * Trigger file download
     */
    triggerDownload(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`📥 Download triggered: ${filename}`);
    }

    /**
     * Show download error with manual links
     */
    showDownloadError(urls) {
        const errorHtml = `
            <div class="download-error" style="
                background: #fee; 
                border: 1px solid #fcc; 
                padding: 15px; 
                border-radius: 5px; 
                margin: 10px 0;
            ">
                <h4>⚠️ 自动下载失败 / Download Failed</h4>
                <p>请尝试以下链接手动下载 / Please try these links manually:</p>
                <ul>
                    <li><a href="${urls.primary}" target="_blank">主链接 / Primary Link</a></li>
                    <li><a href="${urls.fallback}" target="_blank">备用链接 / Fallback Link</a></li>
                </ul>
            </div>
        `;
        
        // You can customize where to show this error message
        const errorContainer = document.getElementById('download-error-container') || document.body;
        errorContainer.innerHTML = errorHtml;
    }
}

// Note: Initialization is handled by the main script.js file
// This class is just the location detection functionality

/**
 * Enhanced download function for textbook buttons
 */
async function downloadTextbook(filePath, filename) {
    // Show loading state
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '下载中... / Downloading...';
    button.disabled = true;
    
    try {
        const success = await downloader.downloadFile(filePath, filename);
        
        if (success) {
            button.textContent = '✅ 下载成功 / Downloaded';
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 2000);
        } else {
            button.textContent = '❌ 下载失败 / Failed';
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 3000);
        }
    } catch (error) {
        console.error('Download error:', error);
        button.textContent = '❌ 下载失败 / Failed';
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 3000);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocationBasedDownloader;
} 
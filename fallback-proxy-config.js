/**
 * Fallback Proxy Configuration for Chinese Textbook Download System
 * 
 * This file provides configurable proxy settings for China users when jsDelivr CDN fails.
 * Allows instant proxy switching without regenerating textbook data.
 * 
 * Usage:
 * - To get current proxy: FALLBACK_PROXY_CONFIG.getCurrentProxy()
 * - To change proxy: Edit currentProxy value and deploy
 */

window.FALLBACK_PROXY_CONFIG = {
    // Current active proxy (change this for instant switching)
    currentProxy: 'https://ghfast.top/',
    
    /**
     * Get the current active proxy URL
     * @returns {string} Current proxy URL
     */
    getCurrentProxy: function() {
        return this.currentProxy;
    }
};


// Global constants for theme
window.themeConstants = {
  BREAKPOINTS: {
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400
  }
};

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.themeConstants;
} 
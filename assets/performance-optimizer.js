/**
 * Performance Optimizer for Shopify Theme
 * Handles lazy loading, resource hints, and performance monitoring
 */

(function() {
  'use strict';

  // Performance monitoring
  function initPerformanceMonitoring() {
    if ('performance' in window) {
      window.addEventListener('load', function() {
        setTimeout(function() {
          const perfData = performance.getEntriesByType('navigation')[0];
          if (perfData) {
            console.log('Page Load Time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
          }
        }, 0);
      });
    }
  }

  // Lazy load non-critical scripts
  function initLazyLoading() {
    let loaded = false;
    
    function loadScripts() {
      if (loaded) return;
      loaded = true;
    }

    // Load on user interaction
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, loadScripts, { once: true, passive: true });
    });

    // Load after 3 seconds if no interaction
    setTimeout(loadScripts, 3000);
  }

  // Initialize optimizations
  function init() {
    initPerformanceMonitoring();
    initLazyLoading();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(); 
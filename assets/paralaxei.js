// Vanilla JS rewrite of Parallaxie
// Copyright (c) 2016 THE ULTRASOFT (http://theultrasoft.com)
// MIT License

(function() {
  // Performance optimization utilities
  const ParallaxUtils = {
    throttle: function(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },
    raf: function(callback) {
      return window.requestAnimationFrame ? window.requestAnimationFrame(callback) : setTimeout(callback, 16);
    }
  };

  // Global scroll handler for all parallax elements
  let parallaxElements = [];
  let scrollHandler = null;

  function initScrollHandler() {
    if (scrollHandler) return;
    scrollHandler = ParallaxUtils.throttle(function() {
      ParallaxUtils.raf(() => {
        parallaxElements.forEach(function(item) {
          try {
            parallax_scroll(item.el, item.options);
          } catch (error) {
            console.warn('Parallax scroll error:', error);
          }
        });
      });
    }, 16); // ~60fps
    window.addEventListener('scroll', scrollHandler, { passive: true });
  }

  function parallaxie(selector, options = {}) {
    const defaultOptions = {
      speed: 0.2,
      repeat: 'no-repeat',
      size: 'cover',
      pos_x: 'center',
      offset: 0,
    };
    const mergedOptions = Object.assign({}, defaultOptions, options);
    const elements = typeof selector === 'string' ? document.querySelectorAll(selector) : (selector instanceof NodeList ? selector : [selector]);
    elements.forEach(function(el) {
      let local_options = {};
      if (el.dataset.parallaxie) {
        try {
          local_options = JSON.parse(el.dataset.parallaxie);
        } catch (e) {
          // fallback: ignore if not JSON
        }
      }
      local_options = Object.assign({}, mergedOptions, local_options);
      let image_url = el.dataset.image;
      if (typeof image_url === 'undefined') {
        image_url = el.style.backgroundImage;
        if (!image_url) return;
        // APPLY DEFAULT CSS
        const rect = el.getBoundingClientRect();
        const pos_y = local_options.offset + (rect.top + window.scrollY - window.scrollY) * (1 - local_options.speed);
        el.style.backgroundImage = image_url;
        el.style.backgroundSize = local_options.size;
        el.style.backgroundRepeat = local_options.repeat;
        el.style.backgroundAttachment = 'fixed';
        el.style.backgroundPosition = `${local_options.pos_x} ${pos_y}px`;
        // Call by default for the first time on initialization.
        parallax_scroll(el, local_options);
        // Add to global parallax elements array
        parallaxElements.push({ el: el, options: local_options });
        // Initialize scroll handler if not already done
        initScrollHandler();
      }
    });
  }

  function parallax_scroll(el, local_options) {
    const rect = el.getBoundingClientRect();
    const pos_y = local_options.offset + (rect.top + window.scrollY - window.scrollY) * (1 - local_options.speed);
    el.dataset.pos_y = pos_y;
    el.style.backgroundPosition = `${local_options.pos_x} ${pos_y}px`;
  }

  // Cleanup function for removing parallax elements
  parallaxie.destroy = function(el) {
    if (el) {
      parallaxElements = parallaxElements.filter(item => item.el !== el);
    } else {
      parallaxElements = [];
      if (scrollHandler) {
        window.removeEventListener('scroll', scrollHandler);
        scrollHandler = null;
      }
    }
  };

  // Expose to global
  window.parallaxie = parallaxie;
})();

// Usage: window.parallaxie('.parallax-class', { speed: 0.2 });
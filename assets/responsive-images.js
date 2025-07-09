/**
 * Responsive Images JavaScript
 * Handles lazy loading, variant image switching, and WebP support detection
 */

class ResponsiveImages {
  constructor() {
    this.init();
  }

  init() {
    this.setupLazyLoading();
    this.setupVariantImageSwitching();
    this.setupWebPSupport();
    this.setupIntersectionObserver();
    this.setupErrorHandling();
  }

  /**
   * Setup lazy loading for images
   */
  setupLazyLoading() {
    // Check if Intersection Observer is supported
    if ('IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    } else {
      // Fallback for older browsers
      this.setupFallbackLazyLoading();
    }
  }

  /**
   * Setup Intersection Observer for lazy loading
   */
  setupIntersectionObserver() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadImage(img);
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px', // Start loading 50px before image enters viewport
      threshold: 0.01
    });

    // Observe all lazy-loaded images
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  /**
   * Load image and handle WebP support
   */
  loadImage(img) {
    const picture = img.closest('picture');
    
    if (picture) {
      // Handle picture element with multiple sources
      this.loadPictureElement(picture);
    } else {
      // Handle single img element
      this.loadSingleImage(img);
    }
  }

  /**
   * Load picture element with WebP support
   */
  loadPictureElement(picture) {
    const sources = picture.querySelectorAll('source');
    const img = picture.querySelector('img');
    
    sources.forEach(source => {
      if (source.dataset.srcset) {
        source.srcset = source.dataset.srcset;
        source.sizes = source.dataset.sizes || '';
      }
    });

    if (img && img.dataset.src) {
      img.src = img.dataset.src;
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
        img.sizes = img.dataset.sizes || '';
      }
    }

    // Remove lazy loading classes
    picture.classList.remove('lazyload');
    picture.classList.add('lazyloaded');
  }

  /**
   * Load single image element
   */
  loadSingleImage(img) {
    if (img.dataset.src) {
      img.src = img.dataset.src;
    }
    if (img.dataset.srcset) {
      img.srcset = img.dataset.srcset;
      img.sizes = img.dataset.sizes || '';
    }

    // Remove lazy loading classes
    img.classList.remove('lazyload');
    img.classList.add('lazyloaded');
  }

  /**
   * Setup variant image switching for color swatches
   */
  setupVariantImageSwitching() {
    document.addEventListener('click', (e) => {
      const colorSwatch = e.target.closest('.color-swatch');
      if (colorSwatch && colorSwatch.dataset.variantImage) {
        this.switchVariantImage(colorSwatch);
      }
    });
  }

  /**
   * Switch variant image when color swatch is clicked
   */
  switchVariantImage(colorSwatch) {
    const productCard = colorSwatch.closest('.card-product');
    if (!productCard) return;

    const variantImageUrl = colorSwatch.dataset.variantImage;
    const imageContainer = productCard.querySelector('.product-image-container');
    const variantOverlay = imageContainer.querySelector('.product-image-variant-overlay');

    if (variantOverlay) {
      // Show variant overlay
      variantOverlay.classList.add('active');
      
      // Update active swatch
      productCard.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.classList.remove('active');
      });
      colorSwatch.classList.add('active');
    }
  }

  /**
   * Setup WebP support detection
   */
  setupWebPSupport() {
    // Check WebP support
    const webpSupported = this.checkWebPSupport();
    
    if (!webpSupported) {
      // Hide WebP sources for unsupported browsers
      document.querySelectorAll('source[type="image/webp"]').forEach(source => {
        source.style.display = 'none';
      });
    }
  }

  /**
   * Check if browser supports WebP
   */
  checkWebPSupport() {
    return new Promise((resolve) => {
      const webp = new Image();
      webp.onload = webp.onerror = () => {
        resolve(webp.height === 2);
      };
      webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Setup error handling for failed image loads
   */
  setupErrorHandling() {
    document.addEventListener('error', (e) => {
      if (e.target.tagName === 'IMG') {
        this.handleImageError(e.target);
      }
    }, true);
  }

  /**
   * Handle image load errors
   */
  handleImageError(img) {
    const wrapper = img.closest('.responsive-image-wrapper, .product-image-container');
    if (wrapper) {
      wrapper.classList.add('error');
      
      // Try to load fallback image
      if (img.dataset.fallback) {
        img.src = img.dataset.fallback;
      }
    }
  }

  /**
   * Fallback lazy loading for older browsers
   */
  setupFallbackLazyLoading() {
    let ticking = false;

    const updateVisibleImages = () => {
      const images = document.querySelectorAll('img[data-src]');
      const windowHeight = window.innerHeight;
      const scrollTop = window.pageYOffset;

      images.forEach(img => {
        const rect = img.getBoundingClientRect();
        const isVisible = rect.top < windowHeight + 100 && rect.bottom > -100;

        if (isVisible) {
          this.loadImage(img);
        }
      });

      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateVisibleImages);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestTick);
    window.addEventListener('resize', requestTick);
    
    // Initial check
    updateVisibleImages();
  }

  /**
   * Preload critical images
   */
  preloadCriticalImages() {
    const criticalImages = document.querySelectorAll('[data-preload="true"]');
    criticalImages.forEach(img => {
      this.loadImage(img);
    });
  }

  /**
   * Optimize image loading based on connection speed
   */
  optimizeForConnection() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        // Reduce image quality for slow connections
        document.querySelectorAll('img[data-src]').forEach(img => {
          if (img.dataset.src.includes('width=')) {
            img.dataset.src = img.dataset.src.replace(/width=\d+/, 'width=300');
          }
        });
      }
    }
  }
}

/**
 * Initialize responsive images when DOM is ready
 */
function setDefaultSrcs() {
  document.querySelectorAll('.card-product .img-product').forEach(img => {
    if (!img.dataset.defaultSrc) {
      img.dataset.defaultSrc = img.src;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  window.responsiveImages = new ResponsiveImages();
  setDefaultSrcs();
});

/**
 * Reinitialize for dynamic content (e.g., AJAX loaded products)
 */
document.addEventListener('shopify:section:load', () => {
  if (window.responsiveImages) {
    window.responsiveImages.init();
    setDefaultSrcs();
  }
});

/**
 * Handle variant changes for product pages
 */
document.addEventListener('variant:change', (event) => {
  const variant = event.detail.variant;
  const productImage = document.querySelector('.product-image-container');
  
  if (variant && variant.featured_image && productImage) {
    // Update main product image
    const mainImage = productImage.querySelector('.product-image img');
    if (mainImage) {
      mainImage.src = variant.featured_image.src;
      mainImage.srcset = variant.featured_image.srcset;
    }
  }
});

/**
 * Robust color swatch hover handler for product cards
 */
document.addEventListener('mouseover', function(e) {
  const swatch = e.target.closest('.color-swatch');
  if (!swatch) return;

  const productCard = swatch.closest('.card-product');
  if (!productCard) return;

  const imageUrl = swatch.dataset.variantImage;
  const mainImage = productCard.querySelector('.img-product');
  const hoverImage = productCard.querySelector('.img-hover');

  if (hoverImage && mainImage) {
    if (imageUrl && imageUrl !== 'undefined') {
      hoverImage.src = imageUrl;
    } else {
      // Fallback: reset to default hover image or main image
      hoverImage.src = mainImage.src;
    }
  }
});

/**
 * On mouseout: revert to selected or default
 */
document.addEventListener('mouseout', function(e) {
  const swatch = e.target.closest('.color-swatch');
  if (!swatch) return;

  const productCard = swatch.closest('.card-product');
  if (!productCard) return;

  const activeSwatch = productCard.querySelector('.color-swatch.active');
  const mainImage = productCard.querySelector('.img-product');
  const hoverImage = productCard.querySelector('.img-hover');

  let imageUrl = '';
  if (activeSwatch && activeSwatch.dataset.variantImage && activeSwatch.dataset.variantImage !== 'undefined') {
    imageUrl = activeSwatch.dataset.variantImage;
  } else if (mainImage) {
    imageUrl = mainImage.dataset.defaultSrc || mainImage.src;
  }

  if (mainImage && imageUrl) mainImage.src = imageUrl;
  if (hoverImage && imageUrl) hoverImage.src = imageUrl;
}); 
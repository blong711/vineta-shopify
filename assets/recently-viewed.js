/**
 * Recently Viewed Section JavaScript
 * Handles the display and functionality of the recently viewed products section
 */

class RecentlyViewedSection {
  constructor() {
    this.section = document.getElementById('recently-viewed-section');
    this.productsContainer = document.getElementById('recently-viewed-products');
    this.translations = window.Shopify?.translations?.sections?.recently_viewed || {};
    
    if (!this.section || !this.productsContainer) return;
    
    this.init();
  }
  
  init() {
    // Initial render
    this.renderRecentlyViewedProducts();
    
    // Listen for updates to recently viewed products
    window.addEventListener('recentlyViewedUpdated', () => {
      this.renderRecentlyViewedProducts();
    });
    
    // Re-render when section becomes visible (for lazy loading)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.renderRecentlyViewedProducts();
        }
      });
    });
    
    observer.observe(this.section);
  }
  
  async renderRecentlyViewedProducts() {
    if (typeof window.RecentlyViewedManager === 'undefined') {
      console.warn('RecentlyViewedManager not available');
      return;
    }
    
    // Get current product ID to exclude it from the list
    const currentProductId = this.getCurrentProductId();
    
    // Get recently viewed products (excluding current product)
    const recentlyViewed = window.RecentlyViewedManager.getProductsExcludingCurrent(
      currentProductId, 
      this.getProductsToShow()
    );
    
    if (recentlyViewed.length === 0) {
      this.section.style.display = 'none';
      return;
    }
    
    // Show the section
    this.section.style.display = 'block';
    
    // Clear existing products
    this.productsContainer.innerHTML = '';
    
    // Fetch full product data for each recently viewed product
    const productPromises = recentlyViewed.map(async (product) => {
      try {
        const response = await fetch(`/products/${product.handle}.js`);
        if (!response.ok) throw new Error('Failed to fetch product data');
        const fullProduct = await response.json();
        
        // Ensure we have the image field for compare compatibility
        if (!fullProduct.image && fullProduct.featured_image) {
          fullProduct.image = fullProduct.featured_image;
        }
        
        return fullProduct;
      } catch (error) {
        console.error('Error fetching product data for', product.handle, error);
        // Return the basic product data if fetch fails, ensuring image field exists
        if (!product.image && product.featured_image) {
          product.image = product.featured_image;
        }
        return product;
      }
    });
    
    const fullProductData = await Promise.all(productPromises);
    
    // Render each product using the card-product snippet structure
    fullProductData.forEach((product) => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      
      // Create product card HTML that matches the card-product snippet structure
      slide.innerHTML = this.createProductCardHTML(product);
      
      this.productsContainer.appendChild(slide);
    });
    
    // Initialize product card functionality for the newly added products
    this.initializeProductCardFunctionality();
    
    // Initialize quickview functionality for the newly added products
    this.initializeQuickviewFunctionality();
    
    // Reinitialize Swiper if it exists
    if (window.recentlyViewedSwiper) {
      window.recentlyViewedSwiper.update();
    }
  }
  
  getCurrentProductId() {
    // Try to get product ID from various sources
    const productIdElement = document.querySelector('[data-product-id]');
    if (productIdElement) {
      return productIdElement.getAttribute('data-product-id');
    }
    
    // Try to get from product form if on product page
    const productForm = document.querySelector('form[action*="/cart/add"]');
    if (productForm) {
      const variantInput = productForm.querySelector('input[name="id"]');
      if (variantInput) {
        return variantInput.value;
      }
    }
    
    // Check if we're on a product page and can extract from URL
    const pathParts = window.location.pathname.split('/');
    if (pathParts.includes('products')) {
      const productHandle = pathParts[pathParts.indexOf('products') + 1];
      if (productHandle) {
        // This is a fallback - ideally we'd have the actual product ID
        return null;
      }
    }
    
    return null;
  }
  
  getProductsToShow() {
    // Try to get from section settings, fallback to 8
    const sectionElement = this.section;
    if (sectionElement) {
      const sectionSettingsData = sectionElement.getAttribute('data-section-settings');
      if (sectionSettingsData) {
        try {
          const sectionSettings = JSON.parse(sectionSettingsData);
          if (sectionSettings.products_to_show) {
            return parseInt(sectionSettings.products_to_show);
          }
        } catch (error) {
          console.warn('Error parsing section settings:', error);
        }
      }
    }
    return 8; // Default fallback
  }
  
  createProductCardHTML(product) {
    const addToCartText = this.translations.add_to_cart || 'Add to cart';
    const addToWishlistText = this.translations.add_to_wishlist || 'Add to wishlist';
    const quickViewText = this.translations.quick_view || 'Quick view';
    const addToCompareText = this.translations.add_to_compare || 'Add to compare';
    
    return `
      <div class="card-product style-1 ${!product.available ? 'out-of-stock' : ''}" data-availability="${product.available ? 'In stock' : 'Out of stock'}" data-brand="${product.vendor || ''}">
        <div class="card-product-wrapper asp-ratio-1">
          <a href="${product.url}" class="product-img">
            ${product.featured_image ? 
              `<img class="img-product lazyloaded" src="${product.featured_image}" alt="${product.title}" loading="lazy">` :
              `<div class="placeholder-svg">${product.title}</div>`
            }
            ${product.images && product.images[1] ? 
              `<img class="img-hover lazyloaded" src="${product.images[1]}" alt="${product.title}" loading="lazy">` : ''
            }
          </a>
          
          ${product.compare_at_price && product.compare_at_price > product.price ? 
            `<div class="on-sale-wrap">
              <span class="on-sale-item">${Math.round((product.compare_at_price - product.price) / product.compare_at_price * 100)}% Off</span>
            </div>` : ''
          }
          
          ${product.available ? `
          <ul class="list-product-btn">
            <li>
              <a href="#" 
                 class="box-icon hover-tooltip tooltip-left add-to-cart" 
                 data-variant-id="${product.variants ? product.variants[0].id : product.id}"
                 data-quantity="1"
                 aria-label="${addToCartText}">
                <i class="icon icon-cart" aria-hidden="true"></i>
                <span class="tooltip" aria-hidden="true">${addToCartText}</span>
              </a>
            </li>
            <li class="wishlist">
              <a href="#" 
                 class="box-icon hover-tooltip tooltip-left" 
                 data-wishlist 
                 data-id="${product.id}" 
                 data-action="add"
                 aria-label="${addToWishlistText}">
                <span class="icon icon-heart2" aria-hidden="true"></span>
                <span class="tooltip" aria-hidden="true">${addToWishlistText}</span>
              </a>
            </li>
            <li>
              <a href="#" 
                 class="box-icon hover-tooltip tooltip-left quickview" 
                 data-product-handle="${product.handle}"
                 data-product-id="${product.id}"
                 data-bs-toggle="modal" 
                 data-bs-target="#quickView"
                 aria-label="${quickViewText}"
                 aria-expanded="false">
                <span class="icon icon-view" aria-hidden="true"></span>
                <span class="tooltip" aria-hidden="true">${quickViewText}</span>
              </a>
            </li>
            <li class="compare">
              <a href="#" 
                 class="box-icon hover-tooltip tooltip-left" 
                 data-compare 
                 data-id="${product.id}" 
                 data-action="add"
                 aria-label="${addToCompareText}">
                <span class="icon icon-compare"></span>
                <span class="tooltip">${addToCompareText}</span>
              </a>
            </li>
          </ul>
          ` : ''}
        </div>
        
        <div class="card-product-info">
          <a href="${product.url}" class="name-product link fw-medium text-md">${product.title}</a>
          <p class="price-wrap fw-medium">
            ${product.compare_at_price && product.compare_at_price > product.price ? 
              `<span class="price-new text-primary">${this.formatMoney(product.price)}</span>
               <span class="price-old">${this.formatMoney(product.compare_at_price)}</span>` :
              `<span class="price-new">${this.formatMoney(product.price)}</span>`
            }
          </p>
        </div>
      </div>
    `;
  }
  
  initializeProductCardFunctionality() {
    if (typeof ProductCard !== 'undefined') {
      try {
        ProductCard.initializeForDynamicProducts(this.productsContainer);
      } catch (error) {
        console.warn('Error initializing product card functionality for recently viewed products:', error);
      }
    } else {
      console.warn('ProductCard module not available for recently viewed products');
    }
  }
  
  initializeQuickviewFunctionality() {
    if (typeof window.initQuickview === 'function') {
      try {
        window.initQuickview();
      } catch (error) {
        console.warn('Error initializing quickview functionality for recently viewed products:', error);
      }
    } else {
      // Fallback: manually initialize quickview for the new products
      this.initializeQuickviewFallback();
    }
  }
  
  initializeQuickviewFallback() {
    const quickviewButtons = this.productsContainer.querySelectorAll('.quickview');
    quickviewButtons.forEach(button => {
      // Remove existing listeners to prevent duplicates
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      // Add click event listener
      newButton.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const productHandle = newButton.dataset.productHandle;
        const productId = newButton.dataset.productId;
        
        if (!productHandle) {
          console.error('No product handle found for quickview');
          return;
        }
        
        // Show modal immediately
        const modal = document.getElementById('quickView');
        if (!modal) {
          console.error('Quickview modal not found');
          return;
        }
        
        try {
          // Fetch product data
          const response = await fetch(`/products/${productHandle}.js`);
          if (!response.ok) throw new Error('Failed to fetch product data');
          const productData = await response.json();
          
          // Update modal content with the fetched product data
          this.updateQuickviewModal(modal, productData);
          
          // Show the modal using Bootstrap
          this.showQuickviewModal(modal);
          
        } catch (error) {
          console.error('Error loading product data for quickview:', error);
        }
      });
    });
  }
  
  showQuickviewModal(modal) {
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const bootstrapModal = new bootstrap.Modal(modal);
      bootstrapModal.show();
    } else {
      // Fallback: show modal manually
      modal.style.display = 'block';
      modal.classList.add('show');
      document.body.classList.add('modal-open');
      
      // Add backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
      
      // Handle close
      const closeModal = () => {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        if (backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
      };
      
      // Add close event listeners
      const closeButton = modal.querySelector('.icon-close');
      if (closeButton) {
        closeButton.addEventListener('click', closeModal);
      }
      backdrop.addEventListener('click', closeModal);
    }
  }
  
  updateQuickviewModal(modal, product) {
    // Update product title
    const titleElement = modal.querySelector('.product-info-name');
    if (titleElement) titleElement.textContent = product.title;
    
    // Update price
    const priceContainer = modal.querySelector('.product-info-price');
    if (priceContainer) {
      if (product.compare_at_price > product.price) {
        const discountPercentage = Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100);
        priceContainer.innerHTML = `
          <h6 class="price-new price-on-sale">${this.formatMoney(product.price)}</h6>
          <h6 class="price-old">${this.formatMoney(product.compare_at_price)}</h6>
          <span class="badge-sale">${discountPercentage}% Off</span>
        `;
      } else {
        priceContainer.innerHTML = `
          <h6 class="price-new">${this.formatMoney(product.price)}</h6>
        `;
      }
    }
    
    // Update description
    const textElement = modal.querySelector('.text');
    if (textElement) {
      textElement.textContent = product.description.replace(/<[^>]*>/g, '').split(' ').slice(0, 30).join(' ') + '...';
    }
    
    // Update media gallery
    const swiperWrapper = modal.querySelector('.swiper-wrapper');
    if (swiperWrapper && product.media) {
      swiperWrapper.innerHTML = product.media.map(media => `
        <div class="swiper-slide" data-media-id="${media.id}">
          <div class="item">
            ${media.media_type === 'image' 
              ? `<img class="lazyload" data-src="${media.src}" src="${media.src}" alt="${media.alt || product.title}">`
              : `<video controls class="w-100"><source src="${media.sources[0].url}" type="video/mp4"></video>`
            }
          </div>
        </div>
      `).join('');
      
      // Reinitialize Swiper for the quickview modal
      if (window.quickviewSwiper) {
        window.quickviewSwiper.destroy(true, true);
      }
      window.quickviewSwiper = new Swiper('.tf-single-slide', {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: false,
        navigation: {
          nextEl: '.single-slide-next',
          prevEl: '.single-slide-prev',
        }
      });
    }
    
    // Update variant selection if available
    if (product.variants && product.variants.length > 0) {
      const variantSelect = modal.querySelector('select[data-variant-id]');
      if (variantSelect) {
        variantSelect.innerHTML = product.variants.map(variant => 
          `<option value="${variant.id}">${variant.title}</option>`
        ).join('');
        variantSelect.value = product.variants[0].id;
        variantSelect.dataset.variantId = product.variants[0].id;
      }
      
      // Update add to cart button
      const addToCartBtn = modal.querySelector('.add-to-cart');
      if (addToCartBtn) {
        addToCartBtn.dataset.variantId = product.variants[0].id;
        addToCartBtn.dataset.productId = product.id;
      }
      
      // Update buy now button
      const buyNowBtn = modal.querySelector('.buy-now-btn');
      if (buyNowBtn) {
        buyNowBtn.dataset.productId = product.id;
      }
    }
  }
  
  formatMoney(cents) {
    if (typeof cents !== 'number') return '';
    
    // Try to use Shopify's money format if available
    if (typeof window.Shopify !== 'undefined' && window.Shopify.formatMoney) {
      return window.Shopify.formatMoney(cents);
    }
    
    // Fallback to basic formatting
    const dollars = cents / 100;
    return '$' + dollars.toFixed(2);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  new RecentlyViewedSection();
});  
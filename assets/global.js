/**
 * WishlistCompare Class
 * Handles wishlist and product comparison functionality
 * 
 * Usage:
 * - Initialize: new WishlistCompare()
 * - Add to wishlist: <button data-wishlist data-id="product-id" data-action="add">Add to Wishlist</button>
 * - Add to compare: <button data-compare data-id="product-id" data-action="add">Add to Compare</button>
 * 
 * Features:
 * - Local storage based wishlist and compare lists
 * - Maximum 50 items in wishlist
 * - Maximum 6 items in compare list
 * - Keyboard navigation support
 * - Automatic UI updates
 */

/**
 * Cart and Wishlist Translation Objects
 * Provides translation strings for cart and wishlist functionality
 * Uses translations from window.theme.translations if available, falls back to defaults
 */
const cartT = window.theme?.translations?.cart || {
  empty_cart: 'Your cart is currently empty.',
  continue_shopping: 'Continue shopping',
  close_notification: 'Close notification',
  item_added_success: 'Item added to cart successfully!',
  cart_updated_success: 'Cart updated successfully!',
  failed_remove_item: 'Failed to remove item. Please try again.',
  add_to_cart: 'Add to Cart',
  update_cart: 'Update Cart',
  remove: 'Remove',
  checkout: 'Check Out',
  subtotal: 'Subtotal',
  total: 'Total:',
  taxes_shipping: 'Taxes and shipping calculated at checkout',
  shipping_at_checkout: 'Shipping & taxes calculated at checkout',
  cart_error: 'There was an error while updating your cart. Please try again.',
  cart_quantity_error: 'You can only add [quantity] of this item to your cart.',
  error_unable_action: 'Unable to {{ action }}. Please check your selection and try again.',
  error_session_expired: 'Session expired. Please refresh the page and try again.',
  error_access_denied: 'Access denied. Please refresh the page and try again.',
  error_product_not_found: 'Product not found. It may have been removed or is no longer available.',
  error_unable_action_out_of_stock: 'Unable to {{ action }}. The product may be out of stock.',
  error_too_many_requests: 'Too many requests. Please wait a moment and try again.',
  error_server: 'Server error. Please try again in a few moments.',
  error_failed_action: 'Failed to {{ action }}. Please try again.'
};

const wishlistT = window.theme?.translations?.wishlist || {
  add_to_wishlist: 'Add to wishlist',
  remove_from_wishlist: 'Remove from wishlist',
  add_to_cart: 'Add to Cart',
  quick_view: 'Quick View',
  add_to_compare: 'Add to Compare',
  remove_from_compare: 'Remove from compare',
  compare: 'Compare',
  sold_out: 'Sold Out',
  empty_wishlist: 'No product were added to the wishlist.',
  back_to_shopping: 'Back to Shopping',
  my_wishlist: 'My Wishlist',
  wishlist: 'Wishlist',
  check_wishlist: 'Check your wishlist',
  your_wishlist: 'your wishlist',
  loading_wishlist: 'Loading your wishlist...',
  wishlist_empty: 'Your wishlist is empty.'
};



/**
 * HTML Sanitization Utilities
 * Provides safe HTML creation and sanitization functions to prevent XSS attacks
 */
const HTMLSanitizer = {
  /**
   * Sanitize text content to prevent XSS
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   */
  sanitizeText(text) {
    if (typeof text !== 'string') {
      return String(text || '');
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Sanitize URL to prevent XSS and ensure it's safe
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL
   */
  sanitizeUrl(url) {
    if (typeof url !== 'string') {
      return '';
    }
    
    // Remove any script or javascript protocols
    const sanitized = url.replace(/^javascript:/i, '').replace(/^data:/i, '');
    
    // Only allow http, https, and relative URLs
    if (sanitized && !sanitized.match(/^(https?:\/\/|\/|#)/)) {
      return '';
    }
    
    return sanitized;
  },

  /**
   * Create a safe HTML element with sanitized attributes
   * @param {string} tagName - HTML tag name
   * @param {Object} attributes - Object of attributes
   * @param {string} content - Inner content (will be sanitized)
   * @returns {HTMLElement} Safe HTML element
   */
  createElement(tagName, attributes = {}, content = '') {
    const element = document.createElement(tagName);
    
    // Set attributes safely
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === 'href' || key === 'src') {
          const sanitizedUrl = this.sanitizeUrl(value);
          if (sanitizedUrl) {
            element.setAttribute(key, sanitizedUrl);
          }
        } else if (key === 'alt' || key === 'title' || key === 'aria-label') {
          element.setAttribute(key, this.sanitizeText(value));
        } else {
          element.setAttribute(key, this.sanitizeText(value));
        }
      }
    });
    
    // Set content safely
    if (content) {
      element.textContent = content;
    }
    
    return element;
  },

  /**
   * Create a safe HTML string for specific use cases
   * @param {string} tagName - HTML tag name
   * @param {Object} attributes - Object of attributes
   * @param {string} content - Inner content (will be sanitized)
   * @returns {string} Safe HTML string
   */
  createHTMLString(tagName, attributes = {}, content = '') {
    const element = this.createElement(tagName, attributes, content);
    return element.outerHTML;
  },

  /**
   * Safely set innerHTML with sanitized content
   * @param {HTMLElement} element - Target element
   * @param {string} html - HTML content to sanitize and set
   */
  setInnerHTML(element, html) {
    if (!element || typeof html !== 'string') {
      return;
    }
    
    // Create a temporary container to sanitize the HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove any script tags and event handlers
    const scripts = temp.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Remove event handlers from all elements
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(el => {
      const attrs = el.attributes;
      for (let i = attrs.length - 1; i >= 0; i--) {
        const attr = attrs[i];
        if (attr.name.startsWith('on') || attr.name.startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      }
    });
    
    // Set the sanitized content
    element.innerHTML = temp.innerHTML;
  }
};

class WishlistCompare {
  constructor() {
    // Storage keys for wishlist and compare lists
    this.wishlistKey = 'theme4:wishlist:id';
    this.compareKey = 'theme4:compare:id';
    
    // Initialize lists from localStorage
    this.wishlistList = this.getWishlistList();
    this.compareList = this.getCompareList();
    
    // Maximum number of items allowed
    this.wishlistLimit = 50;
    this.compareLimit = 6;
    
    this.init();
  }

  /**
   * Initialize event listeners and UI state
   * Sets up click and keyboard event handlers
   * Updates button states and wishlist count
   */
  init() {
    // Initialize event listeners
    document.addEventListener('click', (e) => {
      this.handleClick(e);
    });
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Initialize color swatch selection
    this.initColorSwatches();
    
    // Initialize buttons state
    this.updateButtonsState();
    this.updateWishlistCount();
  }

  /**
   * Initialize color swatch selection functionality
   */
  initColorSwatches() {
    document.querySelectorAll('.list-color-item').forEach(swatch => {
      swatch.addEventListener('click', function() {
        // Remove active class from all swatches in this group
        this.closest('.list-color-product').querySelectorAll('.list-color-item').forEach(item => {
          item.classList.remove('active');
        });
        
        // Add active class to clicked swatch
        this.classList.add('active');
        
        // Get the variant ID from the swatch's data attribute
        const variantId = this.dataset.variantId;
        
        // Update the add to cart button's variant ID
        const addToCartBtn = this.closest('.card-product').querySelector('[data-variant-id]');
        if (addToCartBtn) {
          addToCartBtn.dataset.variantId = variantId;
        }
        
        // DO NOT update the wishlist button's ID - it should always keep the product ID
        // The wishlist functionality should work with products, not individual variants
        // This was causing the wrong product to be added to wishlist
        
        // Note: Compare button should keep the product ID, not change to variant ID
        // This ensures compare functionality works with products, not individual variants
        
        // Update button states after variant change
        if (window.wishlistCompare) {
          window.wishlistCompare.updateButtonsState();
        }
      });
    });
  }

  /**
   * Get wishlist items from localStorage
   * @returns {Array} Array of product IDs in wishlist
   */
  getWishlistList() {
    const stored = localStorage.getItem(this.wishlistKey);
    return stored ? stored.split(',') : [];
  }

  /**
   * Get compare items from localStorage
   * @returns {Array} Array of product objects in compare list
   */
  getCompareList() {
    const stored = localStorage.getItem(this.compareKey);
    if (!stored) return [];
    
    try {
      // Try to parse as JSON (new format with product objects)
      const parsed = JSON.parse(stored);
      
      // Check if it's a valid array of objects
      if (Array.isArray(parsed)) {
        // Filter out any invalid items and ensure all items are objects
        const validItems = parsed.filter(item => 
          item && typeof item === 'object' && item.id && item.title
        );
        
        // If we have valid items, return them
        if (validItems.length > 0) {
          return validItems;
        }
      }
    } catch (e) {
      console.log('Error parsing compare data, clearing corrupted data');
      // Clear corrupted data
      localStorage.removeItem(this.compareKey);
    }
    
    // If we get here, the data is corrupted or in old format, return empty array
    return [];
  }

  /**
   * Save wishlist items to localStorage
   */
  saveWishlistList() {
    localStorage.setItem(this.wishlistKey, this.wishlistList.join(','));
  }

  /**
   * Save compare items to localStorage
   */
  saveCompareList() {
    localStorage.setItem(this.compareKey, JSON.stringify(this.compareList));
  }

  /**
   * Handle click events on wishlist and compare buttons
   * @param {Event} event - Click event object
   */
  handleClick(event) {
    const target = event.target.closest('[data-wishlist], [data-compare]');
    if (!target) {
      return;
    }
    const isWishlist = target.hasAttribute('data-wishlist');
    const productId = target.getAttribute('data-id');
    const action = target.getAttribute('data-action');



    if (isWishlist) {
      this.handleWishlist(productId, action);
    } else if (action === 'clear') {
      this.clearCompareList();
    } else if (action === 'add') {
      this.addToCompare(productId);
    } else if (action === 'remove') {
      this.removeFromCompare(productId);
    } else {
    }
  }

  /**
   * Handle keyboard events (Enter key) on wishlist and compare buttons
   * @param {Event} event - Keydown event object
   */
  handleKeydown(event) {
    if (event.key !== 'Enter') return;
    
    const target = event.target.closest('[data-wishlist], [data-compare]');
    if (!target) return;

    const isWishlist = target.hasAttribute('data-wishlist');
    const productId = target.getAttribute('data-id');
    const action = target.getAttribute('data-action');

    if (isWishlist) {
      this.handleWishlist(productId, action);
    } else if (action === 'clear') {
      this.clearCompareList();
    } else if (action === 'add') {
      this.addToCompare(productId);
    } else if (action === 'remove') {
      this.removeFromCompare(productId);
    }
  }

  /**
   * Handle wishlist actions (add/remove)
   * @param {string} productId - Product ID to add/remove
   * @param {string} action - Action to perform ('add' or 'remove')
   */
  handleWishlist(productId, action) {
    if (action === 'add') {
      this.addToWishlist(productId);
    } else if (action === 'remove') {
      this.removeFromWishlist(productId);
    }
  }

  /**
   * Add product to wishlist
   * @param {string} productId - Product ID to add
   */
  async addToWishlist(productId) {
    // Validate productId
    if (!productId || productId.toString().trim() === '') {
      console.error('Invalid product ID provided to addToWishlist:', productId);
      return;
    }
    
    // Convert to string for consistent comparison
    const productIdStr = productId.toString();
    
    if (this.wishlistList.includes(productIdStr)) {
      return;
    }
    
    this.wishlistList.unshift(productIdStr);
    if (this.wishlistList.length > this.wishlistLimit) {
      this.wishlistList.pop();
    }
    
    this.saveWishlistList();
    this.updateButtonsState();
    this.updateWishlistCount();
    
    // Dispatch event to update wishlist page immediately
    document.dispatchEvent(new CustomEvent('wishlist:updated'));
    
    // If we're on the wishlist page, fetch and add the product immediately
    if (window.location.pathname.includes('/pages/wishlist') || window.location.pathname.includes('/wishlist')) {
      await this.addProductToWishlistPage(productIdStr);
    }
  }

  /**
   * Remove product from wishlist
   * @param {string} productId - Product ID to remove
   */
  removeFromWishlist(productId) {
    const index = this.wishlistList.indexOf(productId);
    if (index === -1) return;
    
    this.wishlistList.splice(index, 1);
    this.saveWishlistList();
    this.updateButtonsState();
    this.updateWishlistCount();
    
    // Dispatch event to update wishlist page immediately
    document.dispatchEvent(new CustomEvent('wishlist:updated'));
  }

  /**
   * Add product to wishlist page immediately via AJAX
   * @param {string} productId - Product ID to add
   */
  async addProductToWishlistPage(productId) {
    try {
      // Validate productId
      if (!productId || productId.trim() === '') {
        console.error('Invalid product ID provided:', productId);
        return;
      }
      
      // Fetch product data via AJAX
      const response = await fetch(`/products.json?ids=${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product data');
      }
      
      const data = await response.json();
      const product = data.products[0];
      
      if (!product) {
        console.error('Product not found:', productId);
        return;
      }
      
      // Validate that the returned product matches the requested product ID
      if (product.id.toString() !== productId.toString()) {
        console.error('Product ID mismatch: requested', productId, 'but got', product.id);
        return;
      }
      
      // Get the grid layout container
      const gridLayout = document.getElementById('gridLayout');
      if (!gridLayout) {
        console.error('Grid layout container not found');
        return;
      }
      
      // Check if product is already in the grid to prevent duplicates
      const existingProduct = gridLayout.querySelector(`[data-product-id="${product.id}"]`);
      if (existingProduct) {
        return;
      }
      
      // Remove empty state if it exists
      const emptyState = gridLayout.querySelector('.tf-wishlist-empty');
      if (emptyState) {
        emptyState.remove();
      }
      
      // Add the tf-grid-layout class back if it was removed
      gridLayout.classList.add('tf-grid-layout');
      
      // Create product card element safely
      const productCardElement = this.createWishlistProductCard(product);
      
      // Insert the new product card at the beginning
      gridLayout.insertBefore(productCardElement, gridLayout.firstChild);
      
      // Get the newly added product card and add animation class
      const newProductCard = gridLayout.querySelector(`[data-product-id="${product.id}"]`);
      if (newProductCard) {
        // Add animation class
        newProductCard.classList.add('adding');
        
        // Initialize event listeners for the new product card
        this.initializeWishlistProductCardEvents(newProductCard);
        
        // Remove animation class after animation completes
        setTimeout(() => {
          newProductCard.classList.remove('adding');
        }, 500);
      }
      
      // Update pagination if needed
      this.updateWishlistPagination();
      
      // Initialize lazy loading for new images
      if (typeof LazyLoad !== 'undefined') {
        new LazyLoad();
      }
      
      // Update buttons state
      this.updateButtonsState();
      
    } catch (error) {
      console.error('Error adding product to wishlist page:', error);
    }
  }

  /**
   * Create wishlist product card HTML safely
   * @param {Object} product - Product data
   * @returns {HTMLElement} Safe HTML element for the product card
   */
  createWishlistProductCard(product) {
    const formatMoney = (cents) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: window.Shopify?.currency?.active || 'USD'
      }).format(cents / 100);
    };

    // Create main container
    const cardDiv = HTMLSanitizer.createElement('div', {
      class: `card-product grid file-delete style-wishlist style-3 ${!product.variants[0].available ? 'out-of-stock' : ''}`,
      'data-product-id': product.id
    });

    // Create remove button
    const removeIcon = HTMLSanitizer.createElement('i', {
      class: 'icon icon-close remove',
      'data-wishlist': '',
      'data-id': product.id,
      'data-action': 'remove'
    });
    cardDiv.appendChild(removeIcon);

    // Create wrapper
    const wrapper = HTMLSanitizer.createElement('div', { class: 'card-product-wrapper' });

    // Create product image link
    const productLink = HTMLSanitizer.createElement('a', {
      href: `/products/${HTMLSanitizer.sanitizeText(product.handle)}`,
      class: 'product-img'
    });

    // Create main image
    const mainImage = HTMLSanitizer.createElement('img', {
      class: 'img-product lazyload',
      'data-src': HTMLSanitizer.sanitizeUrl(product.featured_image ? product.featured_image.src : product.images[0].src),
      src: HTMLSanitizer.sanitizeUrl(product.featured_image ? product.featured_image.src : product.images[0].src),
      alt: HTMLSanitizer.sanitizeText(product.title)
    });
    productLink.appendChild(mainImage);

    // Create hover image if available
    if (product.images && product.images[1]) {
      const hoverImage = HTMLSanitizer.createElement('img', {
        class: 'img-hover lazyload',
        'data-src': HTMLSanitizer.sanitizeUrl(product.images[1].src),
        src: HTMLSanitizer.sanitizeUrl(product.images[1].src),
        alt: HTMLSanitizer.sanitizeText(product.title)
      });
      productLink.appendChild(hoverImage);
    }

    wrapper.appendChild(productLink);

    // Create product buttons list
    const buttonsList = HTMLSanitizer.createElement('ul', { class: 'list-product-btn' });

    // Add to cart button
    const addToCartLi = HTMLSanitizer.createElement('li');
    const addToCartLink = HTMLSanitizer.createElement('a', {
      href: '#',
      class: 'box-icon hover-tooltip add-to-cart',
      'data-variant-id': product.variants[0].id,
      'data-quantity': '1',
      'aria-label': 'Add to cart'
    });
    
    const cartIcon = HTMLSanitizer.createElement('span', { class: 'icon icon-cart2' });
    const cartTooltip = HTMLSanitizer.createElement('span', { class: 'tooltip' }, wishlistT.add_to_cart || 'Add to Cart');
    
    addToCartLink.appendChild(cartIcon);
    addToCartLink.appendChild(cartTooltip);
    addToCartLi.appendChild(addToCartLink);
    buttonsList.appendChild(addToCartLi);

    // Quickview button
    const quickviewLi = HTMLSanitizer.createElement('li');
    const quickviewLink = HTMLSanitizer.createElement('a', {
      href: '#',
      class: 'box-icon hover-tooltip quickview',
      'data-product-handle': HTMLSanitizer.sanitizeText(product.handle),
      'data-product-id': product.id,
      'data-bs-toggle': 'modal',
      'data-bs-target': '#quickView'
    });
    
    const viewIcon = HTMLSanitizer.createElement('span', { class: 'icon icon-view' });
    const viewTooltip = HTMLSanitizer.createElement('span', { class: 'tooltip' }, wishlistT.quick_view || 'Quick View');
    
    quickviewLink.appendChild(viewIcon);
    quickviewLink.appendChild(viewTooltip);
    quickviewLi.appendChild(quickviewLink);
    buttonsList.appendChild(quickviewLi);

    // Compare button
    const compareLi = HTMLSanitizer.createElement('li', { class: 'compare' });
    const compareLink = HTMLSanitizer.createElement('a', {
      href: '#',
      class: 'box-icon hover-tooltip tooltip-left',
      'data-compare': '',
      'data-id': product.id,
      'data-action': 'add',
      'aria-label': 'Add to compare'
    });
    
    const compareIcon = HTMLSanitizer.createElement('span', { class: 'icon icon-compare' });
    const compareTooltip = HTMLSanitizer.createElement('span', { class: 'tooltip' }, wishlistT.add_to_compare || 'Add to Compare');
    
    compareLink.appendChild(compareIcon);
    compareLink.appendChild(compareTooltip);
    compareLi.appendChild(compareLink);
    buttonsList.appendChild(compareLi);

    wrapper.appendChild(buttonsList);

    // Add sold out badge if needed
    if (!product.variants[0].available) {
      const soldOutBadge = HTMLSanitizer.createElement('div', { class: 'sold-out-badge' }, wishlistT.sold_out || 'Sold Out');
      wrapper.appendChild(soldOutBadge);
    }

    cardDiv.appendChild(wrapper);

    // Create product info
    const infoDiv = HTMLSanitizer.createElement('div', { class: 'card-product-info' });

    // Product title link
    const titleLink = HTMLSanitizer.createElement('a', {
      href: `/products/${HTMLSanitizer.sanitizeText(product.handle)}`,
      class: 'name-product link fw-medium text-md'
    }, HTMLSanitizer.sanitizeText(product.title));
    infoDiv.appendChild(titleLink);

    // Price wrapper
    const priceWrap = HTMLSanitizer.createElement('p', { class: 'price-wrap fw-medium' });
    
    const newPrice = HTMLSanitizer.createElement('span', { class: 'price-new text-primary' }, formatMoney(product.variants[0].price * 100));
    priceWrap.appendChild(newPrice);

    if (product.variants[0].compare_at_price > product.variants[0].price) {
      const oldPrice = HTMLSanitizer.createElement('span', { class: 'price-old' }, formatMoney(product.variants[0].compare_at_price * 100));
      priceWrap.appendChild(oldPrice);
    }

    infoDiv.appendChild(priceWrap);

    // Color swatches if multiple variants
    if (product.variants.length > 1) {
      const colorList = HTMLSanitizer.createElement('ul', { class: 'list-color-product' });
      
      product.options.forEach(option => {
        if (option.name.toLowerCase() === 'color' || option.name.toLowerCase() === 'colour') {
          option.values.forEach(value => {
            const variant = product.variants.find(v => v.option1 === value);
            if (variant) {
              const colorItem = HTMLSanitizer.createElement('li', {
                class: `list-color-item color-swatch hover-tooltip tooltip-bot ${value === option.values[0] ? 'active' : ''}`,
                'data-variant-id': variant.id,
                'data-option-name': HTMLSanitizer.sanitizeText(option.name),
                'data-option-value': HTMLSanitizer.sanitizeText(value)
              });

              const tooltip = HTMLSanitizer.createElement('span', { class: 'tooltip color-filter' }, HTMLSanitizer.sanitizeText(value));
              const swatchValue = HTMLSanitizer.createElement('span', { class: `swatch-value bg-${value.toLowerCase().replace(/\s+/g, '-')}` });

              colorItem.appendChild(tooltip);
              colorItem.appendChild(swatchValue);

              if (variant.featured_image) {
                const variantImage = HTMLSanitizer.createElement('img', {
                  class: 'lazyload',
                  'data-src': HTMLSanitizer.sanitizeUrl(variant.featured_image.src),
                  src: HTMLSanitizer.sanitizeUrl(variant.featured_image.src),
                  alt: HTMLSanitizer.sanitizeText(value),
                  loading: 'lazy'
                });
                colorItem.appendChild(variantImage);
              }

              colorList.appendChild(colorItem);
            }
          });
        }
      });

      infoDiv.appendChild(colorList);
    }

    cardDiv.appendChild(infoDiv);

    return cardDiv;
  }

  /**
   * Initialize event listeners for a wishlist product card
   * @param {HTMLElement} productCard - The product card element
   */
  initializeWishlistProductCardEvents(productCard) {
    // Remove button
    const removeButton = productCard.querySelector('[data-wishlist][data-action="remove"]');
    if (removeButton) {
      removeButton.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = removeButton.getAttribute('data-id');
        
        // Remove from localStorage
        const wishlistIds = localStorage.getItem('theme4:wishlist:id') ? localStorage.getItem('theme4:wishlist:id').split(',') : [];
        const updatedIds = wishlistIds.filter(id => id !== productId);
        localStorage.setItem('theme4:wishlist:id', updatedIds.join(','));
        
        // Add removal animation class
        productCard.classList.add('removing');
        
        // Remove the product card from UI after animation
        setTimeout(() => {
          productCard.remove();
          
          // Check if no products left
          const remainingCards = document.querySelectorAll('.card-product[data-product-id]');
          if (remainingCards.length === 0) {
            const gridLayout = document.getElementById('gridLayout');
            if (gridLayout) {
              gridLayout.classList.remove('tf-grid-layout');
              const wrapperDiv = HTMLSanitizer.createElement('div', { class: 'wrapper-wishlist tf-col-2 lg-col-3 xl-col-4' });
              const emptyDiv = HTMLSanitizer.createElement('div', { class: 'tf-wishlist-empty text-center' });
              const emptyText = HTMLSanitizer.createElement('p', { class: 'text-md text-noti' }, wishlistT.empty_wishlist || 'No product were added to the wishlist.');
              const backLink = HTMLSanitizer.createElement('a', {
                href: '/',
                class: 'tf-btn animate-btn btn-back-shop'
              }, wishlistT.back_to_shopping || 'Back to Shopping');
              
              emptyDiv.appendChild(emptyText);
              emptyDiv.appendChild(backLink);
              wrapperDiv.appendChild(emptyDiv);
              gridLayout.appendChild(wrapperDiv);
            }
            
            const paginationContainer = document.getElementById('paginationContainer');
            if (paginationContainer) {
              paginationContainer.style.display = 'none';
            }
          }
          
          // Update wishlist count
          this.updateWishlistCount();
          
          // Update pagination
          this.updateWishlistPagination();
          
          // Show notification
        }, 300);
      });
    }
    
    // Add to cart button
    const addToCartButton = productCard.querySelector('.add-to-cart');
    if (addToCartButton) {
      addToCartButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (addToCartButton.classList.contains('loading')) return;
        
        const variantId = addToCartButton.dataset.variantId;
        const quantity = parseInt(addToCartButton.dataset.quantity || 1);
        
        try {
          addToCartButton.classList.add('loading');
          
          // Add item to cart
          if (window.cart) {
            await window.cart.updateQuantity(variantId, quantity, 'add');
            
            // Show success feedback
            addToCartButton.innerHTML = '';
            const successFeedback = HTMLSanitizer.createElement('div', { class: 'success-feedback' });
            const successIcon = HTMLSanitizer.createElement('i', { class: 'icon icon-check text-success' });
            successFeedback.appendChild(successIcon);
            addToCartButton.appendChild(successFeedback);
            
            setTimeout(() => {
              addToCartButton.innerHTML = '';
              const cartIcon = HTMLSanitizer.createElement('span', { class: 'icon icon-cart2' });
              const cartTooltip = HTMLSanitizer.createElement('span', { class: 'tooltip' }, 'Add to Cart');
              addToCartButton.appendChild(cartIcon);
              addToCartButton.appendChild(cartTooltip);
              addToCartButton.classList.remove('loading');
            }, 1000);
          }
        } catch (error) {
          console.error('Error adding item to cart:', error);
          addToCartButton.classList.remove('loading');
          if (window.cartNotifications) {
            window.cartNotifications.show(error.message || 'Failed to add item to cart. Please try again.', 'error');
          } else {
            alert('Failed to add item to cart. Please try again.');
          }
        }
      });
    }
    
    // Quickview button
    const quickviewButton = productCard.querySelector('.quickview');
    if (quickviewButton) {
      quickviewButton.addEventListener('click', (e) => {
        e.preventDefault();
        // Quickview functionality is handled by the existing code in wishlist.liquid
      });
    }
    
    // Compare button
    const compareButton = productCard.querySelector('[data-compare]');
    if (compareButton) {
      compareButton.addEventListener('click', (e) => {
        e.preventDefault();
        // Compare functionality is handled by the existing code
      });
    }
    
    // Color swatches
    const colorSwatches = productCard.querySelectorAll('.list-color-item');
    colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', function() {
        const variantId = this.dataset.variantId;
        
        // Update active state
        productCard.querySelectorAll('.list-color-item').forEach(item => {
          item.classList.remove('active');
        });
        this.classList.add('active');
        
        // Update add to cart button variant ID
        const addToCartBtn = productCard.querySelector('.add-to-cart');
        if (addToCartBtn) {
          addToCartBtn.dataset.variantId = variantId;
        }
      });
    });
  }

  /**
   * Update wishlist pagination
   */
  updateWishlistPagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;
    
    const gridLayout = document.getElementById('gridLayout');
    if (!gridLayout) return;
    
    const productCards = gridLayout.querySelectorAll('.card-product[data-product-id]');
    const productsPerPage = parseInt(gridLayout.dataset.productsPerPage) || 12;
    
    if (productCards.length === 0) {
      paginationContainer.style.display = 'none';
      return;
    }
    
    const totalPages = Math.ceil(productCards.length / productsPerPage);
    
    if (totalPages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }
    
    paginationContainer.style.display = 'block';
    
    // Update pagination HTML (this is a simplified version - you may want to implement full pagination logic)
    const pagination = document.getElementById('pagination');
    if (pagination) {
      // Clear existing content
      pagination.innerHTML = '';
      
      // Create simple pagination display
      const paginationItem = HTMLSanitizer.createElement('li', { class: 'active' });
      const paginationDiv = HTMLSanitizer.createElement('div', { class: 'pagination-item' }, '1');
      paginationItem.appendChild(paginationDiv);
      pagination.appendChild(paginationItem);
    }
  }

  /**
   * Update state of all wishlist and compare buttons
   * Updates button text and data-action attributes
   */
  updateButtonsState() {
    // Update wishlist buttons
    document.querySelectorAll('[data-wishlist]').forEach(button => {
      const productId = button.getAttribute('data-id');
      const isInWishlist = this.wishlistList.includes(productId);
      button.setAttribute('data-action', isInWishlist ? 'remove' : 'add');
      
      // Store original icon if not already stored
      if (!button.hasAttribute('data-original-icon')) {
        const iconElement = button.querySelector('.icon');
        if (iconElement) {
          // Determine the original icon class
          let originalIcon = 'icon-heart2'; // default
          if (iconElement.classList.contains('icon-heart')) {
            originalIcon = 'icon-heart';
          } else if (iconElement.classList.contains('icon-heart2')) {
            originalIcon = 'icon-heart2';
          }
          button.setAttribute('data-original-icon', originalIcon);
        }
      }
      
      this.updateButtonText(button, isInWishlist, 'wishlist');
    });

    // Update compare buttons
    document.querySelectorAll('[data-compare]').forEach(button => {
      const productId = button.getAttribute('data-id');
      if (!productId) return; // Skip buttons without product ID (like Clear All)
      
      // Handle both old format (IDs only) and new format (product objects)
      // Use loose equality to handle both string and number IDs
      const isInCompare = this.compareList.some(item => 
        (typeof item === 'string' && item == productId) || 
        (typeof item === 'object' && item.id == productId)
      );
      
      button.setAttribute('data-action', isInCompare ? 'remove' : 'add');
      this.updateButtonText(button, isInCompare, 'compare');
    });
  }

  /**
   * Update button text based on current state
   * @param {HTMLElement} button - Button element to update
   * @param {boolean} isActive - Whether the item is in the list
   * @param {string} type - Type of list ('wishlist' or 'compare')
   */
  updateButtonText(button, isActive, type) {
    // Update tooltip if it exists
    const tooltip = button.querySelector('.tooltip');
    if (tooltip) {
      tooltip.textContent = isActive ? (type === 'compare' ? (wishlistT.remove_from_compare || 'Remove from compare') : (wishlistT.remove_from_wishlist || 'Remove from wishlist')) : (type === 'compare' ? (wishlistT.compare || 'Compare') : (wishlistT.add_to_wishlist || 'Add to wishlist'));
    }
    
    // Update button text content
    const textElement = button.querySelector('.text');
    if (textElement) {
      if (type === 'compare') {
        textElement.textContent = isActive ? (wishlistT.remove_from_compare || 'Remove from compare') : (wishlistT.compare || 'Compare');
      } else if (type === 'wishlist') {
        textElement.textContent = isActive ? (wishlistT.remove_from_wishlist || 'Remove from wishlist') : (wishlistT.add_to_wishlist || 'Add to wishlist');
      }
    }
    
    // Update icon for wishlist buttons
    if (type === 'wishlist') {
      const iconElement = button.querySelector('.icon');
      if (iconElement) {
        // Remove existing heart/trash classes
        iconElement.classList.remove('icon-heart', 'icon-heart2', 'icon-trash');
        
        // Add appropriate icon class
        if (isActive) {
          iconElement.classList.add('icon-trash');
        } else {
          // Check if it was originally icon-heart2 or icon-heart
          const originalIcon = button.getAttribute('data-original-icon') || 'icon-heart2';
          iconElement.classList.add(originalIcon);
        }
      }
    }
    
    // Update aria-label for accessibility
    const actionText = isActive ? `Remove from ${type}` : `Add to ${type}`;
    button.setAttribute('aria-label', actionText);
  }

  /**
   * Show the compare drawer modal
   * Uses Bootstrap modal functionality
   */
  showCompareDrawer() {
    const drawer = document.getElementById('compare');
    if (!drawer) return;
    
    // Create and show Bootstrap modal
    const modal = new bootstrap.Modal(drawer);
    
    // Add event listener to remove backdrop and fix body styles when modal is hidden
    drawer.addEventListener('hidden.bs.modal', () => {
      // Remove backdrop
      // const backdrop = document.querySelector('.modal-backdrop');
      // if (backdrop) {
      //   backdrop.remove();
      // }
      
      // Fix body styles
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.classList.remove('modal-open');
    }, { once: true }); // Use once:true to avoid memory leaks
    
    modal.show();
    this.updateCompareDrawer();
    this.enableCompareDrawerDragScroll(); // <-- Add this line
  }

  /**
   * Enable drag-to-scroll for the compare drawer list
   */
  enableCompareDrawerDragScroll() {
    const drawer = document.getElementById('compare');
    if (!drawer) return;
    const compareInner = drawer.querySelector('.tf-compare-inner');
    if (!compareInner) return;
    let isDown = false;
    let startX;
    let scrollLeft;
    let animationFrameId = null;
    let lastX = 0;
    let dragMoved = false;

    // Remove previous listeners if any
    if (this._compareDragMouseUp) {
      window.removeEventListener('mouseup', this._compareDragMouseUp);
    }
    if (this._compareDragMouseMove) {
      window.removeEventListener('mousemove', this._compareDragMouseMove);
    }

    const onMouseMove = (e) => {
      if (!isDown) return;
      lastX = e.pageX - compareInner.offsetLeft;
      dragMoved = true; // Mark that a drag happened
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(updateScroll);
      }
    };

    const updateScroll = () => {
      if (!isDown) {
        animationFrameId = null;
        return;
      }
      const walk = (lastX - startX) * 1; // adjust multiplier for speed
      compareInner.scrollLeft = scrollLeft - walk;
      animationFrameId = null;
    };

    compareInner.addEventListener('mousedown', (e) => {
      isDown = true;
      dragMoved = false;
      compareInner.classList.add('dragging');
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      document.body.style.msUserSelect = 'none';
      startX = e.pageX - compareInner.offsetLeft;
      scrollLeft = compareInner.scrollLeft;
      lastX = startX;

      // Prevent default if starting on an image or link
      if (
        e.target.tagName === 'IMG' ||
        e.target.tagName === 'A' ||
        e.target.closest('a')
      ) {
        e.preventDefault();
      }

      window.addEventListener('mousemove', onMouseMove);
    });

    this._compareDragMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      compareInner.classList.remove('dragging');
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.msUserSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };
    window.addEventListener('mouseup', this._compareDragMouseUp);
    compareInner.addEventListener('mouseleave', () => {
      if (!isDown) return;
      isDown = false;
      compareInner.classList.remove('dragging');
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.msUserSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    });

    // Prevent default drag behavior on images and links inside compareInner
    compareInner.addEventListener('dragstart', function(e) {
      if (
        (e.target && e.target.tagName === 'IMG') ||
        (e.target && e.target.tagName === 'A') ||
        (e.target && e.target.closest('a'))
      ) {
        e.preventDefault();
      }
    });

    // Prevent accidental link navigation after drag
    compareInner.addEventListener('click', function(e) {
      if (dragMoved) {
        e.preventDefault();
        e.stopPropagation();
        dragMoved = false;
      }
    }, true); // Use capture phase
  }

  /**
   * Update the compare drawer content
   * Populates the drawer with current compare items
   */
  updateCompareDrawer() {
    const drawer = document.getElementById('compare');
    if (!drawer) return;

    const compareList = drawer.querySelector('.tf-compare-list');
    if (!compareList) return;

    // Clear existing items
    compareList.innerHTML = '';

    // Add current compare items using stored data
    this.compareList.forEach((item) => {
      // Only process valid product objects
      if (!item || typeof item !== 'object' || !item.id || !item.title) {
        console.warn('Skipping invalid compare item:', item);
        return;
      }
      
      // Use the stored product data directly
      const itemElement = this.createCompareItem(item);
      compareList.appendChild(itemElement);
    });

    // Hide modal if no items
    if (this.compareList.length === 0) {
      const modal = bootstrap.Modal.getInstance(drawer);
      if (modal) {
        modal.hide();
      }
    }
  }

  createCompareItem(product) {
    const div = HTMLSanitizer.createElement('div', {
      class: 'tf-compare-item file-delete',
      'data-product-id': product.id
    });
    
    // Format price properly
    const formatMoney = (price) => {
      // If price is already formatted (contains currency symbol), return as is
      if (typeof price === 'string' && (price.includes('$') || price.includes('€') || price.includes('£'))) {
        return price;
      }
      
      // If price is a number (in cents), format it
      if (typeof price === 'number') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: window.Shopify?.currency?.active || 'USD'
        }).format(price / 100);
      }
      
      // If price is a string number, convert and format
      if (typeof price === 'string' && !isNaN(parseFloat(price))) {
        const numPrice = parseFloat(price);
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: window.Shopify?.currency?.active || 'USD'
        }).format(numPrice);
      }
      
      // Return as is if can't format
      return price;
    };
    
    // Create remove button
    const removeButton = HTMLSanitizer.createElement('button', {
      type: 'button',
      class: 'icon-close remove',
      'data-compare': '',
      'data-id': product.id,
      'data-action': 'remove',
      'aria-label': wishlistT.remove_from_compare || 'Remove from compare'
    });
    div.appendChild(removeButton);
    
    // Create image link
    const imageLink = HTMLSanitizer.createElement('a', {
      href: HTMLSanitizer.sanitizeUrl(product.url),
      style: 'aspect-ratio: 4/5;',
      class: 'image',
      draggable: 'false'
    });
    
    // Create image
    const image = HTMLSanitizer.createElement('img', {
      class: 'lazyload',
      draggable: 'false',
      'data-src': HTMLSanitizer.sanitizeUrl(product.image),
      src: HTMLSanitizer.sanitizeUrl(product.image),
      alt: HTMLSanitizer.sanitizeText(product.title)
    });
    imageLink.appendChild(image);
    div.appendChild(imageLink);
    
    // Create content div
    const content = HTMLSanitizer.createElement('div', { class: 'content' });
    
    // Create title div
    const titleDiv = HTMLSanitizer.createElement('div', { class: 'text-title text-left' });
    const titleLink = HTMLSanitizer.createElement('a', {
      class: 'link text-line-clamp-2',
      href: HTMLSanitizer.sanitizeUrl(product.url)
    }, HTMLSanitizer.sanitizeText(product.title));
    titleDiv.appendChild(titleLink);
    content.appendChild(titleDiv);
    
    // Create price wrapper
    const priceWrap = HTMLSanitizer.createElement('p', { class: 'price-wrap text-left' });
    const newPrice = HTMLSanitizer.createElement('span', { class: 'new-price text-primary' }, formatMoney(product.price));
    priceWrap.appendChild(newPrice);
    
    if (product.comparePrice) {
      const oldPrice = HTMLSanitizer.createElement('span', { class: 'old-price text-decoration-line-through text-dark-1' }, formatMoney(product.comparePrice));
      priceWrap.appendChild(oldPrice);
    }
    
    content.appendChild(priceWrap);
    div.appendChild(content);
    
    // Add event listener for the remove button
    removeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const productId = removeButton.getAttribute('data-id');
      if (productId) {
        this.removeFromCompare(productId);
      }
    });
    
    return div;
  }

  getProductData(productId) {
    
    if (!productId) {
      console.error('No product ID provided');
      return null;
    }

    // First, check if this product is in the recently viewed list
    if (typeof window.RecentlyViewedManager !== 'undefined') {
      const recentlyViewed = window.RecentlyViewedManager.getProducts();
      const recentlyViewedProduct = recentlyViewed.find(p => p.id == productId);
      
      if (recentlyViewedProduct) {
        // Format price if it's a raw number
        let formattedPrice = recentlyViewedProduct.price;
        if (typeof formattedPrice === 'number') {
          formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: window.Shopify?.currency?.active || 'USD'
          }).format(formattedPrice / 100);
        }
        
        let formattedComparePrice = recentlyViewedProduct.compare_at_price || '';
        if (typeof formattedComparePrice === 'number') {
          formattedComparePrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: window.Shopify?.currency?.active || 'USD'
          }).format(formattedComparePrice / 100);
        }
        
        // Ensure we have the image field for compare compatibility
        const productData = {
          id: recentlyViewedProduct.id,
          title: recentlyViewedProduct.title,
          url: recentlyViewedProduct.url,
          image: recentlyViewedProduct.image || recentlyViewedProduct.featured_image || '',
          price: formattedPrice,
          comparePrice: formattedComparePrice
        };
        
        return productData;
      }
    }

    // First try to get data from product section if we're on a product page
    const productSection = document.querySelector('.tf-product-info-wrap');
    let currentProductId = null;
    if (productSection) {
      // Try to get the product ID from a data attribute or hidden input
      currentProductId = productSection.querySelector('[data-product-id]')?.getAttribute('data-product-id') ||
                        productSection.querySelector('[data-id]')?.getAttribute('data-id');
    }

    if (productSection && productId === currentProductId) {
      // Try multiple selectors for product name
      const productName = productSection.querySelector('.product-info-name')?.textContent?.trim() ||
                         productSection.querySelector('.name-product')?.textContent?.trim() ||
                         productSection.querySelector('h5.product-info-name')?.textContent?.trim() ||
                         productSection.querySelector('h6.product-info-name')?.textContent?.trim();
      
      // Try multiple selectors for product image with absolute URL check
      let productImage = document.querySelector('.tf-product-media-main .swiper-slide:first-child img')?.getAttribute('data-src') ||
                        document.querySelector('.tf-product-media-main .swiper-slide:first-child img')?.getAttribute('src') ||
                        document.querySelector('.product-img img')?.getAttribute('data-src') ||
                        document.querySelector('.product-img img')?.getAttribute('src');

      // Ensure image URL is absolute and valid
      if (productImage && !productImage.startsWith('http') && !productImage.startsWith('//')) {
        // If it's a relative URL, make it absolute
        productImage = window.location.origin + (productImage.startsWith('/') ? '' : '/') + productImage;
      }

      // Validate image URL
      if (productImage && productImage.includes('undefined')) {
        productImage = null;
      }
      
      // Try multiple selectors for product price
      const productPrice = productSection.querySelector('.price-new')?.textContent?.trim() ||
                         productSection.querySelector('.price-new.price-on-sale')?.textContent?.trim() ||
                         productSection.querySelector('.display-sm.price-new')?.textContent?.trim() ||
                         productSection.querySelector('.product-info-price .price-new')?.textContent?.trim();
      

      if (productId && (productName || productImage || productPrice)) {
        const productData = {
          id: productId,
          title: productName || '',
          url: window.location.pathname,
          image: productImage || '/no-image.jpg',
          price: productPrice || '',
          comparePrice: productSection.querySelector('.price-old')?.textContent?.trim() || ''
        };
        return productData;
      }
    }

    // Try to find the product in card-product elements
    const allProducts = document.querySelectorAll('.card-product');
    
    for (const card of allProducts) {
      // Check for product ID in various locations
      const cardId = card.querySelector('[data-product-id]')?.getAttribute('data-product-id') ||
                    card.querySelector('[data-id]')?.getAttribute('data-id') ||
                    card.querySelector('.quickview')?.getAttribute('data-product-id');
                    
      if (cardId === productId) {
        // Get image URL with validation
        let cardImage = card.querySelector('.product-img img')?.getAttribute('data-src') ||
                       card.querySelector('.product-img img')?.getAttribute('srcset') ||
                       card.querySelector('img.img-product')?.getAttribute('data-src') ||
                       card.querySelector('img.img-product')?.getAttribute('srcset');

        // Ensure image URL is absolute and valid
        if (cardImage && !cardImage.startsWith('http') && !cardImage.startsWith('//')) {
          cardImage = window.location.origin + (cardImage.startsWith('/') ? '' : '/') + cardImage;
        }

        // Validate image URL
        if (cardImage && cardImage.includes('undefined')) {
          cardImage = null;
        }

        const productData = {
          id: productId,
          title: card.querySelector('.name-product')?.textContent?.trim() || '',
          url: card.querySelector('.product-img')?.getAttribute('href') || 
               card.querySelector('a')?.href || '',
          image: cardImage || '',
          price: card.querySelector('.price-new')?.textContent?.trim() || '',
          comparePrice: card.querySelector('.price-old')?.textContent?.trim() || ''
        };
        
        return productData;
      }
    }

    // If we still haven't found the product, try looking for any element with the product ID
    const productElement = document.querySelector(`[data-product-id="${productId}"], [data-id="${productId}"]`);
    
    if (!productElement) {
      console.error('Product data not found for ID:', productId);
      return null;
    }

    // Get the closest product container
    const container = productElement.closest('.card-product') || productElement.closest('[data-product-id]') || productElement;

    // Get image URL with validation
    let elementImage = container.querySelector('img')?.getAttribute('data-src') ||
                      container.querySelector('img')?.getAttribute('src');

    // Ensure image URL is absolute and valid
    if (elementImage && !elementImage.startsWith('http') && !elementImage.startsWith('//')) {
      elementImage = window.location.origin + (elementImage.startsWith('/') ? '' : '/') + elementImage;
    }

    // Validate image URL
    if (elementImage && elementImage.includes('undefined')) {
      elementImage = null;
    }

    const productData = {
      id: productId,
      title: container.querySelector('.name-product')?.textContent?.trim() || 
             container.querySelector('.title')?.textContent?.trim() || '',
      url: container.querySelector('a')?.href || '',
      image: elementImage || '/no-image.jpg',
      price: container.querySelector('.price-new')?.textContent?.trim() || 
             container.querySelector('.price')?.textContent?.trim() || '',
      comparePrice: container.querySelector('.price-old')?.textContent?.trim() || ''
    };

    return productData;
  }

  /**
   * Show notification message
   * @param {string} message - Message to display
   * @param {string} type - Type of notification ('success', 'error', 'info')
   */
  showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.wishlist-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `wishlist-notification ${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 3000);
  }

  /**
   * Add styles for wishlist animations and notifications
   */
  addStyles() {
    if (document.getElementById('wishlist-compare-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'wishlist-compare-styles';
    style.textContent = `
      .modal-compare .icon-close.remove {
        position: absolute;
        z-index: 5;
        top: 12px;
        right: 12px;
        width: 48px;
        height: 48px;
        border: 1px solid var(--line);
        background-color: var(--white);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        color: #000;
        opacity: 1;
        cursor: pointer;
        padding: 0;
      }
      .modal-compare .icon-close.remove:hover {
        color: #ff0000;
      }
      
      /* Prevent scrollbar from causing layout shifts */
      html {
        scrollbar-gutter: stable;
      }
      
      body.cart-drawer-open {
        padding-right: var(--scrollbar-width, 0px);
      }
      
      /* Wishlist animations */
      .card-product[data-product-id] {
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      .card-product[data-product-id].adding {
        animation: wishlistAdd 0.5s ease-out;
      }
      
      .card-product[data-product-id].removing {
        animation: wishlistRemove 0.3s ease-in;
      }
      
      @keyframes wishlistAdd {
        0% {
          opacity: 0;
          transform: scale(0.8) translateY(20px);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      @keyframes wishlistRemove {
        0% {
          opacity: 1;
          transform: scale(1);
        }
        100% {
          opacity: 0;
          transform: scale(0.8);
        }
      }
      
      /* Notification styles */
      .wishlist-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-size: 14px;
        font-weight: 500;
      }
      
      .wishlist-notification.show {
        transform: translateX(0);
      }
      
      .wishlist-notification.error {
        background: #dc3545;
      }
      
      .wishlist-notification.info {
        background: #17a2b8;
      }
      
      /* Loading state for add to cart buttons */
      .add-to-cart.loading {
        pointer-events: none;
        opacity: 0.7;
      }
      
      .add-to-cart.loading .spinner-border {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        border: 0.125em solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: spinner-border 0.75s linear infinite;
      }
      
      @keyframes spinner-border {
        to {
          transform: rotate(360deg);
        }
      }
      
      /* Success feedback */
      .success-feedback {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #28a745;
      }
      
      .error-feedback {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #dc3545;
      }
      
      /* Cart item loading state */
      .tf-mini-cart-item.loading {
        position: relative;
        pointer-events: none;
        opacity: 0.7;
      }
      
      .tf-mini-cart-item.loading::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .tf-mini-cart-item.loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #007bff;
        border-radius: 50%;
        animation: cart-spinner 1s linear infinite;
        z-index: 11;
      }
      
      @keyframes cart-spinner {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
      
      /* Disable select during loading */
      .tf-mini-cart-item.loading select {
        opacity: 0.5;
      }
    `;
    document.head.appendChild(style);

    // Calculate and set scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
  }

  clearCompareList() {
    // Directly clear the compare list
    this.compareList = [];
    localStorage.removeItem(this.compareKey);
    
    // Update UI without showing notifications
    this.updateButtonsState();
    this.updateCompareDrawer();
    
    // Close the compare drawer
    const drawer = document.getElementById('compare');
    if (drawer) {
      const modal = bootstrap.Modal.getInstance(drawer);
      if (modal) {
        modal.hide();
      }
  }
  }

  updateWishlistCount() {
    const count = this.wishlistList.length;
    // Target both standalone wishlist-count and toolbar-count.wishlist-count elements
    const countElements = document.querySelectorAll('.wishlist-count, .toolbar-count.wishlist-count');
    countElements.forEach(element => {
      element.textContent = count;
      // Only hide/show if it's a toolbar count element (mobile toolbar)
      if (element.classList.contains('toolbar-count')) {
        element.style.display = count > 0 ? '' : 'none';
      }
    });
  }

  /**
   * Add product to compare list
   * @param {string} productId - Product ID to add
   */
  addToCompare(productId) {
    if (!productId) {
      console.error('No product ID provided for compare');
      return;
    }

    // Check if product is already in compare list (handle both old and new formats)
    const isAlreadyInList = this.compareList.some(item => 
      (typeof item === 'string' && item == productId) || 
      (typeof item === 'object' && item.id == productId)
    );
    
    if (isAlreadyInList) {
      // If product is already in list, remove it (toggle behavior)
      console.log('Product already in compare list, removing it');
      this.removeFromCompare(productId);
      return;
    }

    // Get product data before adding to list
    const productData = this.getProductData(productId);
    if (!productData) {
      console.error('Could not get product data for compare');
      return;
    }

    // Store complete product data, not just ID
    this.compareList.push(productData);
    
    // Limit the number of items
    if (this.compareList.length > this.compareLimit) {
      this.compareList.shift(); // Remove oldest item
    }
    
    this.saveCompareList();
    
    // Update UI
    this.updateButtonsState();
    this.updateCompareDrawer();
    
    // Show the compare drawer
    this.showCompareDrawer();
    
    // Show notification
  }

  /**
   * Remove product from compare list
   * @param {string} productId - Product ID to remove
   */
  removeFromCompare(productId) {
    // Handle both old and new formats, and both string/number ID comparisons
    const index = this.compareList.findIndex(product => 
      (typeof product === 'string' && product === productId) || 
      (typeof product === 'object' && (product.id == productId || product.id === productId))
    );
    
    if (index === -1) return;
    
    this.compareList.splice(index, 1);
    this.saveCompareList();
    this.updateButtonsState();
    this.updateCompareDrawer();
    
    // Dispatch event to update the compare page
    document.dispatchEvent(new CustomEvent('compare:updated'));
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.wishlistCompare = new WishlistCompare();
  window.wishlistCompare.addStyles();
});

/**
 * Cart Class
 * Handles shopping cart functionality including:
 * - Adding/removing items
 * - Updating quantities
 * - Managing cart state
 * - Displaying cart drawer
 * - Calculating totals
 * 
 * Usage:
 * - Initialize: new Cart()
 * - Add to cart: <button data-variant-id="variant-id" data-action="add">Add to Cart</button>
 * - Update quantity: <input class="quantity-product" data-variant-id="variant-id" value="1">
 * 
 * Features:
 * - Local storage persistence
 * - Real-time cart updates
 * - Quantity management
 * - Cart drawer display
 * - Shipping threshold calculation
 */
class Cart {
  constructor() {
    // Cart action types
    this.actions = {
      add: 'add',
      update: 'update'
    };
    
    // Local storage key for cart data
    this.storageKey = 'shopify_cart';
    
    // Flag to prevent concurrent cart updates
    this.processingRequests = false;
    
    // Initialize cart functionality
    this.setupEventListeners();
    this.loadCartFromStorage();
    this.initializeCartDrawer();
  }

  /**
   * Initialize the cart drawer and its functionality
   * Sets up event listeners and loads initial cart data
   */
  initializeCartDrawer() {
    
    // Wait for cart drawer to be available
    const checkCartDrawer = setInterval(() => {
      const cartDrawer = document.getElementById('shoppingCart');
      if (cartDrawer) {
        clearInterval(checkCartDrawer);
        this.setupCartDrawer(cartDrawer);
        
        // Fetch cart data and update display
        this.createCartPromise().then(cartData => {
          this.updateCartDisplay(cartData);
        }).catch(error => {
          console.error('Error loading cart data:', error);
        });
      }
    }, 100);

    // Clear interval after 5 seconds if drawer not found
    setTimeout(() => {
      clearInterval(checkCartDrawer);
    }, 5000);
  }

  /**
   * Set up the cart drawer UI and event handlers
   * @param {HTMLElement} cartDrawer - The cart drawer DOM element
   */
  setupCartDrawer(cartDrawer) {
    
    // Ensure the structure is correct
    const cartItemsContainer = cartDrawer.querySelector('.tf-mini-cart-items');
    if (!cartItemsContainer) {
      console.error('Cart items container not found!');
      return;
    }
    
    const closeBtn = cartDrawer.querySelector('.icon-close-popup');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        cartDrawer.classList.remove('show');
      });
    }
    
    // Add event delegation for cart item interactions
    cartItemsContainer.addEventListener('click', async (event) => {
      // Handle quantity buttons
      if (event.target.classList.contains('btn-decrease')) {
        const variantId = event.target.dataset.variantId;
        const input = event.target.nextElementSibling;
        const currentValue = parseInt(input.value);
        const cartItemElement = event.target.closest('.tf-mini-cart-item');
        
        // Add loading state to the cart item
        cartItemElement.classList.add('loading');
        
        try {
          if (currentValue > 1) {
                      const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
              id: variantId,
              quantity: currentValue - 1
            })
          });
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(this.getErrorMessage(response.status, errorData, 'update'));
            }
          } else {
            const response = await fetch('/cart/change.js', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
              },
              body: JSON.stringify({
                id: variantId,
                quantity: 0
              })
            });
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(this.getErrorMessage(response.status, errorData, 'remove'));
            }
          }

          // Fetch updated cart data and update UI
          const cartResponse = await fetch('/cart.js');
          if (!cartResponse.ok) throw new Error('Failed to fetch cart data');
          const cartData = await cartResponse.json();
          
          // Ensure we have complete product data for all items
          if (cartData.items && cartData.items.length > 0) {
            await Promise.all(cartData.items.map(async (item) => {
              try {
                const productResponse = await fetch(`/products/${item.handle}.js`);
                if (productResponse.ok) {
                  const productData = await productResponse.json();
                  // Add variants data to the cart item
                  item.variants = productData.variants;
                }
              } catch (error) {
                console.error(`Error fetching product data for ${item.handle}:`, error);
              }
              // Make sure images are available
              if (!item.image) {
                item.image = item.featured_image?.url || item.product_featured_image || '/no-image.jpg';
              }
              // Normalize URL format
              if (!item.url) {
                item.url = `/products/${item.handle}`;
              }
            }));
          }
          
          this.updateCartDisplay(cartData);
          this.updateHeaderCartCount(cartData.item_count);
          
          // Show success notification
          window.cartNotifications.show('Cart updated successfully!', 'success');
        } catch (error) {
          console.error('Error updating cart:', error);
          window.cartNotifications.show(error.message, 'error');
        } finally {
          // Remove loading state
          cartItemElement.classList.remove('loading');
        }
      } else if (event.target.classList.contains('btn-increase')) {
        const variantId = event.target.dataset.variantId;
        const input = event.target.previousElementSibling;
        const currentValue = parseInt(input.value);
        const cartItemElement = event.target.closest('.tf-mini-cart-item');
        
        // Add loading state to the cart item
        cartItemElement.classList.add('loading');
        
        try {
          const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
              id: variantId,
              quantity: currentValue + 1
            })
          });
          if (!response.ok) throw new Error('Failed to update quantity');

          // Fetch updated cart data and update UI
          const cartResponse = await fetch('/cart.js');
          if (!cartResponse.ok) throw new Error('Failed to fetch cart data');
          const cartData = await cartResponse.json();
          
          // Ensure we have complete product data for all items
          if (cartData.items && cartData.items.length > 0) {
            await Promise.all(cartData.items.map(async (item) => {
              try {
                const productResponse = await fetch(`/products/${item.handle}.js`);
                if (productResponse.ok) {
                  const productData = await productResponse.json();
                  // Add variants data to the cart item
                  item.variants = productData.variants;
                }
              } catch (error) {
                console.error(`Error fetching product data for ${item.handle}:`, error);
              }
              // Make sure images are available
              if (!item.image) {
                item.image = item.featured_image?.url || item.product_featured_image || '/no-image.jpg';
              }
              // Normalize URL format
              if (!item.url) {
                item.url = `/products/${item.handle}`;
              }
            }));
          }
          
          this.updateCartDisplay(cartData);
          this.updateHeaderCartCount(cartData.item_count);
        } catch (error) {
          console.error('Error updating cart:', error);
        } finally {
          // Remove loading state
          cartItemElement.classList.remove('loading');
        }
      } 
      // Handle remove button
      else if (event.target.classList.contains('remove')) {
        const variantId = event.target.dataset.variantId;
        if (variantId) {
          const cartItemElement = event.target.closest('.tf-mini-cart-item');
          
          // Add loading state to the cart item
          cartItemElement.classList.add('loading');
          
          try {
            const response = await fetch('/cart/change.js', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
              },
              body: JSON.stringify({
                id: variantId,
                quantity: 0
              })
            });
            if (!response.ok) throw new Error('Failed to remove item');

            // Fetch updated cart data and update UI
            const cartResponse = await fetch('/cart.js');
            if (!cartResponse.ok) throw new Error('Failed to fetch cart data');
            const cartData = await cartResponse.json();
            
            // Ensure we have complete product data for all items
            if (cartData.items && cartData.items.length > 0) {
              await Promise.all(cartData.items.map(async (item) => {
                try {
                  const productResponse = await fetch(`/products/${item.handle}.js`);
                  if (productResponse.ok) {
                    const productData = await productResponse.json();
                    // Add variants data to the cart item
                    item.variants = productData.variants;
                  }
                } catch (error) {
                  console.error(`Error fetching product data for ${item.handle}:`, error);
                }
                // Make sure images are available
                if (!item.image) {
                  item.image = item.featured_image?.url || item.product_featured_image || '/no-image.jpg';
                }
                // Normalize URL format
                if (!item.url) {
                  item.url = `/products/${item.handle}`;
                }
              }));
            }
            
            this.updateCartDisplay(cartData);
            this.updateHeaderCartCount(cartData.item_count);
          } catch (error) {
            console.error('Error updating cart:', error);
          } finally {
            // Remove loading state
            cartItemElement.classList.remove('loading');
          }
        }
      }
    });
    
    // Add event listener for direct input changes
    cartItemsContainer.addEventListener('change', async (event) => {
      if (event.target.classList.contains('quantity-product')) {
        const variantId = event.target.dataset.variantId;
        const newValue = parseInt(event.target.value);
        const cartItemElement = event.target.closest('.tf-mini-cart-item');
        
        // Add loading state to the cart item
        cartItemElement.classList.add('loading');
        
        try {
          if (isNaN(newValue) || newValue < 1) {
            if (newValue <= 0) {
              const response = await fetch('/cart/change.js', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  id: variantId,
                  quantity: 0
                })
              });
              if (!response.ok) throw new Error('Failed to remove item');
            } else {
              event.target.value = 1;
              const response = await fetch('/cart/change.js', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                  id: variantId,
                  quantity: 1
                })
              });
              if (!response.ok) throw new Error('Failed to update quantity');
            }
          } else {
            const response = await fetch('/cart/change.js', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
              },
              body: JSON.stringify({
                id: variantId,
                quantity: newValue
              })
            });
            if (!response.ok) throw new Error('Failed to update quantity');
          }

          // Fetch updated cart data and update UI
          const cartResponse = await fetch('/cart.js');
          if (!cartResponse.ok) throw new Error('Failed to fetch cart data');
          const cartData = await cartResponse.json();
          
          // Ensure we have complete product data for all items
          if (cartData.items && cartData.items.length > 0) {
            await Promise.all(cartData.items.map(async (item) => {
              try {
                const productResponse = await fetch(`/products/${item.handle}.js`);
                if (productResponse.ok) {
                  const productData = await productResponse.json();
                  // Add variants data to the cart item
                  item.variants = productData.variants;
                }
              } catch (error) {
                console.error(`Error fetching product data for ${item.handle}:`, error);
              }
              // Make sure images are available
              if (!item.image) {
                item.image = item.featured_image?.url || item.product_featured_image || '/no-image.jpg';
              }
              // Normalize URL format
              if (!item.url) {
                item.url = `/products/${item.handle}`;
              }
            }));
          }
          
          this.updateCartDisplay(cartData);
          this.updateHeaderCartCount(cartData.item_count);
        } catch (error) {
          console.error('Error updating cart:', error);
        } finally {
          // Remove loading state
          cartItemElement.classList.remove('loading');
        }
      }
      // Handle variant selection changes
      else if (event.target.tagName === 'SELECT' && event.target.hasAttribute('data-variant-id')) {
        const oldVariantId = event.target.dataset.variantId;
        const newVariantId = event.target.value;
        const quantity = parseInt(event.target.closest('.tf-mini-cart-item').querySelector('.quantity-product').value);
        const cartItemElement = event.target.closest('.tf-mini-cart-item');

        // Add loading state to the cart item
        cartItemElement.classList.add('loading');
        const selectElement = event.target;
        const originalValue = selectElement.value;
        
        // Disable the select during loading
        selectElement.disabled = true;

        try {
          // First remove the old variant
          const removeResponse = await fetch('/cart/change.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
              id: oldVariantId,
              quantity: 0
            })
          });
          if (!removeResponse.ok) throw new Error('Failed to remove old variant');

          // Then add the new variant
          const addResponse = await fetch('/cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
              id: newVariantId,
              quantity: quantity
            })
          });
          if (!addResponse.ok) throw new Error('Failed to add new variant');

          // Fetch updated cart data
          const cartResponse = await fetch('/cart.js');
          if (!cartResponse.ok) throw new Error('Failed to fetch cart data');
          const cartData = await cartResponse.json();
          
          // Find the new item in the cart data
          const newItem = cartData.items.find(item => item.variant_id == newVariantId);
          if (newItem && cartItemElement) {
            // Update the specific cart item element in place
            await this.updateCartItemInPlace(cartItemElement, newItem);
          }
          
          // Update cart total and shipping threshold
          const cartDrawer = document.getElementById('shoppingCart');
          if (cartDrawer) {
            const totalPrice = cartDrawer.querySelector('.tf-totals-total-value');
            if (totalPrice) {
              totalPrice.textContent = this.formatMoney(cartData.total_price);
            }
            this.updateShippingThreshold(cartData.total_price);
          }
          
          this.updateHeaderCartCount(cartData.item_count);
        } catch (error) {
          console.error('Error changing variant:', error);
          // Revert the select to the old value
          event.target.value = oldVariantId;
          event.target.dataset.variantId = oldVariantId;
        } finally {
          // Remove loading state
          cartItemElement.classList.remove('loading');
          selectElement.disabled = false;
        }
      }
    });
  }

  /**
   * Set up event listeners for cart updates
   * Listens for cart changes and quantity updates
   */
  setupEventListeners() {
    // Listen for cart updates
    document.addEventListener('cart:change', (event) => {
      this.updateCartDisplay(event.detail.cart);
    });

    // Listen for quantity changes
    document.addEventListener('change', (event) => {
      if (event.target.classList.contains('quantity-product')) {
        const variantId = event.target.dataset.variantId;
        const quantity = parseInt(event.target.value);
        if (variantId) {
          this.handleQuantityChange(variantId, quantity);
        }
      }
    });
  }

  /**
   * Update product quantity in cart
   * @param {string} id - Variant ID of the product
   * @param {number} quantity - New quantity
   * @param {string} action - Action type ('add' or 'update')
   * @returns {Promise<Object>} Updated cart data
   */
  async updateQuantity(id, quantity, action) {
    // Prevent concurrent requests
    if (this.processingRequests) {
      return;
    }
    
    this.processingRequests = true;
    
    try {
      // Show loading state
      const button = document.querySelector(`[data-variant-id="${id}"]`);
      if (button) {
        button.classList.add('loading');
      }

      // Make API request
      const response = await fetch(action === this.actions.add ? '/cart/add.js' : '/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(action === this.actions.add ? {
          items: [{ id, quantity }]
        } : {
          id,
          quantity
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(this.getErrorMessage(response.status, errorData, action));
      }

      const cartData = await response.json();
      
      // Update cart state
      this.updateCartState(cartData, id, action);
      
      // Save to local storage
      this.saveCartToStorage(cartData);

      // Show success notification
      if (action === this.actions.add) {
        window.cartNotifications.show(cartT.item_added_success || 'Item added to cart successfully!', 'success');
        // First make sure cart display is updated
        this.updateCartDisplay(cartData);
        // Then show the drawer only if not on cart page
        if (window.location.pathname !== '/cart') {
          this.showCartDrawer();
        }
      } else {
        window.cartNotifications.show(cartT.cart_updated_success || 'Cart updated successfully!', 'success');
      }

      // Update header cart count without requiring page reload
      this.updateHeaderCartCount(cartData.item_count);

      return cartData;
    } catch (error) {
      console.error('Error updating cart:', error);
      
      // Show error notification
      window.cartNotifications.show(error.message, 'error');
      
      throw error;
    } finally {
      // Remove loading state
      const button = document.querySelector(`[data-variant-id="${id}"]`);
      if (button) {
        button.classList.remove('loading');
      }
      
      // Reset processing flag
      setTimeout(() => {
        this.processingRequests = false;
      }, 500); // Add small delay to prevent rapid consecutive clicks
    }
  }

  /**
   * Get user-friendly error message based on response status and data
   * @param {number} status - HTTP status code
   * @param {Object} errorData - Error response data
   * @param {string} action - Action type
   * @returns {string} User-friendly error message
   */
  getErrorMessage(status, errorData, action) {
    const actionText = action === this.actions.add ? (window.theme?.translations?.cart?.add_to_cart || 'add to cart') : (window.theme?.translations?.cart?.update_cart || 'update cart');
    const t = window.theme?.translations?.cart || {};
    function interpolate(str, vars) {
      return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key) => vars[key] || '');
    }
    switch (status) {
      case 400:
        if (errorData.description) {
          return errorData.description;
        }
        return interpolate(t.error_unable_action || 'Unable to {{ action }}. Please check your selection and try again.', { action: actionText });
      case 401:
        return t.error_session_expired || 'Session expired. Please refresh the page and try again.';
      case 403:
        return t.error_access_denied || 'Access denied. Please refresh the page and try again.';
      case 404:
        return t.error_product_not_found || 'Product not found. It may have been removed or is no longer available.';
      case 422:
        if (errorData.description) {
          return errorData.description;
        }
        return interpolate(t.error_unable_action_out_of_stock || 'Unable to {{ action }}. The product may be out of stock.', { action: actionText });
      case 429:
        return t.error_too_many_requests || 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
      case 504:
        return t.error_server || 'Server error. Please try again in a few moments.';
      default:
        return interpolate(t.error_failed_action || 'Failed to {{ action }}. Please try again.', { action: actionText });
    }
  }

  /**
   * Show the cart drawer modal
   * Handles backdrop and body styles
   */
  showCartDrawer() {
    const cartDrawer = document.getElementById('shoppingCart');
    if (!cartDrawer) return;
    
    const offcanvas = new bootstrap.Offcanvas(cartDrawer, {
      scroll: false
    });
    offcanvas.show();
    
    // Manually handle body overflow without padding
    document.body.style.overflow = 'hidden';
  }

  /**
   * Update cart state after changes
   * @param {Object} cartData - Updated cart data
   * @param {string} id - Variant ID that was changed
   * @param {string} action - Action performed
   */
  updateCartState(cartData, id, action) {
    // Update cart display
    this.updateCartDisplay(cartData);

    // Update cart count in header
    this.updateHeaderCartCount(cartData.item_count);

    // Dispatch cart change event
    document.dispatchEvent(new CustomEvent('cart:change', {
      detail: { cart: cartData }
    }));
  }

  /**
   * Update the cart drawer display
   * @param {Object} cartData - Cart data to display
   */
  updateCartDisplay(cartData) {
    
    // Safeguard if cartData is not provided
    if (!cartData) {
      console.error('No cart data provided for display update');
      return;
    }
    
    const cartDrawer = document.getElementById('shoppingCart');
    if (!cartDrawer) {
      console.error('Cart drawer element not found for display update');
      return;
    }

    // Update cart items
    const cartItemsContainer = cartDrawer.querySelector('.tf-mini-cart-items');
    if (!cartItemsContainer) {
      console.error('Cart items container not found');
      return;
    }
    const emptyCartMsg = cartItemsContainer.querySelector('.empty-cart');
    if (emptyCartMsg) emptyCartMsg.remove();
    
    // Remove placeholder if it exists
    const placeholder = cartItemsContainer.querySelector('#cart-items-placeholder');
    if (placeholder) {
      placeholder.remove();
    }
    
    // Remember scroll position
    const scrollPosition = cartItemsContainer.scrollTop;
    
    const existingItems = cartItemsContainer.querySelectorAll('.tf-mini-cart-item');
    existingItems.forEach(item => item.remove());

    // Add new items
    if (cartData.items && cartData.items.length > 0) {
      cartData.items.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'tf-mini-cart-item file-delete';
        itemElement.dataset.variantId = item.variant_id;
        
        const itemImage = item.image || item.featured_image?.url || '/no-image.jpg';
        const itemUrl = item.url || `/products/${item.handle}`;
        
        // Ensure prices are properly formatted
        const formattedPrice = this.formatMoney(item.final_price || item.price);
        const formattedOriginalPrice = item.original_price !== item.final_price ? 
          this.formatMoney(item.original_price) : '';

        // Create variant options from the item's properties
        const variantOptions = item.variants ? item.variants.map(variant => ({
          id: variant.id,
          title: variant.title || 'Default',
          selected: variant.id === item.variant_id
        })) : [{
          id: item.variant_id,
          title: item.variant_title || 'Default',
          selected: true
        }];
        
        // Create cart item image
        const imageDiv = HTMLSanitizer.createElement('div', { class: 'tf-mini-cart-image' });
        const imageLink = HTMLSanitizer.createElement('a', { href: HTMLSanitizer.sanitizeUrl(itemUrl) });
        const image = HTMLSanitizer.createElement('img', {
          class: 'lazyload',
          'data-src': HTMLSanitizer.sanitizeUrl(itemImage),
          src: HTMLSanitizer.sanitizeUrl(itemImage),
          alt: HTMLSanitizer.sanitizeText(item.title)
        });
        imageLink.appendChild(image);
        imageDiv.appendChild(imageLink);
        itemElement.appendChild(imageDiv);

        // Create cart item info
        const infoDiv = HTMLSanitizer.createElement('div', { class: 'tf-mini-cart-info' });

        // Create title and remove button row
        const titleRow = HTMLSanitizer.createElement('div', { class: 'd-flex justify-content-between' });
        const titleLink = HTMLSanitizer.createElement('a', {
          class: 'title link text-md fw-medium',
          href: HTMLSanitizer.sanitizeUrl(itemUrl)
        }, HTMLSanitizer.sanitizeText(item.title));
        const removeIcon = HTMLSanitizer.createElement('i', {
          class: 'icon icon-close remove fs-12',
          'data-variant-id': item.variant_id
        });
        titleRow.appendChild(titleLink);
        titleRow.appendChild(removeIcon);
        infoDiv.appendChild(titleRow);

        // Create variant options if available
        if (variantOptions.length > 1) {
          const variantDiv = HTMLSanitizer.createElement('div', { class: 'd-flex gap-10' });
          const infoVariant = HTMLSanitizer.createElement('div', { class: 'info-variant' });
          
          const select = HTMLSanitizer.createElement('select', { class: 'text-xs', 'data-variant-id': item.variant_id });
          variantOptions.forEach(option => {
            const optionElement = HTMLSanitizer.createElement('option', {
              value: option.id,
              selected: option.selected ? 'selected' : undefined
            }, HTMLSanitizer.sanitizeText(option.title));
            select.appendChild(optionElement);
          });
          
          const editIcon = HTMLSanitizer.createElement('i', { class: 'icon-pen edit' });
          infoVariant.appendChild(select);
          infoVariant.appendChild(editIcon);
          variantDiv.appendChild(infoVariant);
          infoDiv.appendChild(variantDiv);
        }

        // Create price wrapper
        const priceWrap = HTMLSanitizer.createElement('p', { class: 'price-wrap text-sm fw-medium' });
        const newPrice = HTMLSanitizer.createElement('span', { class: 'new-price text-primary' }, formattedPrice);
        priceWrap.appendChild(newPrice);
        
        if (formattedOriginalPrice) {
          const oldPrice = HTMLSanitizer.createElement('span', { class: 'old-price text-decoration-line-through text-dark-1' }, formattedOriginalPrice);
          priceWrap.appendChild(oldPrice);
        }
        infoDiv.appendChild(priceWrap);

        // Create quantity controls
        const quantityDiv = HTMLSanitizer.createElement('div', { class: 'wg-quantity small' });
        const decreaseBtn = HTMLSanitizer.createElement('button', {
          class: 'btn-quantity btn-decrease',
          'data-variant-id': item.variant_id
        }, '-');
        const quantityInput = HTMLSanitizer.createElement('input', {
          class: 'quantity-product font-4',
          type: 'text',
          name: 'updates[]',
          value: item.quantity,
          'data-variant-id': item.variant_id
        });
        const increaseBtn = HTMLSanitizer.createElement('button', {
          class: 'btn-quantity btn-increase',
          'data-variant-id': item.variant_id
        }, '+');
        
        quantityDiv.appendChild(decreaseBtn);
        quantityDiv.appendChild(quantityInput);
        quantityDiv.appendChild(increaseBtn);
        infoDiv.appendChild(quantityDiv);

        itemElement.appendChild(infoDiv);
        
        cartItemsContainer.appendChild(itemElement);
      });

      // Add empty cart placeholder if needed
      if (!cartData.items || cartData.items.length === 0) {
        const emptyCartDiv = HTMLSanitizer.createElement('div', { class: 'empty-cart' });
        const emptyText = HTMLSanitizer.createElement('p', {}, cartT.empty_cart || 'Your cart is currently empty.');
        const continueLink = HTMLSanitizer.createElement('a', {
          href: '/collections',
          class: 'tf-btn animate-btn d-inline-flex bg-dark-2'
        }, cartT.continue_shopping || 'Continue shopping');
        
        emptyCartDiv.appendChild(emptyText);
        emptyCartDiv.appendChild(continueLink);
        cartItemsContainer.appendChild(emptyCartDiv);
      }

      // Restore scroll position after items are added
      setTimeout(() => {
        cartItemsContainer.scrollTop = scrollPosition;
      }, 10);
    } else {
      // Show empty cart message if no items
      const emptyCartDiv = HTMLSanitizer.createElement('div', { class: 'empty-cart' });
      const emptyText = HTMLSanitizer.createElement('p', {}, cartT.empty_cart || 'Your cart is currently empty.');
      const continueLink = HTMLSanitizer.createElement('a', {
        href: '/collections',
        class: 'tf-btn animate-btn d-inline-flex bg-dark-2'
      }, cartT.continue_shopping || 'Continue shopping');
      
      emptyCartDiv.appendChild(emptyText);
      emptyCartDiv.appendChild(continueLink);
      cartItemsContainer.appendChild(emptyCartDiv);
    }

    // Update total price with proper formatting
    const totalPrice = cartDrawer.querySelector('.tf-totals-total-value');
    if (totalPrice) {
      totalPrice.textContent = this.formatMoney(cartData.total_price);
    }

    // Update shipping threshold
    this.updateShippingThreshold(cartData.total_price);
    
    // Check if gift wrap is already in cart and hide/show button accordingly
    const giftWrapBtn = cartDrawer.querySelector('.btn-add-gift');
    if (giftWrapBtn) {
      // Get gift wrap product ID from the cart drawer data attribute or settings
      const giftWrapProductId = giftWrapBtn.dataset.giftWrapProductId;
      if (giftWrapProductId) {
        const hasGiftWrap = cartData.items.some(item => 
          item.product_id == giftWrapProductId || 
          (item.properties && item.properties._gift_wrap)
        );
        
        if (hasGiftWrap) {
          giftWrapBtn.style.display = 'none';
        } else {
          giftWrapBtn.style.display = 'block';
        }
      }
    }
    
    // Log final item count
    const finalItems = cartItemsContainer.querySelectorAll('.tf-mini-cart-item');
  }

  /**
   * Update shipping threshold display
   * @param {number} totalPrice - Current cart total in cents
   */
  updateShippingThreshold(totalPrice) {
    const threshold = window.theme?.settings?.free_shipping_threshold || 10000; // Default to $100 if not set
    const progressBar = document.querySelector('.tf-progress-bar .value');
    if (!progressBar) return;
    
    const progress = Math.min(98, (totalPrice / threshold) * 98);
    progressBar.style.width = progress + '%';
    progressBar.setAttribute('data-progress', progress);
    
    const remaining = Math.max(0, threshold - totalPrice) / 100;
    const thresholdText = document.querySelector('.tf-mini-cart-threshold .text');
    if (thresholdText) {
      thresholdText.innerHTML = '';
      if (totalPrice >= threshold) {
        const message = window.theme?.settings?.free_shipping_message || 'Congratulations! You\'ve unlocked Free Shipping';
        const textNode = document.createTextNode(message.replace(/<span class="fw-medium">(.*?)<\/span>/g, '$1'));
        thresholdText.appendChild(textNode);
      } else {
        const progressMessage = window.theme?.settings?.progress_message || 'Spend [amount] more to get Free Shipping';
        const message = progressMessage.replace('[amount]', `$${remaining.toFixed(2)}`);
        const textNode = document.createTextNode(message.replace(/<span class="fw-medium">(.*?)<\/span>/g, '$1'));
        thresholdText.appendChild(textNode);
      }
    }
  }

  /**
   * Remove item from cart
   * @param {string} variantId - Variant ID to remove
   */
  async removeItem(variantId) {
    try {
      await this.updateQuantity(variantId, 0, this.actions.update);
    } catch (error) {
      console.error('Error removing item:', error);
      alert(cartT.failed_remove_item || 'Failed to remove item. Please try again.');    
    }
  }

  /**
   * Create a promise to fetch current cart data
   * @returns {Promise<Object>} Current cart data
   */
  async createCartPromise() {
    try {
      const response = await fetch('/cart.js');
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      const cartData = await response.json();
      
      // Ensure all items have necessary data for display
      if (cartData.items && cartData.items.length > 0) {
        // Fetch additional product data for each item
        await Promise.all(cartData.items.map(async (item) => {
          try {
            const productResponse = await fetch(`/products/${item.handle}.js`);
            if (productResponse.ok) {
              const productData = await productResponse.json();
              // Add variants data to the cart item
              item.variants = productData.variants;
            }
          } catch (error) {
            console.error(`Error fetching product data for ${item.handle}:`, error);
          }
          // Make sure images are available
          if (!item.image) {
            item.image = item.featured_image?.url || item.product_featured_image || '/no-image.jpg';
          }
          // Normalize URL format
          if (!item.url) {
            item.url = `/products/${item.handle}`;
          }
        }));
      }
      
      // Update header cart count immediately when cart data is fetched
      this.updateHeaderCartCount(cartData.item_count);
      
      this.saveCartToStorage(cartData);
      return cartData;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  }

  /**
   * Save cart data to localStorage
   * @param {Object} cartData - Cart data to save
   */
  saveCartToStorage(cartData) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(cartData));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  /**
   * Load cart data from localStorage
   * Also fetches fresh data from server
   */
  loadCartFromStorage() {
    try {
      // First try to load from storage for immediate display
      const cartData = localStorage.getItem(this.storageKey);
      if (cartData) {
        const parsedData = JSON.parse(cartData);
        this.updateCartDisplay(parsedData);
        this.updateHeaderCartCount(parsedData.item_count);
      }
      
      // Then fetch fresh data from server to ensure it's up-to-date
      this.createCartPromise().then(freshCartData => {
        this.updateCartDisplay(freshCartData);
        this.updateHeaderCartCount(freshCartData.item_count);
      }).catch(error => {
        console.error('Error refreshing cart data:', error);
      });
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    }
  }

  /**
   * Clear cart data from localStorage
   */
  clearCartStorage() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing cart storage:', error);
    }
  }

  /**
   * Format price in cents to currency string
   * @param {number} cents - Price in cents
   * @returns {string} Formatted price string
   */
  formatMoney(cents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: window.Shopify.currency.active || 'USD'
    }).format(cents / 100);
  }

  /**
   * Handle quantity change events
   * @param {string} variantId - Variant ID to update
   * @param {number} quantity - New quantity
   */
  handleQuantityChange(variantId, quantity) {
    if (quantity < 1) {
      this.removeItem(variantId);
    } else {
      this.updateQuantity(variantId, quantity, this.actions.update);
    }
  }

  /**
   * Update cart count in header
   * @param {number} count - New cart item count
   */
  updateHeaderCartCount(count) {
    // Update all cart count elements in the header
    const cartCountElements = document.querySelectorAll('.cart-count, .cart-count-bubble, .cart-count-number');
    cartCountElements.forEach(element => {
      element.textContent = count || 0;
      
      // If the element has a parent with cart-link class, update aria-label too
      const cartLink = element.closest('.cart-link');
      if (cartLink) {
        cartLink.setAttribute('aria-label', `Cart (${count || 0} items)`);
      }

      // Show/hide the count element based on count
      element.style.display = '';
    });

    // Also update any elements with data-cart-count attribute
    document.querySelectorAll('[data-cart-count]').forEach(element => {
      element.textContent = count || 0;
      element.setAttribute('data-cart-count', count || 0);
    });

    // Dispatch a custom event for other components that might need to know about cart count changes
    document.dispatchEvent(new CustomEvent('cart:countUpdated', {
      detail: { count: count || 0 }
    }));
  }

  async updateCartItemInPlace(cartItemElement, newItem) {
    try {
      // Fetch product data to get all variants
      const productResponse = await fetch(`/products/${newItem.handle}.js`);
      let variantOptions = [{
        id: newItem.variant_id,
        title: newItem.variant_title || 'Default',
        selected: true
      }];
      
      if (productResponse.ok) {
        const productData = await productResponse.json();
        if (productData.variants && productData.variants.length > 1) {
          variantOptions = productData.variants.map(variant => ({
            id: variant.id,
            title: variant.title || 'Default',
            selected: variant.id === newItem.variant_id
          }));
        }
      }

      // Update the cart item element's data attributes
      cartItemElement.dataset.variantId = newItem.variant_id;
      
      // Update the image
      const imageElement = cartItemElement.querySelector('.tf-mini-cart-image img');
      if (imageElement) {
        const itemImage = newItem.image || newItem.featured_image?.url || '/no-image.jpg';
        imageElement.src = itemImage;
        imageElement.setAttribute('data-src', itemImage);
        imageElement.alt = newItem.title;
      }

      // Update the title link
      const titleLink = cartItemElement.querySelector('.tf-mini-cart-info .title');
      if (titleLink) {
        titleLink.textContent = newItem.title;
        titleLink.href = newItem.url || `/products/${newItem.handle}`;
      }

      // Update the remove button
      const removeButton = cartItemElement.querySelector('.remove');
      if (removeButton) {
        removeButton.dataset.variantId = newItem.variant_id;
      }

      // Update the select element
      const selectElement = cartItemElement.querySelector('select[data-variant-id]');
      if (selectElement && variantOptions.length > 1) {
        selectElement.dataset.variantId = newItem.variant_id;
        selectElement.innerHTML = '';
        variantOptions.forEach(option => {
          const optionElement = HTMLSanitizer.createElement('option', {
            value: option.id,
            selected: option.selected ? 'selected' : undefined
          }, HTMLSanitizer.sanitizeText(option.title));
          selectElement.appendChild(optionElement);
        });
      }

      // Update quantity controls
      const quantityInput = cartItemElement.querySelector('.quantity-product');
      if (quantityInput) {
        quantityInput.dataset.variantId = newItem.variant_id;
        quantityInput.value = newItem.quantity;
      }

      const decreaseBtn = cartItemElement.querySelector('.btn-decrease');
      if (decreaseBtn) {
        decreaseBtn.dataset.variantId = newItem.variant_id;
      }

      const increaseBtn = cartItemElement.querySelector('.btn-increase');
      if (increaseBtn) {
        increaseBtn.dataset.variantId = newItem.variant_id;
      }

      // Update price
      const priceElement = cartItemElement.querySelector('.new-price');
      if (priceElement) {
        priceElement.textContent = this.formatMoney(newItem.final_price || newItem.price);
      }

      // Update original price if it exists
      const oldPriceElement = cartItemElement.querySelector('.old-price');
      if (oldPriceElement) {
        if (newItem.original_price !== newItem.final_price) {
          oldPriceElement.textContent = this.formatMoney(newItem.original_price);
          oldPriceElement.style.display = 'inline';
        } else {
          oldPriceElement.style.display = 'none';
        }
      }

    } catch (error) {
      console.error('Error updating cart item in place:', error);
    }
  }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.cart = new Cart();
  
  // Initialize Bootstrap offcanvas for cart drawer
  const cartDrawer = document.getElementById('shoppingCart');
  if (cartDrawer) {
    // Ensure Bootstrap offcanvas is properly initialized
    if (typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
      new bootstrap.Offcanvas(cartDrawer);
    }
  }
});

window.openCartDrawer = function() {
  const cartDrawer = document.getElementById('shoppingCart');
  if (!cartDrawer) return;
  
  const offcanvas = new bootstrap.Offcanvas(cartDrawer, {
    scroll: false
  });
  offcanvas.show();
  
  // Manually handle body overflow without padding
  document.body.style.overflow = 'hidden';
};

window.closeCartDrawer = function() {
  const cartDrawer = document.getElementById('shoppingCart');
  if (!cartDrawer) return;
  
  // Use Bootstrap's offcanvas API
  const offcanvas = bootstrap.Offcanvas.getInstance(cartDrawer);
  if (offcanvas) {
    offcanvas.hide();
  }
  
  // Restore body overflow and remove any padding
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}; 

/**
 * Centralized notification system for cart operations
 */
class CartNotificationManager {
  constructor() {
    this.notificationQueue = [];
    this.isShowing = false;
    this.addStyles();
  }

  /**
   * Show a notification message
   * @param {string} message - Message to display
   * @param {string} type - Type of notification ('success', 'error', 'warning', 'info')
   * @param {number} duration - Duration in milliseconds (default: 4000)
   */
  show(message, type = 'success', duration = 4000) {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      duration
    };

    this.notificationQueue.push(notification);
    this.processQueue();
  }

  /**
   * Process the notification queue
   */
  processQueue() {
    if (this.isShowing || this.notificationQueue.length === 0) {
      return;
    }

    this.isShowing = true;
    const notification = this.notificationQueue.shift();
    this.displayNotification(notification);
  }

  /**
   * Display a single notification
   * @param {Object} notification - Notification object
   */
  displayNotification(notification) {
    // Remove existing notifications of the same type
    const existingNotifications = document.querySelectorAll(`.cart-notification.${notification.type}`);
    existingNotifications.forEach(note => note.remove());

    // Create notification element
    const notificationEl = document.createElement('div');
    notificationEl.className = `cart-notification ${notification.type}`;
    notificationEl.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">
          ${this.getIcon(notification.type)}
        </div>
        <div class="notification-message">${notification.message}</div>
        <button class="notification-close" aria-label="${cartT.close_notification || 'Close notification'}">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M1 1l10 10M1 11L11 1"/>
          </svg>
        </button>
      </div>
    `;

    // Add to page
    document.body.appendChild(notificationEl);

    // Show notification
    requestAnimationFrame(() => {
      notificationEl.classList.add('show');
    });

    // Add close button functionality
    const closeBtn = notificationEl.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      this.hideNotification(notificationEl);
    });

    // Auto-hide after duration
    setTimeout(() => {
      this.hideNotification(notificationEl);
    }, notification.duration);
  }

  /**
   * Hide a notification
   * @param {HTMLElement} notificationEl - Notification element
   */
  hideNotification(notificationEl) {
    notificationEl.classList.remove('show');
    setTimeout(() => {
      if (notificationEl.parentNode) {
        notificationEl.remove();
      }
      this.isShowing = false;
      this.processQueue();
    }, 300);
  }

  /**
   * Get icon for notification type
   * @param {string} type - Notification type
   * @returns {string} SVG icon
   */
  getIcon(type) {
    const icons = {
      success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
      warning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
    };
    return icons[type] || icons.info;
  }

  /**
   * Add notification styles
   */
  addStyles() {
    if (document.getElementById('cart-notification-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'cart-notification-styles';
    style.textContent = `
      .cart-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fff;
        color: #333;
        padding: 0;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 400px;
        min-width: 300px;
        border: 1px solid #e5e7eb;
        overflow: hidden;
      }
      
      .cart-notification.show {
        transform: translateX(0);
      }
      
      .cart-notification .notification-content {
        display: flex;
        align-items: center;
        padding: 16px;
        gap: 12px;
      }
      
      .cart-notification .notification-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
      }
      
      .cart-notification .notification-message {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.4;
      }
      
      .cart-notification .notification-close {
        flex-shrink: 0;
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s;
        border-radius: 4px;
      }
      
      .cart-notification .notification-close:hover {
        opacity: 1;
        background: rgba(0,0,0,0.05);
      }
      
      .cart-notification.success {
        border-left: 4px solid #10b981;
      }
      
      .cart-notification.success .notification-icon {
        color: #10b981;
      }
      
      .cart-notification.error {
        border-left: 4px solid #ef4444;
      }
      
      .cart-notification.error .notification-icon {
        color: #ef4444;
      }
      
      .cart-notification.warning {
        border-left: 4px solid #f59e0b;
      }
      
      .cart-notification.warning .notification-icon {
        color: #f59e0b;
      }
      
      .cart-notification.info {
        border-left: 4px solid #3b82f6;
      }
      
      .cart-notification.info .notification-icon {
        color: #3b82f6;
      }
      
      @media (max-width: 768px) {
        .cart-notification {
          top: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
          min-width: auto;
          transform: translateY(-100%);
        }
        
        .cart-notification.show {
          transform: translateY(0);
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Initialize global notification manager
window.cartNotifications = new CartNotificationManager();

/**
 * Global event handler to prevent default behavior for href="#" links
 * This prevents page jumping when clicking links with href="#"
 */
document.addEventListener('DOMContentLoaded', () => {
  // Prevent default behavior for all links with href="#"
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a[href="#"]');
    if (target) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
});

// ... existing code ...
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
    console.log('Initializing WishlistCompare event listeners');
    document.addEventListener('click', (e) => {
      console.log('Click event detected:', e.target);
      this.handleClick(e);
    });
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Initialize buttons state
    this.updateButtonsState();
    this.updateWishlistCount();
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
   * @returns {Array} Array of product IDs in compare list
   */
  getCompareList() {
    const stored = localStorage.getItem(this.compareKey);
    return stored ? stored.split(',') : [];
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
    localStorage.setItem(this.compareKey, this.compareList.join(','));
  }

  /**
   * Handle click events on wishlist and compare buttons
   * @param {Event} event - Click event object
   */
  handleClick(event) {
    console.log('handleClick called, checking for target');
    const target = event.target.closest('[data-wishlist], [data-compare]');
    console.log('Found target:', target);
    if (!target) {
      console.log('No valid target found');
      return;
    }

    console.log('Click target:', target);
    console.log('Target dataset:', target.dataset);
    console.log('Target attributes:', {
      'data-id': target.getAttribute('data-id'),
      'data-action': target.getAttribute('data-action'),
      'data-compare': target.hasAttribute('data-compare'),
      'data-wishlist': target.hasAttribute('data-wishlist')
    });

    const isWishlist = target.hasAttribute('data-wishlist');
    const productId = target.getAttribute('data-id');
    const action = target.getAttribute('data-action');

    console.log('Click handler:', { isWishlist, productId, action });

    if (isWishlist) {
      this.handleWishlist(productId, action);
    } else if (action === 'clear') {
      this.clearCompareList();
    } else if (action === 'add') {
      console.log('Adding to compare, product ID:', productId);
      this.addToCompare(productId);
    } else if (action === 'remove') {
      console.log('Removing from compare, product ID:', productId);
      this.removeFromCompare(productId);
    } else {
      console.log('No matching action found');
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
  addToWishlist(productId) {
    if (this.wishlistList.includes(productId)) return;
    
    this.wishlistList.unshift(productId);
    if (this.wishlistList.length > this.wishlistLimit) {
      this.wishlistList.pop();
    }
    
    this.saveWishlistList();
    this.updateButtonsState();
    this.updateWishlistCount();
    this.showNotification('Added to wishlist');
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
    this.showNotification('Removed from wishlist');
  }

  /**
   * Add product to compare list
   * @param {string} productId - Product ID to add
   */
  addToCompare(productId) {
    console.log('addToCompare called with ID:', productId);
    
    if (!productId) {
      console.error('No product ID provided for compare');
      return;
    }

    if (this.compareList.includes(productId)) {
      console.log('Product already in compare list:', productId);
      return;
    }
    
    console.log('Current compare list:', this.compareList);
    this.compareList.unshift(productId);
    console.log('Updated compare list:', this.compareList);
    
    if (this.compareList.length > this.compareLimit) {
      this.compareList.pop();
    }
    
    this.saveCompareList();
    this.updateButtonsState();
    
    // Only show drawer if we have valid product data
    const productData = this.getProductData(productId);
    console.log('Product data retrieved:', productData);
    
    if (productData) {
      this.showCompareDrawer();
      this.showNotification('Added to compare');
    } else {
      console.error('Could not get product data for compare');
    }
  }

  /**
   * Remove product from compare list
   * @param {string} productId - Product ID to remove
   */
  removeFromCompare(productId) {
    if (!productId) {
      console.error('No product ID provided for remove from compare');
      return;
    }

    const index = this.compareList.indexOf(productId);
    if (index === -1) return;
    
    this.compareList.splice(index, 1);
    this.saveCompareList();
    this.updateButtonsState();
    this.updateCompareDrawer();
    this.showNotification('Removed from compare');
    
    // Dispatch event to update the compare page
    document.dispatchEvent(new CustomEvent('compare:updated'));
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
      this.updateButtonText(button, isInWishlist, 'wishlist');
    });

    // Update compare buttons
    document.querySelectorAll('[data-compare]').forEach(button => {
      const productId = button.getAttribute('data-id');
      if (!productId) return; // Skip buttons without product ID (like Clear All)
      const isInCompare = this.compareList.includes(productId);
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
    const tooltip = button.querySelector('.tooltip');
    if (tooltip) {
      tooltip.textContent = isActive ? `Remove from ${type}` : `Add to ${type}`;
    }
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
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
      
      // Fix body styles
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.classList.remove('modal-open');
    }, { once: true }); // Use once:true to avoid memory leaks
    
    modal.show();
    this.updateCompareDrawer();
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

    // Add current compare items
    this.compareList.forEach(productId => {
      if (!productId) return; // Skip invalid product IDs
      
      const product = this.getProductData(productId);
      if (!product) {
        console.error(`Could not get product data for ID: ${productId}`);
        return;
      }

      const item = this.createCompareItem(product);
      compareList.appendChild(item);
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
    const div = document.createElement('div');
    div.className = 'tf-compare-item file-delete';
    div.setAttribute('data-product-id', product.id);
    
    div.innerHTML = `
      <button type="button" class="icon-close remove" data-compare data-id="${product.id}" data-action="remove" aria-label="Remove from compare"></button>
      <a href="${product.url}" class="image">
        <img class="lazyload" data-src="${product.image}" src="${product.image}" alt="${product.title}">
      </a>
      <div class="content">
        <div class="text-title">
          <a class="link text-line-clamp-2" href="${product.url}">${product.title}</a>
        </div>
        <p class="price-wrap">
          <span class="new-price text-primary">${product.price}</span>
          ${product.comparePrice ? `<span class="old-price text-decoration-line-through text-dark-1">${product.comparePrice}</span>` : ''}
        </p>
      </div>
    `;
    
    return div;
  }

  getProductData(productId) {
    console.log('getProductData called with ID:', productId);
    
    if (!productId) {
      console.error('No product ID provided');
      return null;
    }

    // First try to get data from product section if we're on a product page
    const productSection = document.querySelector('.tf-product-info-wrap');
    console.log('Product section found:', !!productSection);
    
    if (productSection) {
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
      
      console.log('Product section data:', { productName, productImage, productPrice });

      if (productId && (productName || productImage || productPrice)) {
        const productData = {
          id: productId,
          title: productName || '',
          url: window.location.pathname,
          image: productImage || '/no-image.jpg',
          price: productPrice || '',
          comparePrice: productSection.querySelector('.price-old')?.textContent?.trim() || ''
        };
        console.log('Returning product data from section:', productData);
        return productData;
      }
    }

    // Try to find the product in card-product elements
    const allProducts = document.querySelectorAll('.card-product');
    console.log('Found card-product elements:', allProducts.length);
    
    for (const card of allProducts) {
      // Check for product ID in various locations
      const cardId = card.querySelector('[data-product-id]')?.getAttribute('data-product-id') ||
                    card.querySelector('[data-id]')?.getAttribute('data-id') ||
                    card.querySelector('.quickview')?.getAttribute('data-product-id');
                    
      console.log('Checking card with ID:', cardId);
      
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
        
        console.log('Returning product data from card:', productData);
        return productData;
      }
    }

    // If we still haven't found the product, try looking for any element with the product ID
    const productElement = document.querySelector(`[data-product-id="${productId}"], [data-id="${productId}"]`);
    console.log('Product element found:', !!productElement);
    
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

    console.log('Returning product data from element:', productData);
    return productData;
  }

  showNotification(message) {
    // Implement your notification system here
    console.log(message);
  }

  addStyles() {
    const style = document.createElement('style');
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
    `;
    document.head.appendChild(style);
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
    
    // Show only the clear notification
    this.showNotification('Compare list cleared');
  }

  updateWishlistCount() {
    const count = this.wishlistList.length;
    const countElement = document.querySelector('.wishlist-count');
    if (countElement) {
      countElement.textContent = count;
      countElement.style.display = count > 0;
    }
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
    console.log('Initializing cart drawer');
    
    // Wait for cart drawer to be available
    const checkCartDrawer = setInterval(() => {
      const cartDrawer = document.getElementById('shoppingCart');
      if (cartDrawer) {
        console.log('Cart drawer found, setting up');
        clearInterval(checkCartDrawer);
        this.setupCartDrawer(cartDrawer);
        
        // Fetch cart data and update display
        this.createCartPromise().then(cartData => {
          console.log('Cart data loaded:', cartData.items.length, 'items');
          this.updateCartDisplay(cartData);
        }).catch(error => {
          console.error('Error loading cart data:', error);
        });
      }
    }, 100);

    // Clear interval after 5 seconds if drawer not found
    setTimeout(() => {
      clearInterval(checkCartDrawer);
      console.log('Cart drawer initialization timed out');
    }, 5000);
  }

  /**
   * Set up the cart drawer UI and event handlers
   * @param {HTMLElement} cartDrawer - The cart drawer DOM element
   */
  setupCartDrawer(cartDrawer) {
    console.log('Setting up cart drawer events');
    
    // Ensure the structure is correct
    const cartItemsContainer = cartDrawer.querySelector('.tf-mini-cart-items');
    if (!cartItemsContainer) {
      console.error('Cart items container not found!');
      return;
    }
    
    // Make sure the scroll container has the correct style
    if (cartItemsContainer) {
      // Force proper styling for scrolling
      cartItemsContainer.style.overflowY = 'auto';
      cartItemsContainer.style.maxHeight = 'calc(100vh - 280px)';
      console.log('Cart items container styled for scrolling');
    }
    
    const closeBtn = cartDrawer.querySelector('.icon-close-popup');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        cartDrawer.classList.remove('show');
      });
      console.log('Close button event listener added');
    }
    
    // Add event delegation for cart item interactions
    cartItemsContainer.addEventListener('click', (event) => {
      // Handle quantity buttons
      if (event.target.classList.contains('minus-btn')) {
        const variantId = event.target.dataset.variantId;
        const input = event.target.nextElementSibling;
        const currentValue = parseInt(input.value);
        if (currentValue > 1) {
          this.updateQuantity(variantId, currentValue - 1, this.actions.update);
        } else {
          // If quantity would be less than 1, remove the item
          this.removeItem(variantId);
        }
      } else if (event.target.classList.contains('plus-btn')) {
        const variantId = event.target.dataset.variantId;
        const input = event.target.previousElementSibling;
        const currentValue = parseInt(input.value);
        this.updateQuantity(variantId, currentValue + 1, this.actions.update);
      } 
      // Handle remove button
      else if (event.target.classList.contains('remove')) {
        const variantId = event.target.dataset.variantId;
        if (variantId) {
          this.removeItem(variantId);
        }
      }
    });
    
    // Add event listener for direct input changes
    cartItemsContainer.addEventListener('change', (event) => {
      if (event.target.classList.contains('quantity-product')) {
        const variantId = event.target.dataset.variantId;
        const newValue = parseInt(event.target.value);
        if (isNaN(newValue) || newValue < 1) {
          // Reset to 1 or remove
          if (newValue <= 0) {
            this.removeItem(variantId);
          } else {
            event.target.value = 1;
            this.updateQuantity(variantId, 1, this.actions.update);
          }
        } else {
          this.updateQuantity(variantId, newValue, this.actions.update);
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
      console.log('Request in progress, please wait...');
      return;
    }
    
    this.processingRequests = true;
    
    try {
      // Show loading state
      const button = document.querySelector(`[data-variant-id="${id}"]`);
      if (button) {
        button.classList.add('loading');
      }

      console.log(`Processing cart update: ${action} - ID: ${id}, Quantity: ${quantity}`);
      
      // Make API request
      const response = await fetch(action === this.actions.add ? '/cart/add.js' : '/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(action === this.actions.add ? {
          items: [{ id, quantity }]
        } : {
          id,
          quantity
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update cart');
      }

      const cartData = await response.json();
      console.log('Cart update successful', cartData);
      
      // Update cart state
      this.updateCartState(cartData, id, action);
      
      // Save to local storage
      this.saveCartToStorage(cartData);

      // Show cart drawer if adding item (moved below update to ensure cart content is ready)
      if (action === this.actions.add) {
        // First make sure cart display is updated
        this.updateCartDisplay(cartData);
        // Then show the drawer
        this.showCartDrawer();
      }

      // Update header cart count without requiring page reload
      this.updateHeaderCartCount(cartData.item_count);

      return cartData;
    } catch (error) {
      console.error('Error updating cart:', error);
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
   * Show the cart drawer modal
   * Handles backdrop and body styles
   */
  showCartDrawer() {
    console.log('Opening cart drawer');
    if (window.openCartDrawer) {
      // Use our custom function that prevents full-screen backdrop
      window.openCartDrawer();
    } else {
      // Fallback to the old method
      const cartDrawer = document.getElementById('shoppingCart');
      if (cartDrawer) {
        // Log cart contents before showing drawer
        const cartItems = cartDrawer.querySelectorAll('.tf-mini-cart-item');
        console.log(`Cart drawer contains ${cartItems.length} items before showing`);
        
        cartDrawer.classList.add('show');
        
        // Remove any offcanvas-backdrop elements that might be created by Bootstrap
        const backdrop = document.querySelector('.offcanvas-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
      } else {
        console.error('Cart drawer element not found');
      }
    }
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
    console.log('Updating cart display with', cartData?.items?.length || 0, 'items');
    
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
    
    // Debug log to check structure
    console.log('Cart drawer structure:', 
      cartDrawer.querySelector('.tf-mini-cart-main') ? 'Has main container' : 'Missing main container',
      cartDrawer.querySelector('.tf-mini-cart-sroll') ? 'Has scroll container' : 'Missing scroll container',
      cartItemsContainer ? 'Has items container' : 'Missing items container'
    );
    
    // Remove placeholder if it exists
    const placeholder = cartItemsContainer.querySelector('#cart-items-placeholder');
    if (placeholder) {
      console.log('Removing cart placeholder');
      placeholder.remove();
    }
    
    // Remember scroll position
    const scrollPosition = cartItemsContainer.scrollTop;
    
    // Clear existing items (exclude placeholder)
    const existingItems = cartItemsContainer.querySelectorAll('.tf-mini-cart-item');
    console.log(`Removing ${existingItems.length} existing cart items`);
    existingItems.forEach(item => item.remove());

    // Add new items
    if (cartData.items && cartData.items.length > 0) {
      console.log(`Adding ${cartData.items.length} items to cart drawer`);
      cartData.items.forEach((item, index) => {
        console.log(`Creating element for item ${index + 1}: ${item.title}`);
        const itemElement = document.createElement('div');
        itemElement.className = 'tf-mini-cart-item file-delete';
        itemElement.dataset.variantId = item.variant_id;
        
        const itemImage = item.image || item.featured_image?.url || '/no-image.jpg';
        const itemUrl = item.url || `/products/${item.handle}`;
        
        // Ensure prices are properly formatted
        const formattedPrice = this.formatMoney(item.final_price || item.price);
        const formattedOriginalPrice = item.original_price !== item.final_price ? 
          this.formatMoney(item.original_price) : '';
        
        itemElement.innerHTML = `
          <div class="tf-mini-cart-image">
            <a href="${itemUrl}">
              <img class="lazyload" data-src="${itemImage}" src="${itemImage}" alt="${item.title}">
            </a>
          </div>
          <div class="tf-mini-cart-info">
            <div class="d-flex justify-content-between">
              <a class="title link text-md fw-medium" href="${itemUrl}">${item.title}</a>
              <i class="icon icon-close remove fs-12" data-variant-id="${item.variant_id}"></i>
            </div>
            <div class="d-flex gap-10">
              <div class="text-xs">${item.variant_title || ''}</div>
            </div>
            <p class="price-wrap text-sm fw-medium">
              <span class="new-price text-primary">${formattedPrice}</span>
              ${formattedOriginalPrice ? 
                `<span class="old-price text-decoration-line-through text-dark-1">${formattedOriginalPrice}</span>` : 
                ''}
            </p>
            <div class="wg-quantity small">
              <button class="btn-quantity minus-btn" data-variant-id="${item.variant_id}">-</button>
              <input class="quantity-product font-4" type="text" name="updates[]" value="${item.quantity}" data-variant-id="${item.variant_id}">
              <button class="btn-quantity plus-btn" data-variant-id="${item.variant_id}">+</button>
            </div>
          </div>
        `;
        
        cartItemsContainer.appendChild(itemElement);
      });

      // Add empty cart placeholder if needed
      if (cartItemsContainer.children.length === 0) {
        console.warn('No items were added to cart drawer despite having items in cart data');
        cartItemsContainer.innerHTML = `
          <div class="empty-cart">
            <p>Your cart appears to be empty. Please try refreshing the page.</p>
            <a href="/collections/all" class="tf-btn animate-btn d-inline-flex bg-dark-2">Continue shopping</a>
          </div>
        `;
      }

      // Restore scroll position after items are added
      setTimeout(() => {
        cartItemsContainer.scrollTop = scrollPosition;
      }, 10);
    } else {
      // Show empty cart message if no items
      console.log('Cart is empty, showing empty cart message');
      cartItemsContainer.innerHTML = `
        <div class="empty-cart">
          <p>Your cart is currently empty.</p>
          <a href="/collections/all" class="tf-btn animate-btn d-inline-flex bg-dark-2">Continue shopping</a>
        </div>
      `;
    }

    // Update total price with proper formatting
    const totalPrice = cartDrawer.querySelector('.tf-totals-total-value');
    if (totalPrice) {
      totalPrice.textContent = this.formatMoney(cartData.total_price);
    }

    // Update shipping threshold
    this.updateShippingThreshold(cartData.total_price);
    
    // Log final item count
    const finalItems = cartItemsContainer.querySelectorAll('.tf-mini-cart-item');
    console.log(`Cart drawer now contains ${finalItems.length} items after update`);
  }

  /**
   * Update shipping threshold display
   * @param {number} totalPrice - Current cart total in cents
   */
  updateShippingThreshold(totalPrice) {
    const threshold = 100 * 100; // $100 in cents
    const progressBar = document.querySelector('.tf-progress-bar .value');
    if (!progressBar) return;
    
    const progress = Math.min(100, (totalPrice / threshold) * 100);
    progressBar.style.width = progress + '%';
    progressBar.setAttribute('data-progress', progress);
    
    const remaining = Math.max(0, threshold - totalPrice) / 100;
    const thresholdText = document.querySelector('.tf-mini-cart-threshold .text');
    if (thresholdText) {
      if (totalPrice >= threshold) {
        thresholdText.innerHTML = 'Congratulations! You\'ve unlocked <span class="fw-medium">Free Shipping</span>';
      } else {
        thresholdText.innerHTML = `Spend <span class="fw-medium">$${remaining.toFixed(2)}</span> more to get <span class="fw-medium">Free Shipping</span>`;
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
      alert('Failed to remove item. Please try again.');
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
        cartData.items.forEach(item => {
          // Make sure images are available
          if (!item.image) {
            item.image = item.featured_image?.url || item.product_featured_image || '/no-image.jpg';
          }
          // Normalize URL format
          if (!item.url) {
            item.url = `/products/${item.handle}`;
          }
        });
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
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
      element.textContent = count || 0;
      
      // If the element has a parent with cart-link class, update aria-label too
      const cartLink = element.closest('.cart-link');
      if (cartLink) {
        cartLink.setAttribute('aria-label', `Cart (${count || 0} items)`);
      }
    });
  }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.cart = new Cart();
}); 
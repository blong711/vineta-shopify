// Wishlist and Compare functionality
class WishlistCompare {
  constructor() {
    this.wishlistKey = 'theme4:wishlist:id';
    this.compareKey = 'theme4:compare:id';
    this.wishlistList = this.getWishlistList();
    this.compareList = this.getCompareList();
    this.wishlistLimit = 50;
    this.compareLimit = 6;
    
    this.init();
  }

  init() {
    // Initialize event listeners
    document.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Initialize buttons state
    this.updateButtonsState();
    this.updateWishlistCount();
  }

  getWishlistList() {
    const stored = localStorage.getItem(this.wishlistKey);
    return stored ? stored.split(',') : [];
  }

  getCompareList() {
    const stored = localStorage.getItem(this.compareKey);
    return stored ? stored.split(',') : [];
  }

  saveWishlistList() {
    localStorage.setItem(this.wishlistKey, this.wishlistList.join(','));
  }

  saveCompareList() {
    localStorage.setItem(this.compareKey, this.compareList.join(','));
  }

  handleClick(event) {
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

  handleWishlist(productId, action) {
    if (action === 'add') {
      this.addToWishlist(productId);
    } else if (action === 'remove') {
      this.removeFromWishlist(productId);
    }
  }

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

  removeFromWishlist(productId) {
    const index = this.wishlistList.indexOf(productId);
    if (index === -1) return;
    
    this.wishlistList.splice(index, 1);
    this.saveWishlistList();
    this.updateButtonsState();
    this.updateWishlistCount();
    this.showNotification('Removed from wishlist');
  }

  addToCompare(productId) {
    if (this.compareList.includes(productId)) return;
    
    this.compareList.unshift(productId);
    if (this.compareList.length > this.compareLimit) {
      this.compareList.pop();
    }
    
    this.saveCompareList();
    this.updateButtonsState();
    this.showCompareDrawer();
    this.showNotification('Added to compare');
  }

  removeFromCompare(productId) {
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

  updateButtonText(button, isActive, type) {
    const tooltip = button.querySelector('.tooltip');
    if (tooltip) {
      tooltip.textContent = isActive ? `Remove from ${type}` : `Add to ${type}`;
    }
  }

  showCompareDrawer() {
    const drawer = document.getElementById('compare');
    if (!drawer) return;
    
    // Create and show Bootstrap modal
    const modal = new bootstrap.Modal(drawer);
    modal.show();
    
    this.updateCompareDrawer();
  }

  updateCompareDrawer() {
    const drawer = document.getElementById('compare');
    if (!drawer) return;

    const compareList = drawer.querySelector('.tf-compare-list');
    if (!compareList) return;

    // Clear existing items
    compareList.innerHTML = '';

    // Add current compare items
    this.compareList.forEach(productId => {
      const product = this.getProductData(productId);
      if (!product) return;

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
    // This should be implemented to get product data from your theme
    // You might want to store product data in a data attribute or fetch it from an API
    const productElement = document.querySelector(`[data-product-id="${productId}"]`);
    if (!productElement) return null;

    return {
      id: productId,
      title: productElement.getAttribute('data-product-title'),
      url: productElement.getAttribute('data-product-url'),
      image: productElement.getAttribute('data-product-image'),
      price: productElement.getAttribute('data-product-price'),
      comparePrice: productElement.getAttribute('data-product-compare-price')
    };
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

// Cart functionality
class Cart {
  constructor() {
    this.actions = {
      add: 'add',
      update: 'update'
    };
    this.storageKey = 'shopify_cart';
    this.processingRequests = false; // Flag to prevent concurrent requests
    this.setupEventListeners();
    this.loadCartFromStorage();
    this.initializeCartDrawer();
  }

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
              <span class="new-price text-primary">${this.formatMoney(item.price)}</span>
              ${item.original_price !== item.final_price ? 
                `<span class="old-price text-decoration-line-through text-dark-1">${this.formatMoney(item.original_price)}</span>` : 
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

    // Update total price
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

  async removeItem(variantId) {
    try {
      await this.updateQuantity(variantId, 0, this.actions.update);
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item. Please try again.');
    }
  }

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

  saveCartToStorage(cartData) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(cartData));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

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

  clearCartStorage() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing cart storage:', error);
    }
  }

  formatMoney(cents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: window.Shopify.currency.active || 'USD'
    }).format(cents / 100);
  }

  handleQuantityChange(variantId, quantity) {
    if (quantity < 1) {
      this.removeItem(variantId);
    } else {
      this.updateQuantity(variantId, quantity, this.actions.update);
    }
  }

  // New method to update cart count in header
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
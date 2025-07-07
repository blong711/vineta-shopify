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
      
      // Create product card HTML
      const productCardHTML = this.createWishlistProductCard(product);
      
      // Insert the new product card at the beginning
      gridLayout.insertAdjacentHTML('afterbegin', productCardHTML);
      
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
   * Create wishlist product card HTML
   * @param {Object} product - Product data
   * @returns {string} HTML string for the product card
   */
  createWishlistProductCard(product) {
    const formatMoney = (cents) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: window.Shopify?.currency?.active || 'USD'
      }).format(cents / 100);
    };

    return `
      <div class="card-product grid file-delete style-wishlist style-3 ${!product.variants[0].available ? 'out-of-stock' : ''}" data-product-id="${product.id}">
        <i class="icon icon-close remove" data-wishlist data-id="${product.id}" data-action="remove"></i>
        <div class="card-product-wrapper">
          <a href="/products/${product.handle}" class="product-img">
            <img class="img-product lazyload"
              data-src="${product.featured_image ? product.featured_image.src : product.images[0].src}"
              src="${product.featured_image ? product.featured_image.src : product.images[0].src}"
              alt="${product.title}">
            ${product.images[1] ? `
              <img class="img-hover lazyload"
                data-src="${product.images[1].src}"
                src="${product.images[1].src}"
                alt="${product.title}">
            ` : ''}
          </a>
          <ul class="list-product-btn">
            <li>
              <a href="javascript:void(0);" 
                 class="box-icon hover-tooltip add-to-cart" 
                 data-variant-id="${product.variants[0].id}"
                 data-quantity="1"
                 aria-label="Add to cart">
                <span class="icon icon-cart2"></span>
                <span class="tooltip">Add to Cart</span>
              </a>
            </li>
            <li>
              <a href="javascript:void(0);" 
                 class="box-icon hover-tooltip quickview" 
                 data-product-handle="${product.handle}"
                 data-product-id="${product.id}"
                 data-bs-toggle="modal" 
                 data-bs-target="#quickView">
                <span class="icon icon-view"></span>
                <span class="tooltip">Quick View</span>
              </a>
            </li>
            <li class="compare">
              <a href="javascript:void(0);" 
                 class="box-icon hover-tooltip tooltip-left" 
                 data-compare 
                 data-id="${product.id}" 
                 data-action="add"
                 aria-label="Add to compare">
                <span class="icon icon-compare"></span>
                <span class="tooltip">Add to Compare</span>
              </a>
            </li>
          </ul>
          ${!product.variants[0].available ? '<div class="sold-out-badge">Sold Out</div>' : ''}
        </div>
        <div class="card-product-info">
          <a href="/products/${product.handle}" class="name-product link fw-medium text-md">${product.title}</a>
          <p class="price-wrap fw-medium">
            <span class="price-new text-primary">${formatMoney(product.variants[0].price * 100)}</span>
            ${product.variants[0].compare_at_price > product.variants[0].price ? 
              `<span class="price-old">${formatMoney(product.variants[0].compare_at_price * 100)}</span>` : ''}
          </p>
          ${product.variants.length > 1 ? `
            <ul class="list-color-product">
              ${product.options.map(option => {
                if (option.name.toLowerCase() === 'color' || option.name.toLowerCase() === 'colour') {
                  return option.values.map(value => {
                    const variant = product.variants.find(v => v.option1 === value);
                    return `
                      <li class="list-color-item color-swatch hover-tooltip tooltip-bot ${value === option.values[0] ? 'active' : ''}"
                          data-variant-id="${variant.id}"
                          data-option-name="${option.name}"
                          data-option-value="${value}">
                        <span class="tooltip color-filter">${value}</span>
                        <span class="swatch-value bg-${value.toLowerCase().replace(/\s+/g, '-')}"></span>
                        ${variant.featured_image ? `
                          <img class="lazyload" 
                            data-src="${variant.featured_image.src}" 
                            src="${variant.featured_image.src}" 
                            alt="${value}"
                            loading="lazy">
                        ` : ''}
                      </li>
                    `;
                  }).join('');
                }
                return '';
              }).join('')}
            </ul>
          ` : ''}
        </div>
      </div>
    `;
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
              gridLayout.innerHTML = `
                <div class="wrapper-wishlist tf-col-2 lg-col-3 xl-col-4">
                  <div class="tf-wishlist-empty text-center">
                    <p class="text-md text-noti">No product were added to the wishlist.</p>
                    <a href="/" class="tf-btn animate-btn btn-back-shop">Back to Shopping</a>
                  </div>
                </div>  
              `;
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
            addToCartButton.innerHTML = `
              <div class="success-feedback">
                <i class="icon icon-check text-success"></i>
              </div>
            `;
            
            setTimeout(() => {
              addToCartButton.innerHTML = `
                <span class="icon icon-cart2"></span>
                <span class="tooltip">Add to Cart</span>
              `;
              addToCartButton.classList.remove('loading');
            }, 1000);
          }
        } catch (error) {
          console.error('Error adding item to cart:', error);
          addToCartButton.classList.remove('loading');
          alert('Failed to add item to cart. Please try again.');
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
      // Simple pagination display
      pagination.innerHTML = `
        <li class="active">
          <div class="pagination-item">1</div>
        </li>
      `;
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
      tooltip.textContent = isActive ? `Remove from ${type}` : `Add to ${type}`;
    }
    
    // Update button text content
    const textElement = button.querySelector('.text');
    if (textElement) {
      if (type === 'compare') {
        textElement.textContent = isActive ? 'Remove from compare' : 'Compare';
      } else if (type === 'wishlist') {
        textElement.textContent = isActive ? 'Remove from wishlist' : 'Add to wishlist';
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
    // Remove previous listeners if any
    if (this._compareDragMouseUp) {
      window.removeEventListener('mouseup', this._compareDragMouseUp);
    }
    compareInner.addEventListener('mousedown', (e) => {
      isDown = true;
      compareInner.classList.add('dragging');
      startX = e.pageX - compareInner.offsetLeft;
      scrollLeft = compareInner.scrollLeft;
    });
    this._compareDragMouseUp = () => {
      isDown = false;
      compareInner.classList.remove('dragging');
    };
    window.addEventListener('mouseup', this._compareDragMouseUp);
    compareInner.addEventListener('mouseleave', () => {
      isDown = false;
      compareInner.classList.remove('dragging');
    });
    compareInner.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - compareInner.offsetLeft;
      const walk = (x - startX) * 1; // slower scroll
      compareInner.scrollLeft = scrollLeft - walk;
    });
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
    const div = document.createElement('div');
    div.className = 'tf-compare-item file-delete';
    div.setAttribute('data-product-id', product.id);
    
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
    
    div.innerHTML = `
      <button type="button" class="icon-close remove" data-compare data-id="${product.id}" data-action="remove" aria-label="Remove from compare"></button>
      <a href="${product.url}" style="aspect-ratio: 4/5;" class="image">
        <img class="lazyload" data-src="${product.image}" src="${product.image}" alt="${product.title}">
      </a>
      <div class="content">
        <div class="text-title text-left">
          <a class="link text-line-clamp-2" href="${product.url}">${product.title}</a>
        </div>
        <p class="price-wrap text-left">
          <span class="new-price text-primary">${formatMoney(product.price)}</span>
          ${product.comparePrice ? `<span class="old-price text-decoration-line-through text-dark-1">${formatMoney(product.comparePrice)}</span>` : ''}
        </p>
      </div>
    `;
    
    // Add event listener for the remove button
    const removeButton = div.querySelector('.remove');
    if (removeButton) {
      removeButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = removeButton.getAttribute('data-id');
        if (productId) {
          this.removeFromCompare(productId);
        }
      });
    }
    
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
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                id: variantId,
                quantity: currentValue - 1
              })
            });
            if (!response.ok) throw new Error('Failed to update quantity');
          } else {
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
              'Content-Type': 'application/json'
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
                'Content-Type': 'application/json'
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
                  'Content-Type': 'application/json'
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
                'Content-Type': 'application/json'
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
              'Content-Type': 'application/json'
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
              'Content-Type': 'application/json'
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
      
      // Update cart state
      this.updateCartState(cartData, id, action);
      
      // Save to local storage
      this.saveCartToStorage(cartData);

      // Show cart drawer if adding item (moved below update to ensure cart content is ready)
      if (action === this.actions.add) {
        // First make sure cart display is updated
        this.updateCartDisplay(cartData);
        // Then show the drawer only if not on cart page
        if (window.location.pathname !== '/cart') {
          this.showCartDrawer();
        }
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
              ${variantOptions.length > 1 ? `
              <div class="info-variant">
                <select class="text-xs" data-variant-id="${item.variant_id}">
                  ${variantOptions.map(option => 
                    `<option value="${option.id}" ${option.selected ? 'selected' : ''}>${option.title}</option>`
                  ).join('')}
                </select>
                <i class="icon-pen edit"></i>
              </div>
              ` : ''}
            </div>
            <p class="price-wrap text-sm fw-medium">
              <span class="new-price text-primary">${formattedPrice}</span>
              ${formattedOriginalPrice ? 
                `<span class="old-price text-decoration-line-through text-dark-1">${formattedOriginalPrice}</span>` : 
                ''}
            </p>
            <div class="wg-quantity small">
              <button class="btn-quantity btn-decrease" data-variant-id="${item.variant_id}">-</button>
              <input class="quantity-product font-4" type="text" name="updates[]" value="${item.quantity}" data-variant-id="${item.variant_id}">
              <button class="btn-quantity btn-increase" data-variant-id="${item.variant_id}">+</button>
            </div>
          </div>
        `;
        
        cartItemsContainer.appendChild(itemElement);
      });

      // Add empty cart placeholder if needed
      if (!cartData.items || cartData.items.length === 0) {
        cartItemsContainer.innerHTML = `
          <div class="empty-cart">
            <p>Your cart is currently empty.</p>
            <a href="/collections" class="tf-btn animate-btn d-inline-flex bg-dark-2">Continue shopping</a>
          </div>
        `;
      }

      // Restore scroll position after items are added
      setTimeout(() => {
        cartItemsContainer.scrollTop = scrollPosition;
      }, 10);
    } else {
      // Show empty cart message if no items
      cartItemsContainer.innerHTML = `
        <div class="empty-cart">
          <p>Your cart is currently empty.</p>
          <a href="/collections" class="tf-btn animate-btn d-inline-flex bg-dark-2">Continue shopping</a>
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
      if (totalPrice >= threshold) {
        thresholdText.innerHTML = window.theme?.settings?.free_shipping_message || 'Congratulations! You\'ve unlocked <span class="fw-medium">Free Shipping</span>';
      } else {
        const progressMessage = window.theme?.settings?.progress_message || 'Spend <span class="fw-medium">[amount]</span> more to get <span class="fw-medium">Free Shipping</span>';
        thresholdText.innerHTML = progressMessage.replace('[amount]', `$${remaining.toFixed(2)}`);
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
        selectElement.innerHTML = variantOptions.map(option => 
          `<option value="${option.id}" ${option.selected ? 'selected' : ''}>${option.title}</option>`
        ).join('');
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
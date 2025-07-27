/**
 * Wishlist Page JavaScript
 * Handles wishlist display, pagination, and interactions
 */

class WishlistPage {
  constructor() {
    this.gridLayout = document.getElementById('gridLayout');
    this.paginationContainer = document.getElementById('paginationContainer');
    this.pagination = document.getElementById('pagination');
    this.productsPerPage = parseInt(this.gridLayout?.dataset.productsPerPage || 12);
    this.currentPage = 1;
    this.allProducts = [];
    
    // Get translations from theme
    this.translations = this.getTranslations();
    
    this.init();
  }

  getTranslations() {
    // Get translations from the theme's translation system
    return {
      loading: window.theme?.translations?.js?.wishlist?.loading_wishlist || 'Loading wishlist...',
      empty: window.theme?.translations?.js?.wishlist?.empty_wishlist || 'No products were added to the wishlist.',
      backToShopping: window.theme?.translations?.js?.wishlist?.back_to_shopping || 'Back to Shopping',
      addToCart: window.theme?.translations?.js?.wishlist?.add_to_cart || 'Add to Cart',
      quickView: window.theme?.translations?.js?.wishlist?.quick_view || 'Quick View',
      addToCompare: window.theme?.translations?.js?.wishlist?.add_to_compare || 'Add to Compare',
      soldOut: window.theme?.translations?.js?.wishlist?.sold_out || 'Sold Out'
    };
  }

  init() {
    if (!this.gridLayout) return;
    
    this.updateWishlistDisplay();
    this.bindEvents();
  }

  bindEvents() {
    // Listen for wishlist updates
    document.addEventListener('wishlist:updated', () => {
      this.updateWishlistDisplay();
    });
  }

  updateWishlistDisplay() {
    // Show global loading state
    this.gridLayout.classList.add('loading');
    this.gridLayout.innerHTML = `
      <div class="wishlist-loading text-center" style="grid-column: 1 / -1; padding: 40px;">
        <i class="icon icon-spinner fa-spin" style="font-size: 24px; color: #666;"></i>
        <p class="text-md" style="margin-top: 10px; color: #666;">${this.translations.loading}</p>
      </div>
    `;
    
    const wishlistIds = localStorage.getItem('theme4:wishlist:id') ? localStorage.getItem('theme4:wishlist:id').split(',') : [];
    
    if (wishlistIds.length === 0) {
      this.showEmptyState();
      return;
    }

    // Add back the tf-grid-layout class when there are items and remove loading state
    this.gridLayout.classList.add('tf-grid-layout');
    this.gridLayout.classList.remove('loading');

    // Clean up the IDs and ensure they're numbers
    const cleanWishlistIds = wishlistIds.map(id => id.trim()).filter(id => id);
    
    // Create a map of product IDs for faster lookup
    const wishlistIdMap = new Set(cleanWishlistIds);
    
    // Fetch all products
    this.fetchAllProducts()
      .then(allFetchedProducts => {
        this.processFetchedProducts(allFetchedProducts, cleanWishlistIds, wishlistIdMap);
      })
      .catch(error => {
        console.error('Error fetching wishlist products:', error);
        this.gridLayout.classList.remove('loading');
        this.gridLayout.innerHTML = '';
        this.paginationContainer.style.display = 'none';
      });
  }

  showEmptyState() {
    this.gridLayout.classList.remove('tf-grid-layout', 'loading');
    this.gridLayout.innerHTML = `
      <div class="wrapper-wishlist tf-col-2 lg-col-3 xl-col-4">
        <div class="tf-wishlist-empty text-center">
          <p class="text-md text-noti">${this.translations.empty}</p>
          <a href="/" class="tf-btn animate-btn btn-back-shop">${this.translations.backToShopping}</a>
        </div>
      </div>  
    `;
    this.paginationContainer.style.display = 'none';
  }

  async fetchAllProducts(page = 1, limit = 250) {
    const response = await fetch(`/products.json?page=${page}&limit=${limit}`);
    const data = await response.json();
    const products = data.products;
    
    if (products.length === limit) {
      // If we got a full page, there might be more
      const nextProducts = await this.fetchAllProducts(page + 1, limit);
      return [...products, ...nextProducts];
    }
    return products;
  }

  processFetchedProducts(allFetchedProducts, cleanWishlistIds, wishlistIdMap) {
    // Filter to only include wishlist products
    const products = allFetchedProducts.filter(product => {
      const productId = product.id.toString();
      return wishlistIdMap.has(productId);
    });
    
    // Find missing product IDs
    const missingIds = cleanWishlistIds.filter(id => !products.some(p => p.id.toString() === id));
    
    if (missingIds.length > 0) {
      // Try to fetch missing products individually
      Promise.all(missingIds.map(id => 
        fetch(`/products.json?ids=${id}`)
          .then(response => response.json())
          .then(data => data.products[0])
      ))
      .then(missingProducts => {
        const allProductsWithMissing = [...products, ...missingProducts.filter(p => p)];
        this.finalizeProducts(allProductsWithMissing, cleanWishlistIds);
      })
      .catch(error => {
        console.error('Error fetching missing products:', error);
        this.finalizeProducts(products, cleanWishlistIds);
      });
    } else {
      this.finalizeProducts(products, cleanWishlistIds);
    }
  }

  finalizeProducts(products, cleanWishlistIds) {
    // Sort products to match the order in wishlistIds
    const sortedProducts = products.sort((a, b) => {
      const aIndex = cleanWishlistIds.indexOf(a.id.toString());
      const bIndex = cleanWishlistIds.indexOf(b.id.toString());
      return aIndex - bIndex;
    });
    
    this.allProducts = sortedProducts;
    this.currentPage = 1;
    this.displayProductsWithPagination();
    this.gridLayout.classList.remove('loading');
  }

  displayProductsWithPagination() {
    if (this.allProducts.length === 0) {
      this.gridLayout.innerHTML = '';
      this.paginationContainer.style.display = 'none';
      return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(this.allProducts.length / this.productsPerPage);
    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    const currentPageProducts = this.allProducts.slice(startIndex, endIndex);
    
    // Display current page products
    this.displayProducts(currentPageProducts);
    
    // Update pagination
    this.updatePagination(totalPages);
  }
  
  updatePagination(totalPages) {
    if (totalPages <= 1) {
      this.paginationContainer.style.display = 'none';
      return;
    }
    
    this.paginationContainer.style.display = 'block';
    
    let paginationHTML = '';
    
    // Previous button
    if (this.currentPage > 1) {
      paginationHTML += `
        <li>
          <a href="#" class="pagination-item" data-page="${this.currentPage - 1}">
            <i class="icon-arr-left"></i>
          </a>
        </li>
      `;
    }
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      if (i === this.currentPage) {
        paginationHTML += `
          <li class="active">
            <div class="pagination-item">${i}</div>
          </li>
        `;
      } else {
        paginationHTML += `
          <li>
            <a href="#" class="pagination-item" data-page="${i}">${i}</a>
          </li>
        `;
      }
    }
    
    // Next button
    if (this.currentPage < totalPages) {
      paginationHTML += `
        <li>
          <a href="#" class="pagination-item" data-page="${this.currentPage + 1}">
            <i class="icon-arr-right2"></i>
          </a>
        </li>
      `;
    }
    
    this.pagination.innerHTML = paginationHTML;
    
    // Add click event listeners to pagination
    this.pagination.querySelectorAll('[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(link.dataset.page);
        if (page !== this.currentPage) {
          this.currentPage = page;
          this.displayProductsWithPagination();
          // Scroll to top of wishlist
          this.gridLayout.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  displayProducts(products) {
    if (products.length === 0) {
      this.gridLayout.innerHTML = '';
      return;
    }
    
    const wishlistHTML = products.map(product => {
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
              <a href="#" 
                 class="box-icon hover-tooltip tooltip-left add-to-cart" 
                 data-variant-id="${product.variants ? product.variants[0].id : product.id}"
                 data-quantity="1"
                 aria-label="${this.translations.addToCart}">
                <span class="icon icon-cart2" aria-hidden="true"></span>
                <span class="tooltip" aria-hidden="true">${this.translations.addToCart}</span>
              </a>
            </li>
            <li>
              <a href="#" 
                 class="box-icon hover-tooltip quickview" 
                 data-product-handle="${product.handle}"
                 data-product-id="${product.id}"
                 data-bs-toggle="modal" 
                 data-bs-target="#quickView">
                <span class="icon icon-view"></span>
                <span class="tooltip">${this.translations.quickView}</span>
              </a>
            </li>
            <li class="compare">
              <a href="#" 
                 class="box-icon hover-tooltip tooltip-left" 
                 data-compare 
                 data-id="${product.id}" 
                 data-action="add"
                 aria-label="${this.translations.addToCompare}">
                <span class="icon icon-compare"></span>
                <span class="tooltip">${this.translations.addToCompare}</span>
              </a>
            </li>
          </ul>
          ${!product.variants[0].available ? `<div class="sold-out-badge">${this.translations.soldOut}</div>` : ''}
            </div>
            <div class="card-product-info">
              <a href="/products/${product.handle}" class="name-product link fw-medium text-md">${product.title}</a>
              <p class="price-wrap fw-medium">
                <span class="price-new text-primary">${this.formatMoney(product.variants[0].price * 100)}</span>
                ${product.variants[0].compare_at_price > product.variants[0].price ? 
                  `<span class="price-old">${this.formatMoney(product.variants[0].compare_at_price * 100)}</span>` : ''}
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
    });

    this.gridLayout.innerHTML = wishlistHTML.join('');
    
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Add click event listeners to remove buttons
    this.attachRemoveButtonListeners();
    
    // Add event listeners for add-to-cart buttons
    this.attachAddToCartListeners();
    
    // Handle quickview clicks
    this.attachQuickviewListeners();
    
    // Initialize lazy loading
    if (typeof LazyLoad !== 'undefined') {
      new LazyLoad();
    }
    
    // Update buttons state if WishlistCompare is available
    if (window.wishlistCompare) {
      window.wishlistCompare.updateButtonsState();
    }

    // Add color variant selection handlers
    this.attachColorVariantListeners();
  }

  attachRemoveButtonListeners() {
    const removeButtons = this.gridLayout.querySelectorAll('[data-wishlist][data-action="remove"]');
    removeButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Prevent multiple clicks while processing
        if (button.classList.contains('loading')) {
          return;
        }
        
        const productId = button.getAttribute('data-id');
        const productCard = button.closest('.card-product');
        
        try {
          // Show loading state
          button.classList.add('loading');
          button.innerHTML = '<i class="icon icon-spinner fa-spin"></i>';
          
          // Add a small delay to prevent rapid clicking
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Remove from localStorage
          const wishlistIds = localStorage.getItem('theme4:wishlist:id') ? localStorage.getItem('theme4:wishlist:id').split(',') : [];
          const updatedIds = wishlistIds.filter(id => id !== productId);
          localStorage.setItem('theme4:wishlist:id', updatedIds.join(','));
          
          // Remove the product from allProducts array
          this.allProducts = this.allProducts.filter(p => p.id.toString() !== productId);
          
          // Remove the product card from UI
          productCard.remove();
          
          // Update wishlist count if available
          if (window.wishlistCompare) {
            window.wishlistCompare.updateWishlistCount();
          }
          
          // Show empty state if no products left
          if (updatedIds.length === 0) {
            this.showEmptyState();
          } else {
            // Recalculate pagination after removing item
            const totalPages = Math.ceil(this.allProducts.length / this.productsPerPage);
            if (this.currentPage > totalPages && totalPages > 0) {
              this.currentPage = totalPages;
            }
            this.displayProductsWithPagination();
            
            // Only dispatch event if there are still products
            document.dispatchEvent(new CustomEvent('wishlist:updated'));
          }
        } catch (error) {
          console.error('Error removing item from wishlist:', error);
          // Restore original button state on error
          button.innerHTML = '<i class="icon icon-close remove"></i>';
        } finally {
          // Remove loading state
          button.classList.remove('loading');
        }
      });
    });
  }

  attachAddToCartListeners() {
    // Clear any existing event listeners on add-to-cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
      // Clone the node to remove all event listeners
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
    });
    
    // Re-attach event listeners for add-to-cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Stop event propagation
        
        // Prevent multiple clicks
        if (button.classList.contains('loading')) {
          return;
        }
        
        const variantId = button.dataset.variantId;
        const quantity = parseInt(button.dataset.quantity || 1);
        
        try {
          // Show loading state
          button.classList.add('loading');
          
          // Add item to cart exactly once
          if (window.cart) {
            await window.cart.updateQuantity(variantId, quantity, 'add');
            
            // Fetch updated cart data
            const response = await fetch('/cart.js');
            const cartData = await response.json();
            
            // Update cart drawer with all items
            this.updateCartDrawer(cartData);
          }
        } catch (error) {
          console.error('Error adding item to cart:', error);
          if (window.cartNotifications) {
            window.cartNotifications.show(error.message || 'Failed to add item to cart. Please try again.', 'error');
          } else {
            alert('Failed to add item to cart. Please try again.');
          }
        } finally {
          // Remove loading state
          button.classList.remove('loading');
        }
      }, { once: false }); // Use once:false but with other protections
    });
  }

  updateCartDrawer(cartData) {
    const cartDrawer = document.getElementById('shoppingCart');
    if (cartDrawer) {
      const itemsContainer = cartDrawer.querySelector('.tf-mini-cart-items');
      if (itemsContainer) {
        // Clear existing items
        itemsContainer.innerHTML = '';
        
        // Add all items from cart
        cartData.items.forEach(item => {
          const itemElement = document.createElement('div');
          itemElement.className = 'tf-mini-cart-item';
          itemElement.style.border = 'none';
          itemElement.style.borderBottom = 'none';
          itemElement.innerHTML = `
            <div class="tf-mini-cart-image">
              <a href="${item.url}">
                <img class="lazyload" data-src="${item.image}" src="${item.image}" alt="${item.title}" loading="lazy">
              </a>
            </div>
            <div class="tf-mini-cart-info">
              <div class="d-flex justify-content-between">
                <a class="title link text-md fw-medium" href="${item.url}">${item.title}</a>
                <i class="icon icon-close remove fs-12" data-variant-id="${item.variant_id}" aria-label="Remove item"></i>
              </div>
              <div class="d-flex gap-10">
                <div class="text-xs">${item.variant_title || ''}</div>
                <a href="#" class="link edit"><i class="icon-pen"></i></a>
              </div>
              <div class="tf-mini-cart-item_price">
                <p class="price-wrap text-sm fw-medium">
                  <span class="new-price text-primary">${this.formatMoney(item.final_price)}</span>
                </p>
              </div>
              <div class="tf-mini-cart-item_quantity">
                <div class="wg-quantity small">
                  <button class="btn-quantity btn-decrease" data-variant-id="${item.variant_id}">-</button>
                  <input type="text" class="quantity-product" value="${item.quantity}" min="0" data-variant-id="${item.variant_id}">
                  <button class="btn-quantity btn-increase" data-variant-id="${item.variant_id}">+</button>
                </div>
              </div>
            </div>
          `;
          itemsContainer.appendChild(itemElement);
        });
        
        this.attachCartItemListeners(itemsContainer);
        
        // Update cart total
        const totalElement = cartDrawer.querySelector('.cart-total-price');
        if (totalElement) {
          totalElement.textContent = this.formatMoney(cartData.total_price);
        }
        
        // Update header cart count
        if (window.cart && typeof window.cart.updateHeaderCartCount === 'function') {
          window.cart.updateHeaderCartCount(cartData.item_count);
        }

        // Update shipping threshold progress bar
        this.updateShippingThreshold(cartDrawer, cartData);
      }
    }
  }

  attachCartItemListeners(itemsContainer) {
    // Add event listeners for quantity buttons
    itemsContainer.querySelectorAll('.btn-decrease').forEach(button => {
      button.addEventListener('click', async () => {
        const variantId = button.dataset.variantId;
        const input = button.nextElementSibling;
        const currentValue = parseInt(input.value);
        if (currentValue > 1) {
          await window.cart.updateQuantity(variantId, currentValue - 1, 'update');
        } else {
          await window.cart.removeItem(variantId);
        }
      });
    });

    itemsContainer.querySelectorAll('.btn-increase').forEach(button => {
      button.addEventListener('click', async () => {
        const variantId = button.dataset.variantId;
        const input = button.previousElementSibling;
        const currentValue = parseInt(input.value);
        await window.cart.updateQuantity(variantId, currentValue + 1, 'update');
      });
    });

    itemsContainer.querySelectorAll('.quantity-product').forEach(input => {
      input.addEventListener('change', async () => {
        const variantId = input.dataset.variantId;
        const newValue = parseInt(input.value);
        if (isNaN(newValue) || newValue < 1) {
          if (newValue <= 0) {
            await window.cart.removeItem(variantId);
          } else {
            input.value = 1;
            await window.cart.updateQuantity(variantId, 1, 'update');
          }
        } else {
          await window.cart.updateQuantity(variantId, newValue, 'update');
        }
      });
    });

    // Add event listeners for remove buttons
    itemsContainer.querySelectorAll('.remove').forEach(button => {
      button.addEventListener('click', async () => {
        const variantId = button.dataset.variantId;
        await window.cart.removeItem(variantId);
      });
    });
  }

  updateShippingThreshold(cartDrawer, cartData) {
    const progressBar = cartDrawer.querySelector('.tf-progress-bar .value');
    if (progressBar) {
      const threshold = window.theme?.settings?.free_shipping_threshold || 10000; // Default to $100 if not set
      const progress = Math.min(100, (cartData.total_price / threshold) * 100);
      progressBar.style.width = `${progress}%`;
      progressBar.setAttribute('data-progress', progress);
    }

    // Update shipping threshold text
    const thresholdText = cartDrawer.querySelector('.tf-mini-cart-threshold .text');
    if (thresholdText) {
      const threshold = window.theme?.settings?.free_shipping_threshold || 10000; // Default to $100 if not set
      const remaining = Math.max(0, threshold - cartData.total_price) / 100;
      if (cartData.total_price >= threshold) {
        thresholdText.innerHTML = window.theme?.settings?.free_shipping_message || 'Congratulations! You\'ve unlocked <span class="fw-medium">Free Shipping</span>';
      } else {
        const progressMessage = window.theme?.settings?.progress_message || 'Spend <span class="fw-medium">[amount]</span> more to get <span class="fw-medium">Free Shipping</span>';
        thresholdText.innerHTML = progressMessage.replace('[amount]', `$${remaining.toFixed(2)}`);
      }
    }
  }

  attachQuickviewListeners() {
    document.querySelectorAll('.quickview').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        const productHandle = button.dataset.productHandle;
        const productId = button.dataset.productId;
        
        try {
          // Fetch product data
          const response = await fetch(`/products/${productHandle}.js`);
          const product = await response.json();
          
          // Update modal with product data
          const modal = document.getElementById('quickView');
          if (modal) {
            this.updateQuickviewModal(modal, product);
          }
        } catch (error) {
          console.error('Error loading product data:', error);
        }
      });
    });
  }

  updateQuickviewModal(modal, product) {
    // Wait for modal to be fully initialized
    setTimeout(() => {
      // Update product title
      const titleElement = modal.querySelector('.product-info-name');
      if (titleElement) titleElement.textContent = product.title;
      
      // Update price
      const priceContainer = modal.querySelector('.product-info-price');
      if (priceContainer) {
        if (product.compare_at_price > product.price) {
          priceContainer.innerHTML = `
            <h6 class="price-new price-on-sale">${this.formatMoney(product.price)}</h6>
            <h6 class="price-old">${this.formatMoney(product.compare_at_price)}</h6>
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
      if (swiperWrapper) {
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
      }

      // Update variant information
      this.updateQuickviewVariants(modal, product);
      
      // Update product ID on buttons
      const addToCartBtn = modal.querySelector('.add-to-cart');
      if (addToCartBtn) {
        addToCartBtn.dataset.productId = product.id;
        addToCartBtn.dataset.variantId = product.variants[0].id;
        
        // Add click handler for add to cart button
        this.attachQuickviewAddToCartListener(addToCartBtn, modal);
      }
      
      const buyNowBtn = modal.querySelector('.buy-now-btn');
      if (buyNowBtn) {
        buyNowBtn.dataset.productId = product.id;
      }
      
      // Initialize swiper
      this.initializeQuickviewSwiper(modal, product);
      
      // Add event listeners for variant selection
      this.attachQuickviewVariantListeners(modal, product);
    }, 100);
  }

  updateQuickviewVariants(modal, product) {
    const variantContainer = modal.querySelector('.tf-product-info-variant');
    if (variantContainer && product.options) {
      let variantHTML = '<div class="tf-product-variant">';
      
      // Process each option (Color, Size, etc.)
      product.options.forEach((option, optionIndex) => {
        const optionName = option.name.toLowerCase();
        const isColor = optionName === 'color' || optionName === 'colour';
        const isSize = optionName === 'size';
        
        if (isColor) {
          variantHTML += `
            <div class="variant-picker-item variant-color">
              <div class="variant-picker-label">
                Color:<span class="variant-picker-label-value value-currentColor">${option.values[0]}</span>
              </div>
              <div class="variant-picker-values">
                ${option.values.map((value, index) => {
                  const variant = product.variants.find(v => v.option1 === value);
                  const colorClass = value.toLowerCase().replace(/\s+/g, '-');
                  return `
                    <div class="hover-tooltip color-btn ${index === 0 ? 'active' : ''}" 
                         data-color="${colorClass}"
                         data-variant-id="${variant.id}"
                         data-option-name="${option.name}"
                         data-option-value="${value}">
                      <span class="check-color bg-${colorClass}"></span>
                      <span class="tooltip">${value}</span>
                      ${variant.featured_image ? `
                        <img class="lazyload" 
                          data-src="${variant.featured_image.src}" 
                          src="${variant.featured_image.src}" 
                          alt="${value}"
                          loading="lazy"
                          style="display: none;">
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        } else if (isSize) {
          variantHTML += `
            <div class="variant-picker-item variant-size">
              <div class="variant-picker-label">
                <div>Size:<span class="variant-picker-label-value value-currentSize">${option.values[0]}</span></div>
              </div>
              <div class="variant-picker-values">
                ${option.values.map((value, index) => `
                  <span class="size-btn ${index === 0 ? 'active' : ''}" 
                        data-size="${value}">${value.charAt(0).toUpperCase()}</span>
                `).join('')}
              </div>
            </div>
          `;
        }
      });
      
      variantHTML += '</div>';
      variantContainer.innerHTML = variantHTML;
    }
  }

  attachQuickviewAddToCartListener(addToCartBtn, modal) {
    addToCartBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (addToCartBtn.classList.contains('loading')) return;
      
      const variantId = addToCartBtn.dataset.variantId;
      const quantityInput = modal.querySelector('.quantity-product');
      const quantity = parseInt(quantityInput ? quantityInput.value : 1);
      
      try {
        addToCartBtn.classList.add('loading');
        if (window.cart) {
          await window.cart.updateQuantity(variantId, quantity, 'add');
          // Rest of the cart update code...
        }
      } catch (error) {
        console.error('Error adding item to cart:', error);
        if (window.cartNotifications) {
          window.cartNotifications.show(error.message || 'Failed to add item to cart. Please try again.', 'error');
        } else {
          alert('Failed to add item to cart. Please try again.');
        }
      } finally {
        addToCartBtn.classList.remove('loading');
      }
    });
  }

  initializeQuickviewSwiper(modal, product) {
    if (window.swiper) {
      window.swiper.destroy();
    }
    const modalSwiper = new Swiper('.tf-single-slide', {
      slidesPerView: 1,
      spaceBetween: 0,
      loop: false,
      navigation: {
        nextEl: '.single-slide-next',
        prevEl: '.single-slide-prev',
      }
    });
    // Store the swiper instance on the modal for later reference
    modal.querySelector('.tf-single-slide').swiper = modalSwiper;

    // Add slideChange event to update color swatch active state
    modalSwiper.on('slideChange', () => {
      this.handleQuickviewSlideChange(modal, product);
    });
  }

  handleQuickviewSlideChange(modal, product) {
    const activeSlide = modal.querySelector('.swiper-slide.swiper-slide-active');
    if (!activeSlide) return;
    
    const mediaId = parseInt(activeSlide.getAttribute('data-media-id'));
    // Find the matching variant by featured_image.id
    let matchingVariant = product.variants.find(v => v.featured_image && v.featured_image.id == mediaId);
    // Fallback: match by image src if not found by id
    if (!matchingVariant) {
      const activeImg = activeSlide.querySelector('img');
      if (activeImg) {
        const activeSrc = activeImg.getAttribute('src');
        matchingVariant = product.variants.find(v => v.featured_image && v.featured_image.src === activeSrc);
      }
    }
    if (matchingVariant) {
      // Find the color option index
      const colorOptionIndex = product.options.findIndex(
        o => o.name.toLowerCase() === 'color' || o.name.toLowerCase() === 'colour'
      );
      if (colorOptionIndex !== -1) {
        const colorOption = product.options[colorOptionIndex];
        const colorValue = matchingVariant[`option${colorOptionIndex + 1}`];
        // Update color swatch active state
        const variantContainer = modal.querySelector('.tf-product-info-variant');
        if (variantContainer) {
          variantContainer.querySelectorAll(`[data-option-name="${colorOption.name}"]`).forEach(btn => {
            if (
              btn.dataset.optionValue &&
              btn.dataset.optionValue.toLowerCase().trim() === String(colorValue).toLowerCase().trim()
            ) {
              btn.classList.add('active');
              const label = variantContainer.querySelector('.value-currentColor');
              if (label) label.textContent = colorValue;
            } else {
              btn.classList.remove('active');
            }
          });
        }
      }
    }
  }

  attachQuickviewVariantListeners(modal, product) {
    // Add event listeners for size buttons
    modal.querySelectorAll('.size-btn').forEach(sizeBtn => {
      sizeBtn.addEventListener('click', () => {
        const sizeValue = sizeBtn.dataset.size;
        
        // Update active state
        sizeBtn.closest('.variant-picker-values').querySelectorAll('.size-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        sizeBtn.classList.add('active');
        
        // Update selected size text
        const selectedSize = modal.querySelector('.value-currentSize');
        if (selectedSize) {
          selectedSize.textContent = sizeValue.charAt(0).toUpperCase() + sizeValue.slice(1);
        }
        
        // Get current color selection
        const activeColorBtn = modal.querySelector('.color-btn.active');
        const selectedColor = activeColorBtn ? activeColorBtn.dataset.optionValue : null;                
        // Find the correct variant based on both color and size
        const variant = product.variants.find(v => {
          const matchesColor = !selectedColor || v.option1 === selectedColor;
          const matchesSize = v.option2 === sizeValue;

          return matchesColor && matchesSize;
        });
        
        // Update add to cart button with the correct variant ID
        const addToCartBtn = modal.querySelector('.add-to-cart');
        if (addToCartBtn && variant) {
          addToCartBtn.dataset.variantId = variant.id;
        }
      });
    });

    // Add event listeners for color buttons
    modal.querySelectorAll('.color-btn').forEach(colorBtn => {
      colorBtn.addEventListener('click', () => {
        const optionValue = colorBtn.dataset.optionValue;
        const colorClass = colorBtn.dataset.color;
        
        // Update active state
        colorBtn.closest('.variant-picker-values').querySelectorAll('.color-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        colorBtn.classList.add('active');
        
        // Update selected color text
        const selectedColor = modal.querySelector('.value-currentColor');
        if (selectedColor) {
          selectedColor.textContent = optionValue;
        }
        
        // Get current size selection
        const activeSizeBtn = modal.querySelector('.size-btn.active');
        const selectedSize = activeSizeBtn ? activeSizeBtn.dataset.size : null;
        
        // Find the correct variant based on both color and size
        const variant = product.variants.find(v => {
          const matchesColor = v.option1 === optionValue;
          const matchesSize = !selectedSize || v.option2 === selectedSize;
          return matchesColor && matchesSize;
        });
        
        // Update add to cart button with the correct variant ID
        const addToCartBtn = modal.querySelector('.add-to-cart');
        if (addToCartBtn && variant) {
          addToCartBtn.dataset.variantId = variant.id;
        }
        
        // Update main image if variant has an image
        if (variant && variant.featured_image) {
          // Find the Swiper instance
          const swiperInstance = modal.querySelector('.tf-single-slide')?.swiper;
          const slides = modal.querySelectorAll('.swiper-slide');
          let targetIndex = -1;
          slides.forEach((slide, idx) => {
            if (slide.dataset.mediaId == variant.featured_image.id) {
              targetIndex = idx;
            }
          });
          if (swiperInstance && targetIndex !== -1) {
            swiperInstance.slideTo(targetIndex, 300);
          } else if (slides.length > 0) {
            // Fallback: update all images in all slides
            slides.forEach((slide, idx) => {
              const img = slide.querySelector('img');
              if (img) {
                img.src = variant.featured_image.src;
                img.setAttribute('data-src', variant.featured_image.src);
              }
            });
          } else {
            // Fallback: update the first image as before
            const mainImage = modal.querySelector('.swiper-slide img');
            if (mainImage) {
              mainImage.src = variant.featured_image.src;
              mainImage.setAttribute('data-src', variant.featured_image.src);
            }
          }
        }
      });
    });

    // Update initial variant selection
    const initialColorBtn = modal.querySelector('.color-btn.active');
    const initialSizeBtn = modal.querySelector('.size-btn.active');
    
    if (initialColorBtn && initialSizeBtn) {
      const selectedColor = initialColorBtn.dataset.optionValue;
      const selectedSize = initialSizeBtn.dataset.size;
      
      const initialVariant = product.variants.find(v => 
        v.option1 === selectedColor && v.option2 === selectedSize
      );
      
      if (initialVariant) {
        const addToCartBtn = modal.querySelector('.add-to-cart');
        if (addToCartBtn) {
          addToCartBtn.dataset.variantId = initialVariant.id;
        }
      }
    }

    // Event delegation for quantity buttons
    const quantityContainer = modal.querySelector('.tf-product-total-quantity');
    if (quantityContainer && !quantityContainer._quantityDelegationAttached) {
      quantityContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('plus-btn')) {
          e.preventDefault();
          e.stopPropagation();
          const quantityInput = modal.querySelector('.quantity-product');
          let value = parseInt(quantityInput.value) || 1;
          value++;
          quantityInput.value = value;
          // Update add-to-cart button data-quantity
          const addToCartBtn = modal.querySelector('.add-to-cart');
          if (addToCartBtn) {
            addToCartBtn.dataset.quantity = value;
          }
          quantityInput.dispatchEvent(new Event('change'));
        } else if (e.target.classList.contains('minus-btn')) {
          e.preventDefault();
          e.stopPropagation();
          const quantityInput = modal.querySelector('.quantity-product');
          let value = parseInt(quantityInput.value) || 1;
          if (value > 1) value--;
          quantityInput.value = value;
          // Update add-to-cart button data-quantity
          const addToCartBtn = modal.querySelector('.add-to-cart');
          if (addToCartBtn) {
            addToCartBtn.dataset.quantity = value;
          }
          quantityInput.dispatchEvent(new Event('change'));
        }
      }, true);
      quantityContainer._quantityDelegationAttached = true;
    }

    // Also handle direct input changes
    const quantityInput = modal.querySelector('.quantity-product');
    if (quantityInput) {
      quantityInput.addEventListener('change', () => {
        const value = parseInt(quantityInput.value) || 1;
        const addToCartBtn = modal.querySelector('.add-to-cart');
        if (addToCartBtn) {
          addToCartBtn.dataset.quantity = value;
        }
      });
    }
  }

  attachColorVariantListeners() {
    document.querySelectorAll('.list-color-item').forEach(button => {
      button.addEventListener('click', () => {
        const variantId = button.dataset.variantId;
        const productCard = button.closest('.card-product');
        const productId = productCard.dataset.productId;
        
        // Update active state
        productCard.querySelectorAll('.list-color-item').forEach(item => {
          item.classList.remove('active');
        });
        button.classList.add('active');
        
        // Find the product and variant from the allProducts array
        const product = this.allProducts.find(p => p.id.toString() === productId);
        if (product) {
          const variant = product.variants.find(v => v.id.toString() === variantId);
          if (variant) {
            // Update compare button with current variant data
            const compareBtn = productCard.querySelector('[data-compare]');
            if (compareBtn) {
              compareBtn.dataset.variantId = variantId;
              compareBtn.dataset.variantImage = variant.featured_image ? variant.featured_image.src : product.featured_image.src;
              compareBtn.dataset.variantTitle = variant.title;
            }
          }
        }
      });
    });
  }

  formatMoney(cents) {
    if (window.Shopify && Shopify.formatMoney) {
      return Shopify.formatMoney(cents, window.theme && window.theme.moneyFormat ? window.theme.moneyFormat : "${{amount}}");
    } else {
      return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
  }
}

// Initialize wishlist page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  new WishlistPage();
}); 
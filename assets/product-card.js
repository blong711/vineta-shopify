// Product Card Module
const ProductCard = {
  // Helper function to format money
  formatMoney(cents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: window.Shopify.currency.active
    }).format(cents / 100);
  },

  // Update image attributes
  updateImage(img, url) {
    if (!img) return;
    img.src = url;
    img.setAttribute('src', url);
    if (img.hasAttribute('srcset')) img.setAttribute('srcset', url);
    if (img.hasAttribute('data-src')) img.setAttribute('data-src', url);
    if (img.hasAttribute('data-srcset')) img.setAttribute('data-srcset', url);
    img.classList.remove('lazyload');
  },

  // Initialize variant image switching
  initializeVariantImageSwitching() {
    document.querySelectorAll('.card-product').forEach(card => {
      const mainImage = card.querySelector('.img-product');
      const hoverImage = card.querySelector('.img-hover');
      const swatches = card.querySelectorAll('.color-swatch');
      
      swatches.forEach(swatch => {
        const variantImageUrl = swatch.dataset.variantImage || 
          (swatch.querySelector('img')?.getAttribute('src'));

        if (variantImageUrl) {
          swatch.dataset.variantImage = variantImageUrl;
        }

        swatch.addEventListener('mouseenter', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          swatches.forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');
          
          if (swatch.dataset.variantImage) {
            this.updateImage(mainImage, swatch.dataset.variantImage);
            this.updateImage(hoverImage, swatch.dataset.variantImage);
          }

          const variantId = swatch.dataset.variantId || swatch.getAttribute('data-variant-id');
          if (variantId) {
            card.querySelectorAll('.add-to-cart').forEach(btn => {
              btn.setAttribute('data-variant-id', variantId);
            });
          }
        });
      });
    });
  },

  // Update cart drawer content
  async updateCartDrawer(cartData) {
    const cartDrawer = document.getElementById('shoppingCart');
    if (!cartDrawer) return;

    const itemsContainer = cartDrawer.querySelector('.tf-mini-cart-items');
    if (!itemsContainer) return;

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

    // Update cart total
    const totalElement = cartDrawer.querySelector('.cart-total-price');
    if (totalElement) {
      totalElement.textContent = this.formatMoney(cartData.total_price);
    }
    
    // Update header cart count
    const headerCount = document.querySelector('.count-box');
    if (headerCount) {
      headerCount.textContent = cartData.item_count;
    }

    // Update shipping threshold
    this.updateShippingThreshold(cartDrawer, cartData.total_price);
  },

  // Update shipping threshold UI
  updateShippingThreshold(cartDrawer, totalPrice) {
    const threshold = 100 * 100; // $100 in cents
    const progress = Math.min(100, (totalPrice / threshold) * 100);
    const remaining = Math.max(0, threshold - totalPrice) / 100;

    const progressBar = cartDrawer.querySelector('.tf-progress-bar .value');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      progressBar.setAttribute('data-progress', progress);
    }

    const thresholdText = cartDrawer.querySelector('.tf-mini-cart-threshold .text');
    if (thresholdText) {
      if (totalPrice >= threshold) {
        thresholdText.innerHTML = 'Congratulations! You\'ve unlocked <span class="fw-medium">Free Shipping</span>';
      } else {
        thresholdText.innerHTML = `Spend <span class="fw-medium">$${remaining.toFixed(2)}</span> more to get <span class="fw-medium">Free Shipping</span>`;
      }
    }
  },

  // Initialize cart event listeners
  initializeCartEvents() {
    document.querySelectorAll('.add-to-cart').forEach(button => {
      // Remove existing listeners
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);

      // Add new listener
      newButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (newButton.classList.contains('loading')) return;
        
        const variantId = newButton.dataset.variantId;
        const quantity = parseInt(newButton.dataset.quantity || 1);
        
        try {
          newButton.classList.add('loading');
          
          if (window.cart) {
            await window.cart.updateQuantity(variantId, quantity, 'add');
            const response = await fetch('/cart.js');
            const cartData = await response.json();
            await this.updateCartDrawer(cartData);
          }
        } catch (error) {
          console.error('Error adding item to cart:', error);
          alert('Failed to add item to cart. Please try again.');
        } finally {
          newButton.classList.remove('loading');
        }
      });
    });
  },

  // Initialize quantity controls
  initializeQuantityControls() {
    document.querySelectorAll('.tf-mini-cart-items').forEach(container => {
      // Decrease button
      container.querySelectorAll('.btn-decrease').forEach(button => {
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

      // Increase button
      container.querySelectorAll('.btn-increase').forEach(button => {
        button.addEventListener('click', async () => {
          const variantId = button.dataset.variantId;
          const input = button.previousElementSibling;
          const currentValue = parseInt(input.value);
          await window.cart.updateQuantity(variantId, currentValue + 1, 'update');
        });
      });

      // Quantity input
      container.querySelectorAll('.quantity-product').forEach(input => {
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

      // Remove button
      container.querySelectorAll('.remove').forEach(button => {
        button.addEventListener('click', async () => {
          const variantId = button.dataset.variantId;
          await window.cart.removeItem(variantId);
        });
      });
    });
  },

  // Initialize all product card functionality
  init() {
    // Add countdown hover styles
    const style = document.createElement('style');
    style.textContent = `
      .card-product:hover .countdown-box {
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      .countdown-box {
        opacity: 1;
        visibility: visible;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
    `;
    document.head.appendChild(style);

    // Initialize all features
    this.initializeVariantImageSwitching();
    this.initializeCartEvents();
    this.initializeQuantityControls();

    // Initialize wishlist and compare buttons state
    if (window.wishlistCompare) {
      window.wishlistCompare.updateButtonsState();
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => ProductCard.init()); 
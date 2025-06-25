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
    for (const item of cartData.items) {
      // Fetch product data to get all variants
      const productResponse = await fetch(`/products/${item.handle}.js`);
      const productData = await productResponse.json();
      
      const itemElement = document.createElement('div');
      itemElement.className = 'tf-mini-cart-item';
      itemElement.style.border = 'none';
      itemElement.style.borderBottom = 'none';
      
      // Get all variants for this product
      const variantOptions = productData.variants.map(variant => {
        const options = variant.options.join(' / ');
        return {
          id: variant.id,
          title: options,
          selected: variant.id === item.variant_id
        };
      });

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
    }

    // Update cart total
    const totalElement = cartDrawer.querySelector('.cart-total-price');
    if (totalElement) {
      totalElement.textContent = this.formatMoney(cartData.total_price);
    }
    
    // Update header cart count
    document.querySelectorAll('.cart-count').forEach(element => {
      element.textContent = cartData.item_count || '0';
    });

    // Update shipping threshold
    this.updateShippingThreshold(cartDrawer, cartData.total_price);

    // Re-initialize quantity controls after DOM update
    this.initializeQuantityControls();
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
        thresholdText.innerHTML = window.theme?.settings?.free_shipping_message || 'Congratulations! You\'ve unlocked <span class="fw-medium">Free Shipping</span>';
      } else {
        const progressMessage = window.theme?.settings?.progress_message || 'Spend <span class="fw-medium">[amount]</span> more to get <span class="fw-medium">Free Shipping</span>';
        thresholdText.innerHTML = progressMessage.replace('[amount]', `$${remaining.toFixed(2)}`);
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
          try {
            const variantId = button.dataset.variantId;
            if (!variantId) {
              console.error('No variant ID found on decrease button');
              return;
            }
            
            const input = button.nextElementSibling;
            if (!input || !input.classList.contains('quantity-product')) {
              console.error('Quantity input not found next to decrease button');
              return;
            }
            
            const currentValue = parseInt(input.value);
            if (isNaN(currentValue)) {
              console.error('Invalid quantity value:', input.value);
              return;
            }
            
            console.log('Decreasing quantity for variant:', variantId, 'from', currentValue, 'to', currentValue - 1);
            
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
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error('Cart change response not ok:', response.status, errorText);
                throw new Error(`Failed to update quantity: ${response.status} ${errorText}`);
              }
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
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error('Cart remove response not ok:', response.status, errorText);
                throw new Error(`Failed to remove item: ${response.status} ${errorText}`);
              }
            }

            // Fetch updated cart data and update UI
            const cartResponse = await fetch('/cart.js');
            if (!cartResponse.ok) throw new Error('Failed to fetch cart data');
            const cartData = await cartResponse.json();
            await this.updateCartDrawer(cartData);
          } catch (error) {
            console.error('Error updating cart:', error);
            alert('Failed to update cart. Please try again.');
          }
        });
      });

      // Increase button
      container.querySelectorAll('.btn-increase').forEach(button => {
        button.addEventListener('click', async () => {
          try {
            const variantId = button.dataset.variantId;
            if (!variantId) {
              console.error('No variant ID found on increase button');
              return;
            }
            
            const input = button.previousElementSibling;
            if (!input || !input.classList.contains('quantity-product')) {
              console.error('Quantity input not found next to increase button');
              return;
            }
            
            const currentValue = parseInt(input.value);
            if (isNaN(currentValue)) {
              console.error('Invalid quantity value:', input.value);
              return;
            }
            
            console.log('Increasing quantity for variant:', variantId, 'from', currentValue, 'to', currentValue + 1);
            
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
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('Cart change response not ok:', response.status, errorText);
              throw new Error(`Failed to update quantity: ${response.status} ${errorText}`);
            }

            // Fetch updated cart data and update UI
            const cartResponse = await fetch('/cart.js');
            if (!cartResponse.ok) throw new Error('Failed to fetch cart data');
            const cartData = await cartResponse.json();
            await this.updateCartDrawer(cartData);
          } catch (error) {
            console.error('Error updating cart:', error);
            alert('Failed to update cart. Please try again.');
          }
        });
      });

      // Quantity input
      container.querySelectorAll('.quantity-product').forEach(input => {
        input.addEventListener('change', async () => {
          try {
            const variantId = input.dataset.variantId;
            if (!variantId) {
              console.error('No variant ID found on quantity input');
              return;
            }
            
            const newValue = parseInt(input.value);
            console.log('Changing quantity for variant:', variantId, 'to', newValue);
            
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
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('Cart remove response not ok:', response.status, errorText);
                  throw new Error(`Failed to remove item: ${response.status} ${errorText}`);
                }
              } else {
                input.value = 1;
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
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('Cart change response not ok:', response.status, errorText);
                  throw new Error(`Failed to update quantity: ${response.status} ${errorText}`);
                }
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
              if (!response.ok) {
                const errorText = await response.text();
                console.error('Cart change response not ok:', response.status, errorText);
                throw new Error(`Failed to update quantity: ${response.status} ${errorText}`);
              }
            }

            // Fetch updated cart data and update UI
            const cartResponse = await fetch('/cart.js');
            if (!cartResponse.ok) throw new Error('Failed to fetch cart data');
            const cartData = await cartResponse.json();
            await this.updateCartDrawer(cartData);
          } catch (error) {
            console.error('Error updating cart:', error);
            alert('Failed to update cart. Please try again.');
          }
        });
      });

      // Remove button
      container.querySelectorAll('.remove').forEach(button => {
        button.addEventListener('click', async () => {
          try {
            const variantId = button.dataset.variantId;
            if (!variantId) {
              console.error('No variant ID found on remove button');
              return;
            }
            
            console.log('Removing variant from cart:', variantId);
            
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
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('Cart remove response not ok:', response.status, errorText);
              throw new Error(`Failed to remove item: ${response.status} ${errorText}`);
            }

            // Fetch updated cart data and update UI
            const cartResponse = await fetch('/cart.js');
            if (!cartResponse.ok) throw new Error('Failed to fetch cart data');
            const cartData = await cartResponse.json();
            await this.updateCartDrawer(cartData);
          } catch (error) {
            console.error('Error updating cart:', error);
            alert('Failed to update cart. Please try again.');
          }
        });
      });
    });
  },

  // Initialize variant selection
  initializeVariantSelection() {
    document.querySelectorAll('.card-product').forEach(card => {
      const variantSelect = card.querySelector('select[data-variant-id]');
      if (variantSelect) {
        variantSelect.addEventListener('change', async (e) => {
          try {
            const oldVariantId = variantSelect.dataset.variantId;
            const newVariantId = e.target.value;
            
            // Update the data-variant-id attribute on the select
            variantSelect.dataset.variantId = newVariantId;
            
            // Update all elements with data-variant-id in this card
            card.querySelectorAll('[data-variant-id]').forEach(el => {
              el.dataset.variantId = newVariantId;
            });

            // Update add to cart button
            const addToCartBtn = card.querySelector('.add-to-cart');
            if (addToCartBtn) {
              addToCartBtn.dataset.variantId = newVariantId;
            }

            // Update wishlist button if it exists
            const wishlistBtn = card.querySelector('[data-wishlist]');
            if (wishlistBtn) {
              wishlistBtn.dataset.id = newVariantId;
            }

            // Update compare button if it exists
            const compareBtn = card.querySelector('[data-compare]');
            if (compareBtn) {
              compareBtn.dataset.id = newVariantId;
            }

            // Update color swatch if it exists
            const colorSwatch = card.querySelector(`.color-swatch[data-variant-id="${newVariantId}"]`);
            if (colorSwatch) {
              card.querySelectorAll('.color-swatch').forEach(swatch => {
                swatch.classList.remove('active');
              });
              colorSwatch.classList.add('active');
            }

            // Update product image if variant has an image
            const variantImage = colorSwatch?.querySelector('img')?.getAttribute('data-src');
            if (variantImage) {
              const mainImage = card.querySelector('.img-product');
              const hoverImage = card.querySelector('.img-hover');
              if (mainImage) mainImage.src = variantImage;
              if (hoverImage) hoverImage.src = variantImage;
            }
          } catch (error) {
            console.error('Error changing variant:', error);
            // Revert the select to the old value
            e.target.value = oldVariantId;
          }
        });
      }
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
      .tf-mini-cart-item .tf-mini-cart-info .info-variant select {
        appearance: none !important;
        background: transparent !important;
        border: 0 !important;
        padding-left: 5px !important;
        margin-left: -5px !important;
        padding-right: 20px !important;
        cursor: pointer !important;
        z-index: 1 !important;
      }
      .tf-mini-cart-item .tf-mini-cart-info .info-variant {
        display: flex;
        gap: 10px;
        position: relative;
        width: max-content;
      }
      .tf-mini-cart-item .tf-mini-cart-info .info-variant select option {
        padding: 5px;
      }
      .tf-mini-cart-item .tf-mini-cart-info .info-variant .edit {
        position: absolute;
        right: 0;
        top: 0;
        display: flex;
        font-size: 10px;
        line-height: 10px;
        -webkit-transition: all 0.3s ease-in-out;
        -moz-transition: all 0.3s ease-in-out;
        -ms-transition: all 0.3s ease-in-out;
        -o-transition: all 0.3s ease-in-out;
        transition: all 0.3s ease-in-out;
      }
    `;
    document.head.appendChild(style);

    // Initialize cart count
    this.initializeCartCount();

    // Initialize all features
    this.initializeVariantImageSwitching();
    this.initializeCartEvents();
    this.initializeQuantityControls();
    this.initializeVariantSelection();

    // Initialize wishlist and compare buttons state
    if (window.wishlistCompare) {
      window.wishlistCompare.updateButtonsState();
    }
  },

  // Initialize cart count
  async initializeCartCount() {
    try {
      const response = await fetch('/cart.js');
      if (!response.ok) throw new Error('Failed to fetch cart data');
      const cartData = await response.json();
      
      // Update all cart count elements
      document.querySelectorAll('.cart-count').forEach(element => {
        element.textContent = cartData.item_count || '0';
      });
    } catch (error) {
      console.error('Error initializing cart count:', error);
      // Set count to 0 if there's an error
      document.querySelectorAll('.cart-count').forEach(element => {
        element.textContent = '0';
      });
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => ProductCard.init());

document.addEventListener('DOMContentLoaded', function() {
  // Handle add to cart buttons
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  
  addToCartButtons.forEach(button => {
    button.addEventListener('click', async function(e) {
      e.preventDefault();
      
      const variantId = this.dataset.variantId;
      const quantity = this.dataset.quantity || 1;
      
      try {
        // Add item to cart
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: [{
              id: variantId,
              quantity: parseInt(quantity)
            }]
          })
        });

        if (!response.ok) throw new Error('Network response was not ok');
        
        // Fetch the updated cart to get the correct item count
        const cartRes = await fetch('/cart.js');
        const cartData = await cartRes.json();
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(element => {
          element.textContent = cartData.item_count;
        });

        // Optional: Show success message
        // You can add your own success notification here
        
      } catch (error) {
        console.error('Error adding item to cart:', error);
        // Optional: Show error message
        // You can add your own error notification here
      }
    });
  });

  // Handle wishlist buttons
  const wishlistButtons = document.querySelectorAll('[data-wishlist]');
  wishlistButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      // Add your wishlist functionality here
    });
  });

  // Handle compare buttons
  const compareButtons = document.querySelectorAll('[data-compare]');
  compareButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      // Add your compare functionality here
    });
  });

  // Handle quickview buttons
  const quickviewButtons = document.querySelectorAll('.quickview');
  quickviewButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      // Add your quickview functionality here
    });
  });

  // Handle color swatches
  const colorSwatches = document.querySelectorAll('.color-swatch');
  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', function() {
      const variantId = this.dataset.variantId;
      const variantImage = this.dataset.variantImage;
      
      // Update active state
      this.closest('.list-color-product').querySelectorAll('.color-swatch').forEach(s => {
        s.classList.remove('active');
      });
      this.classList.add('active');
      
      // Update variant ID on add to cart buttons
      const addToCartButtons = this.closest('.card-product').querySelectorAll('.add-to-cart');
      addToCartButtons.forEach(button => {
        button.dataset.variantId = variantId;
      });
      
      // Update product image if variant image exists
      if (variantImage) {
        const productImg = this.closest('.card-product').querySelector('.img-product');
        if (productImg) {
          productImg.src = variantImage;
        }
      }
    });
  });

  document.querySelectorAll('.nav-cart .nav-icon-item').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      if (typeof window.openCartDrawer === 'function') {
        window.openCartDrawer();
      }
    });
  });
});

// --- Cart Drawer Event Listeners ---
(function() {
  // Set up event listeners after DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    const cartDrawer = document.getElementById('shoppingCart');
    if (!cartDrawer) return;

    // Close on ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && cartDrawer.classList.contains('show')) {
        if (typeof window.closeCartDrawer === 'function') {
          window.closeCartDrawer();
        }
      }
    });

    // Cart drawer close button
    const closeBtn = cartDrawer.querySelector('.icon-close-popup');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (typeof window.closeCartDrawer === 'function') {
          window.closeCartDrawer();
        }
      });
    }

    // --- Tool Panel Toggle ---
    document.addEventListener('click', function(e) {
      // Open tool panel
      if (e.target.closest('.tf-mini-cart-tool-btn')) {
        const btn = e.target.closest('.tf-mini-cart-tool-btn');
        const target = btn.classList[1].replace('btn-', '');
        document.querySelectorAll('.tf-mini-cart-tool-openable').forEach(panel => {
          if (panel.classList.contains(target)) panel.classList.add('active');
        });
      }
      // Close tool panel
      if (e.target.closest('.tf-mini-cart-tool-close')) {
        document.querySelectorAll('.tf-mini-cart-tool-openable').forEach(panel => {
          panel.classList.remove('active');
        });
      }
    });

    // --- Terms Checkbox & Checkout Button ---
    const termsCheckbox = document.getElementById('CartDrawer-Form_agree');
    const checkoutButton = document.getElementById('checkout-button');
    if (termsCheckbox && checkoutButton) {
      termsCheckbox.addEventListener('change', function() {
        if (this.checked) {
          checkoutButton.disabled = false;
          checkoutButton.classList.remove('disabled');
          checkoutButton.onclick = function() {
            window.location.href = '/checkout';
          };
        } else {
          checkoutButton.disabled = true;
          checkoutButton.classList.add('disabled');
          checkoutButton.onclick = null;
        }
      });
    }
  });
})(); 
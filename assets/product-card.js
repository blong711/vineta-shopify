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

  // Check if we're on the cart page
  isCartPage() {
    return window.location.pathname === '/cart';
  },

  // Add product row to cart table (similar to gift wrap functionality)
  addProductToCartTable(cartData, addedItem) {
    if (!this.isCartPage()) return;

    const cartTableBody = document.querySelector('.table-page-cart tbody');
    if (!cartTableBody) return;

    // Check if item already exists in table
    const existingRow = cartTableBody.querySelector(`[data-variant-id="${addedItem.variant_id}"]`);
    if (existingRow) {
      // Update quantity of existing row
      const quantityInput = existingRow.querySelector('.quantity-product');
      if (quantityInput) {
        const currentQuantity = parseInt(quantityInput.value) || 0;
        const newQuantity = currentQuantity + 1;
        quantityInput.value = newQuantity;
        
        // Update the item's total price
        const itemTotal = existingRow.querySelector('.cart-total');
        if (itemTotal) {
          const linePrice = (addedItem.final_price * newQuantity);
          itemTotal.textContent = this.formatMoney(linePrice);
        }
      }
      return;
    }

    // Create new row for the added item
    const newRow = document.createElement('tr');
    newRow.className = 'tf-cart-item';
    newRow.setAttribute('data-item-id', addedItem.key);
    newRow.setAttribute('data-variant-id', addedItem.variant_id);
    
    newRow.innerHTML = `
      <td class="tf-cart-item_product">
        <a href="${addedItem.url}" class="img-box">
          <img src="${addedItem.image}" alt="${addedItem.title}" width="150" height="150">
        </a>
        <div class="cart-info">
          <a href="${addedItem.url}" class="name text-md link fw-medium">${addedItem.product_title}</a>
          ${addedItem.variant_title ? `<div class="variants">${addedItem.variant_title}</div>` : ''}
          <div></div>
          <span class="remove-cart link remove" data-item-id="${addedItem.key}" data-variant-id="${addedItem.variant_id}">Remove</span>
        </div>
      </td>
      <td class="tf-cart-item_price text-center" data-cart-title="Price">
        <span class="cart-price price-on-sale text-md fw-medium">${this.formatMoney(addedItem.final_price)}</span>
      </td>
      <td class="tf-cart-item_quantity" data-cart-title="Quantity">
        <div class="wg-quantity">
          <button type="button" class="btn-quantity minus" data-variant-id="${addedItem.variant_id}" data-item-id="${addedItem.key}">-</button>
          <input class="quantity-product" type="text" name="updates[]" value="${addedItem.quantity || 1}" min="0" data-variant-id="${addedItem.variant_id}" data-item-id="${addedItem.key}">
          <button type="button" class="btn-quantity plus" data-variant-id="${addedItem.variant_id}" data-item-id="${addedItem.key}">+</button>
        </div>
      </td>
      <td class="tf-cart-item_total text-center" data-cart-title="Total">
        <div class="cart-total total-price text-md fw-medium">${this.formatMoney(addedItem.final_line_price)}</div>
      </td>
    `;
    
    // Add the new row to the table
    cartTableBody.appendChild(newRow);
    
    // Re-bind event listeners for the new item
    this.bindCartItemEventListeners(newRow);
  },

  // Bind event listeners for cart item row
  bindCartItemEventListeners(itemRow) {
    // Remove button
    const removeButton = itemRow.querySelector('.remove-cart');
    if (removeButton) {
      removeButton.addEventListener('click', async function(e) {
        e.preventDefault();
        const variantId = this.dataset.variantId;
        if (!variantId) return;

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

          // Remove the item row from the table
          const itemRow = this.closest('.tf-cart-item');
          if (itemRow) {
            itemRow.remove();
          }

          // Fetch updated cart data
          const cartResponse = await fetch('/cart.js');
          if (!cartResponse.ok) throw new Error('Failed to fetch cart data');
          const cartData = await cartResponse.json();

          // Update cart total and count
          const cartTotal = document.querySelector('.total');
          if (cartTotal) {
            cartTotal.textContent = ProductCard.formatMoney(cartData.total_price);
          }
          // document.querySelectorAll('.cart-count').forEach(element => {
          //   element.textContent = cartData.item_count || '0';
          // });

          // Update shipping progress only if cart still has items
          if (cartData.item_count > 0 && typeof updateShippingProgress === 'function') {
            updateShippingProgress();
          }

          // Check if cart is now empty
          if (cartData.item_count === 0) {
            if (typeof handleEmptyCart === 'function') {
              handleEmptyCart();
            }
          }
        } catch (error) {
          console.error('Error removing item:', error);
          alert('Failed to remove item. Please try again.');
        }
      });
    }

    // Quantity buttons
    const quantityButtons = itemRow.querySelectorAll('.btn-quantity');
    quantityButtons.forEach(button => {
      button.addEventListener('click', async function() {
        const variantId = this.dataset.variantId;
        const input = this.parentElement.querySelector('.quantity-product');
        const currentValue = parseInt(input.value);
        
        if (!variantId) return;

        try {
          let newQuantity;
          if (this.classList.contains('minus')) {
            newQuantity = currentValue > 1 ? currentValue - 1 : 0;
          } else if (this.classList.contains('plus')) {
            newQuantity = currentValue + 1;
          }

          // Update input value immediately
          input.value = newQuantity;

          // Update cart via API
          const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: variantId,
              quantity: newQuantity
            })
          });

          if (!response.ok) {
            // Revert input value if API call fails
            input.value = currentValue;
            throw new Error('Failed to update quantity');
          }

          const cartData = await response.json();

          // Update the item's total price
          const itemRow = this.closest('.tf-cart-item');
          if (itemRow) {
            const itemTotal = itemRow.querySelector('.cart-total');
            if (itemTotal) {
              const updatedItem = cartData.items.find(item => item.variant_id == variantId);
              if (updatedItem) {
                itemTotal.textContent = ProductCard.formatMoney(updatedItem.final_line_price);
              }
            }
          }

          // Update cart total
          const cartTotal = document.querySelector('.total');
          if (cartTotal) {
            cartTotal.textContent = ProductCard.formatMoney(cartData.total_price);
          }

          // Update cart count
          document.querySelectorAll('.cart-count').forEach(element => {
            element.textContent = cartData.item_count;
          });

          // Update shipping progress only if cart still has items
          if (cartData.item_count > 0 && typeof updateShippingProgress === 'function') {
            updateShippingProgress();
          }

          // If quantity is 0, remove the item row
          if (newQuantity === 0) {
            const itemRow = this.closest('.tf-cart-item');
            if (itemRow) {
              itemRow.remove();
            }

            // Check if cart is now empty
            if (cartData.item_count === 0) {
              if (typeof handleEmptyCart === 'function') {
                handleEmptyCart();
              }
            }
          }
        } catch (error) {
          console.error('Error updating quantity:', error);
          alert('Failed to update quantity. Product out of stock.');
        }
      });
    });

    // Quantity input
    const quantityInput = itemRow.querySelector('.quantity-product');
    if (quantityInput) {
      quantityInput.addEventListener('change', async function() {
        const variantId = this.dataset.variantId;
        if (!variantId) return;
        
        const newValue = parseInt(this.value);
        
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
              throw new Error('Failed to remove item');
            }
          } else {
            this.value = 1;
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
              throw new Error('Failed to update quantity');
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
            throw new Error('Failed to update quantity');
          }
        }

        // Fetch updated cart data and update UI
        const cartResponse = await fetch('/cart.js');
        if (!cartResponse.ok) throw new Error('Failed to fetch cart data');
        const cartData = await cartResponse.json();
        
        // Update cart total
        const cartTotal = document.querySelector('.total');
        if (cartTotal) {
          cartTotal.textContent = ProductCard.formatMoney(cartData.total_price);
        }

        // Update cart count
        document.querySelectorAll('.cart-count').forEach(element => {
          element.textContent = cartData.item_count;
        });

        // Update shipping progress only if cart still has items
        if (cartData.item_count > 0 && typeof updateShippingProgress === 'function') {
          updateShippingProgress();
        }

        // Check if cart is now empty
        if (cartData.item_count === 0) {
          if (typeof handleEmptyCart === 'function') {
            handleEmptyCart();
          }
        }
      });
    }
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
          // Add loading state with spinner
          newButton.classList.add('loading');
          
          // Store original content
          const originalContent = newButton.innerHTML;
          newButton.dataset.originalContent = originalContent;
          
          // Add spinner to button
          newButton.innerHTML = `
              <div class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
          `;
          
          // Disable button during loading
          newButton.style.pointerEvents = 'none';
          newButton.setAttribute('aria-disabled', 'true');
          
          // Add item to cart
          const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: [{
                id: variantId,
                quantity: quantity
              }]
            })
          });

          if (!response.ok) throw new Error('Failed to add item to cart');
          const cartResponse = await fetch('/cart.js');
          const cartData = await cartResponse.json();
          
          // If we're on the cart page, add the item to the cart table
          if (this.isCartPage()) {
            // Find the added item in the cart data
            const addedItem = cartData.items.find(item => item.variant_id == variantId);
            if (addedItem) {
              this.handleRelatedProductAddition(cartData, addedItem);
            }
            
            // Update cart total
            const cartTotal = document.querySelector('.total');
            if (cartTotal) {
              cartTotal.textContent = this.formatMoney(cartData.total_price);
            }
            
            // Update cart count
            const cartCountElements = document.querySelectorAll('.cart-count');
            cartCountElements.forEach(element => {
              element.textContent = cartData.item_count;
            });

            // Update shipping progress only if cart has items
            if (cartData.item_count > 0 && typeof updateShippingProgress === 'function') {
              updateShippingProgress();
            }

            // Show cart with items if it was empty
            if (typeof handleCartWithItems === 'function') {
              handleCartWithItems();
            }
          } else {
            // Regular cart drawer update for non-cart pages
            if (window.cart) {
              // The item has already been added via the POST request above
              // Just fetch the updated cart data and update the drawer
              const response = await fetch('/cart.js');
              const cartData = await response.json();
              await this.updateCartDrawer(cartData);
              
              // Show the cart drawer after adding item
              if (window.cart.showCartDrawer) {
                window.cart.showCartDrawer();
              } else if (typeof window.openCartDrawer === 'function') {
                window.openCartDrawer();
              }
            } else {
              // Fallback: just update cart count
              const cartCountElements = document.querySelectorAll('.cart-count');
              cartCountElements.forEach(element => {
                element.textContent = cartData.item_count;
              });
              
              // Try to show cart drawer with fallback method
              if (typeof window.openCartDrawer === 'function') {
                window.openCartDrawer();
              }
            }
          }

          // Show success feedback briefly
          newButton.innerHTML = `
            <div class="success-feedback">
              <i class="icon icon-check text-success"></i>
            </div>
          `;
          
          // Optional: Show success message
          // You can add your own success notification here
          
        } catch (error) {
          console.error('Error adding item to cart:', error);
          
          // Show error feedback
          newButton.innerHTML = `
            <div class="error-feedback">
              <i class="icon icon-close text-danger"></i>
            </div>
          `;
          
          alert('Failed to add item to cart. Please try again.');
        } finally {
          // Restore button state after a brief delay
          setTimeout(() => {
            newButton.classList.remove('loading');
            newButton.style.pointerEvents = '';
            newButton.removeAttribute('aria-disabled');
            
            // Restore original content
            const originalContent = newButton.dataset.originalContent;
            if (originalContent) {
              newButton.innerHTML = originalContent;
            }
          }, 1000); // Show feedback for 1 second
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
          const cartItemElement = button.closest('.tf-mini-cart-item');
          
          // Add loading state to the cart item
          cartItemElement.classList.add('loading');
          
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
            alert('Failed to update cart. Product out of stock.');
          } finally {
            // Remove loading state
            cartItemElement.classList.remove('loading');
          }
        });
      });

      // Increase button
      container.querySelectorAll('.btn-increase').forEach(button => {
        button.addEventListener('click', async () => {
          const cartItemElement = button.closest('.tf-mini-cart-item');
          
          // Add loading state to the cart item
          cartItemElement.classList.add('loading');
          
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
            alert('Failed to update cart. Product out of stock.');
          } finally {
            // Remove loading state
            cartItemElement.classList.remove('loading');
          }
        });
      });

      // Quantity input
      container.querySelectorAll('.quantity-product').forEach(input => {
        input.addEventListener('change', async () => {
          const cartItemElement = input.closest('.tf-mini-cart-item');
          
          // Add loading state to the cart item
          cartItemElement.classList.add('loading');
          
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
            alert('Failed to update cart. Product out of stock.');
          } finally {
            // Remove loading state
            cartItemElement.classList.remove('loading');
          }
        });
      });

      // Remove button
      container.querySelectorAll('.remove').forEach(button => {
        button.addEventListener('click', async () => {
          const cartItemElement = button.closest('.tf-mini-cart-item');
          
          // Add loading state to the cart item
          cartItemElement.classList.add('loading');
          
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
            alert('Failed to update cart. Product out of stock.');
          } finally {
            // Remove loading state
            cartItemElement.classList.remove('loading');
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

  // Initialize product card functionality for dynamically added products
  initializeForDynamicProducts(container) {
    if (!container) return;
    
    // Initialize variant image switching for new products
    this.initializeVariantImageSwitching();
    
    // Initialize cart events for new products
    this.initializeCartEvents();
    
    // Initialize variant selection for new products
    this.initializeVariantSelection();
    
    // Initialize wishlist and compare buttons state
    if (window.wishlistCompare) {
      window.wishlistCompare.updateButtonsState();
    }
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

    // If on cart page, initialize cart table event listeners for existing items
    if (this.isCartPage()) {
      this.initializeCartTableEventListeners();
    }
  },

  // Initialize cart table event listeners for existing items
  initializeCartTableEventListeners() {
    const cartTableBody = document.querySelector('.table-page-cart tbody');
    if (!cartTableBody) return;

    // Bind event listeners to existing cart items
    const existingItems = cartTableBody.querySelectorAll('.tf-cart-item');
    existingItems.forEach(item => {
      this.bindCartItemEventListeners(item);
    });
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
  },

  // Handle product addition from related products section
  handleRelatedProductAddition(cartData, addedItem) {
    if (!this.isCartPage()) return;

    // Add the item to the cart table
    this.addProductToCartTable(cartData, addedItem);
    
    // Update cart total
    const cartTotal = document.querySelector('.total');
    if (cartTotal) {
      cartTotal.textContent = this.formatMoney(cartData.total_price);
    }
    
    // Update cart count
    document.querySelectorAll('.cart-count').forEach(element => {
      element.textContent = cartData.item_count || '0';
    });

    // Update shipping progress only if cart has items
    if (cartData.item_count > 0 && typeof updateShippingProgress === 'function') {
      updateShippingProgress();
    }

    // Show cart with items if it was empty
    if (typeof handleCartWithItems === 'function') {
      handleCartWithItems();
    }
  },
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => ProductCard.init());

// Expose ProductCard globally
window.ProductCard = ProductCard;

document.addEventListener('DOMContentLoaded', function() {
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

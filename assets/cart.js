document.addEventListener('DOMContentLoaded', function() {
  // Prevent cart drawer from opening on cart page
  const isCartPage = window.location.pathname === '/cart';
  if (isCartPage) {
    // Override the openCartDrawer function
    window.openCartDrawer = function() {
      return false;
    };

    // Remove cart drawer trigger buttons (header cart buttons)
    document.querySelectorAll('.nav-cart .nav-icon-item').forEach(trigger => {
      trigger.onclick = function(e) {
        e.preventDefault();
        return false;
      };
    });

    // Remove mobile toolbar cart button functionality
    document.querySelectorAll('.tf-toolbar-bottom .toolbar-item a[href="#shoppingCart"]').forEach(trigger => {
      // Remove the data-bs-toggle attribute to prevent Bootstrap offcanvas
      trigger.removeAttribute('data-bs-toggle');
      
      // Override the onclick handler
      trigger.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      // Also prevent any Bootstrap offcanvas events
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }, true);
    });

    // Remove cart drawer element if it exists
    const cartDrawer = document.querySelector('.cart-drawer, #cart-drawer, [data-cart-drawer]');
    if (cartDrawer) {
      cartDrawer.remove();
    }
    
    // Also prevent any Bootstrap offcanvas events for shoppingCart
    document.addEventListener('click', function(e) {
      if (e.target.closest('a[href="#shoppingCart"]')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }

  // Function to handle empty cart state
  function handleEmptyCart() {
    console.log('Handling empty cart state');
    const mainRow = document.getElementById('cart-items-row');
    const emptyCartContainer = document.getElementById('empty-cart-container');
    const shippingProgressSection = document.querySelector('.flat-spacing-24');
    
    console.log('Main row found:', mainRow);
    console.log('Empty cart container found:', emptyCartContainer);
    console.log('Shipping progress section found:', shippingProgressSection);
    
    // Hide the entire cart layout (both columns)
    if (mainRow) {
      mainRow.style.display = 'none';
      console.log('Hidden main row');
    } else {
      console.log('Main row not found - this should not happen after template update');
    }
    
    // Hide shipping progress section
    if (shippingProgressSection) {
      shippingProgressSection.style.display = 'none';
      console.log('Hidden shipping progress section');
    } else {
      console.log('Shipping progress section not found - this should not happen after template update');
    }
    
    // Show empty cart message container
    if (emptyCartContainer) {
      emptyCartContainer.style.display = 'flex';
      console.log('Showed empty cart container');
    } else {
      console.log('Empty cart container not found');
    }
  }

  // Make function globally available
  window.handleEmptyCart = handleEmptyCart;

  // Function to handle cart with items state
  function handleCartWithItems() {
    console.log('Handling cart with items state');
    const mainRow = document.getElementById('cart-items-row');
    const emptyCartContainer = document.getElementById('empty-cart-container');
    const shippingProgressSection = document.querySelector('.flat-spacing-24');
    
    console.log('Main row found:', mainRow);
    console.log('Empty cart container found:', emptyCartContainer);
    console.log('Shipping progress section found:', shippingProgressSection);
    
    // Show the entire cart layout (both columns)
    if (mainRow) {
      mainRow.style.display = 'flex';
      console.log('Showed main row');
    } else {
      console.log('Main row not found - this should not happen after template update');
    }
    
    // Show shipping progress section
    if (shippingProgressSection) {
      shippingProgressSection.style.display = 'block';
      console.log('Showed shipping progress section');
    } else {
      console.log('Shipping progress section not found - this should not happen after template update');
    }
    
    // Hide empty cart message container
    if (emptyCartContainer) {
      emptyCartContainer.style.display = 'none';
      console.log('Hidden empty cart container');
    } else {
      console.log('Empty cart container not found');
    }
  }

  // Make function globally available
  window.handleCartWithItems = handleCartWithItems;

  // Function to update shipping progress
  function updateShippingProgress() {
    const totalElement = document.querySelector('.total');
    if (!totalElement) {
      console.log('Total element not found, skipping shipping progress update');
      return;
    }
    
    const cartTotal = parseFloat(totalElement.textContent.replace(/[^0-9.-]+/g, ''));
    if (isNaN(cartTotal)) {
      console.log('Invalid cart total, skipping shipping progress update');
      return;
    }
    
    const threshold = 100; // $100 threshold
    const progress = Math.min(98, (cartTotal / threshold) * 98);
    const progressBar = document.querySelector('.tf-progress-ship .value');
    const progressText = document.querySelector('.tf-cart-head .title');
    
    if (progressBar) {
      progressBar.style.width = progress + '%';
      progressBar.setAttribute('data-progress', progress);
    }
    
    if (progressText) {
      if (cartTotal >= threshold) {
        progressText.innerHTML = 'Congratulations! You\'ve unlocked <span class="fw-medium">Free Shipping</span>';
      } else {
        const remaining = threshold - cartTotal;
        progressText.innerHTML = `Spend <span class="fw-medium">$${remaining.toFixed(2)}</span> more to get <span class="fw-medium">Free Shipping</span>`;
      }
    }
  }

  // Make function globally available
  window.updateShippingProgress = updateShippingProgress;

  // Update progress on page load
  updateShippingProgress();

  // Update progress when cart changes
  document.addEventListener('cart:change', function(e) {
    if (e.detail && e.detail.cart && e.detail.cart.item_count > 0) {
      updateShippingProgress();
    }
  });

  // Function to fetch and update cart data
  async function fetchCartData() {
    try {
      const response = await fetch('/cart.js');
      const cartData = await response.json();
      
      // Update cart items with proper image data
      cartData.items.forEach(item => {
        const cartItem = document.querySelector(`[data-variant-id="${item.variant_id}"]`);
        if (cartItem) {
          const imgElement = cartItem.querySelector('.img-box img');
          if (imgElement && item.image) {
            imgElement.src = item.image;
            imgElement.alt = item.title;
          }
        }
      });

      // Update cart totals
      const cartTotal = document.querySelector('.total');
      if (cartTotal) {
        cartTotal.textContent = formatMoney(cartData.total_price);
      }

      // Update cart count
      const cartCount = document.querySelector('.cart-count');
      if (cartCount) {
        cartCount.textContent = cartData.item_count;
      }

      // Update shipping progress immediately only if cart has items
      if (cartData.item_count > 0) {
        updateShippingProgress();
      }
    } catch (error) {
      console.error('Error fetching cart data:', error);
    }
  }

  // Fetch cart data on page load
  fetchCartData();

  // Initialize cart state on page load
  async function initializeCartState() {
    try {
      const response = await fetch('/cart.js');
      const cartData = await response.json();
      
      if (cartData.item_count === 0) {
        handleEmptyCart();
      } else {
        handleCartWithItems();
      }
    } catch (error) {
      console.error('Error initializing cart state:', error);
    }
  }

  // Initialize cart state
  initializeCartState();

  // Handle remove buttons in cart
  document.querySelectorAll('.remove-cart').forEach(button => {
    button.addEventListener('click', async function(e) {
      e.preventDefault();
      const variantId = this.dataset.variantId;
      const itemId = this.dataset.itemId;
      
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

        const cartData = await response.json();
        console.log('Cart data after removal:', cartData);

        // Remove the item row from the table
        const itemRow = this.closest('.tf-cart-item');
        if (itemRow) {
          itemRow.remove();
        }

        // Update cart totals and count
        const cartTotal = document.querySelector('.total');
        if (cartTotal) {
          cartTotal.textContent = formatMoney(cartData.total_price);
        }
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
          cartCount.textContent = cartData.item_count;
        }

        // Update shipping progress only if cart still has items
        if (cartData.item_count > 0) {
          updateShippingProgress();
        }

        // Check if cart is now empty
        if (cartData.item_count === 0) {
          console.log('Cart is now empty, calling handleEmptyCart');
          handleEmptyCart();
        }
      } catch (error) {
        console.error('Error removing item:', error);
        alert('Failed to remove item. Please try again.');
      }
    });
  });

  // Handle quantity buttons in cart
  document.querySelectorAll('.btn-quantity').forEach(button => {
    button.addEventListener('click', async function() {
      const variantId = this.dataset.variantId;
      const input = this.parentElement.querySelector('.quantity-product');
      const currentValue = parseInt(input.value);
      
      if (!variantId) return;

      try {
        let newQuantity;
        if (this.classList.contains('minus')) {
          newQuantity = currentValue > 1 ? currentValue : 0;
        } else if (this.classList.contains('plus')) {
          newQuantity = currentValue;
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
          throw new Error('Failed to update quantity. Product out of stock.');
        }

        const cartData = await response.json();

        // Update the item's total price
        const itemRow = this.closest('.tf-cart-item');
        if (itemRow) {
          const itemTotal = itemRow.querySelector('.cart-total');
          if (itemTotal) {
            const updatedItem = cartData.items.find(item => item.variant_id == variantId);
            if (updatedItem) {
              itemTotal.textContent = formatMoney(updatedItem.final_line_price);
            }
          }
        }

        // Update cart total
        const cartTotal = document.querySelector('.total');
        if (cartTotal) {
          cartTotal.textContent = formatMoney(cartData.total_price);
        }

        // Update cart count
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
          cartCount.textContent = cartData.item_count;
        }

        // Update shipping progress only if cart still has items
        if (cartData.item_count > 0) {
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
            console.log('Cart is now empty (quantity), calling handleEmptyCart');
            handleEmptyCart();
          }
        }
      } catch (error) {
        console.error('Error updating quantity:', error);
        alert('Failed to update quantity. Product out of stock.');
      }
    });
  });

  // Handle terms checkbox and checkout button
  const termsCheckbox = document.getElementById('check-agree');
  const checkoutButton = document.getElementById('checkout-button');
  const checkoutForm = document.getElementById('checkout-form');
  
  if (termsCheckbox && checkoutButton && checkoutForm) {
    // Reset checkbox state on page load to ensure it's unchecked
    termsCheckbox.checked = false;
    
    // Function to update checkout button state
    function updateCheckoutButtonState() {
      // Get cart item count
      const cartItems = document.querySelectorAll('.tf-cart-item');
      const hasItems = cartItems.length > 0;
      
      // Update button state based on terms agreement and cart items
      checkoutButton.disabled = !termsCheckbox.checked || !hasItems;
      
      // Update button text based on state
      if (!hasItems) {
        checkoutButton.textContent = 'Your cart is empty';
      } else if (!termsCheckbox.checked) {
        checkoutButton.textContent = 'Please agree to terms';
      } else {
        checkoutButton.textContent = 'Checkout';
      }
    }
    
    // Initial state
    updateCheckoutButtonState();
    
    // Handle checkbox change
    termsCheckbox.addEventListener('change', function() {
      updateCheckoutButtonState();
    });
    
    // Handle form submission
    checkoutForm.addEventListener('submit', function(e) {
      if (!termsCheckbox.checked) {
        e.preventDefault();
        alert('Please agree to the terms and conditions before proceeding to checkout.');
        return;
      }
      
      // Check if cart has items
      const cartItems = document.querySelectorAll('.tf-cart-item');
      if (cartItems.length === 0) {
        e.preventDefault();
        alert('Your cart is empty. Please add items before proceeding to checkout.');
        return;
      }
    });
  }

  // Handle shipping estimates
  const shippingForm = document.querySelector('.shipping-cart-box');
  const estimateButton = shippingForm?.querySelector('button[type="button"]');
  const shippingRatesContainer = shippingForm?.querySelector('.shipping-rates-container');
  const shippingRatesList = shippingForm?.querySelector('.shipping-rates-list');
  const shippingRatesError = shippingForm?.querySelector('.shipping-rates-error');
  
  // Initialize shipping rates header as hidden by default
  if (shippingForm) {
    const shippingRatesHeader = shippingForm.querySelector('.shipping-rates-header');
    if (shippingRatesHeader) {
      shippingRatesHeader.style.display = 'none';
    }
  }
  
  if (estimateButton) {
    estimateButton.addEventListener('click', async function() {
      const country = document.getElementById('country').value.trim();
      const state = document.getElementById('state').value.trim();
      const zipcode = document.getElementById('code').value.trim();
      
      // Reset previous results
      shippingRatesList.innerHTML = '';
      shippingRatesError.style.display = 'none';
      shippingRatesContainer.style.display = 'none';
      
      // Enhanced validation
      if (!country || !state || !zipcode) {
        shippingRatesError.textContent = 'Please fill in all shipping fields (Country, State/Province, and Zipcode)';
        shippingRatesError.style.display = 'block';
        shippingRatesError.className = 'shipping-rates-error text-sm text-danger text-center';
        shippingRatesContainer.style.display = 'block';
        return;
      }

      // Basic zipcode format validation (US format as example)
      if (country.toLowerCase() === 'united states' || country.toLowerCase() === 'us') {
        const usZipcodeRegex = /^\d{5}(-\d{4})?$/;
        if (!usZipcodeRegex.test(zipcode)) {
          shippingRatesError.textContent = 'Please enter a valid US zipcode (e.g., 12345 or 12345-6789)';
          shippingRatesError.style.display = 'block';
          shippingRatesError.className = 'shipping-rates-error text-sm text-danger text-center';
          shippingRatesContainer.style.display = 'block';
          return;
        }
      }

      // Show loading state
      estimateButton.disabled = true;
      estimateButton.innerHTML = '<span class="loading-spinner"></span> Calculating...';
      shippingRatesContainer.style.display = 'block';
      shippingRatesList.innerHTML = '<div class="text-center">Calculating shipping rates...</div>';

      try {
        const response = await fetch('/cart/shipping_rates.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shipping_address: {
              country: country,
              province: state,
              zip: zipcode
            }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.shipping_rates && data.shipping_rates.length > 0) {
          // Display shipping rates
          shippingRatesList.innerHTML = data.shipping_rates.map(rate => `
            <div class="shipping-rate-item" style="padding: 10px; border-bottom: 1px solid #eee;">
              <div class="d-flex justify-content-between align-items-center">
                <div class="shipping-rate-name text-md">${rate.name}</div>
                <div class="shipping-rate-price text-md fw-medium">
                  ${formatMoney(rate.price)}
                </div>
              </div>
              ${rate.delivery_time ? `<div class="shipping-rate-delivery text-sm text-dark-4">Estimated delivery: ${rate.delivery_time}</div>` : ''}
            </div>
          `).join('');
          
          // Add a note about zipcode validation
          if (data.shipping_rates.length > 0) {
            shippingRatesList.innerHTML += `
              <div class="text-sm text-dark-4 mt-2" style="padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
                <i class="icon icon-info"></i> Note: Shipping rates are calculated based on the provided address. 
                Please verify your zipcode is correct for accurate delivery estimates.
              </div>
            `;
          }
          
          // Show the header when rates are available
          const shippingRatesHeader = shippingForm.querySelector('.shipping-rates-header');
          if (shippingRatesHeader) {
            shippingRatesHeader.style.display = 'block';
          }
        } else {
          shippingRatesList.innerHTML = `
            <div class="text-center text-dark-4">
              <div>No shipping rates available for this location</div>
              <div class="text-sm mt-1">Please verify your address information is correct</div>
            </div>
          `;
          
          // Hide the header when no rates are available
          const shippingRatesHeader = shippingForm.querySelector('.shipping-rates-header');
          if (shippingRatesHeader) {
            shippingRatesHeader.style.display = 'none';
          }
        }
      } catch (error) {
        console.error('Error fetching shipping rates:', error);
        shippingRatesError.textContent = 'Failed to calculate shipping rates. Please verify your address and try again.';
        shippingRatesError.style.display = 'block';
        shippingRatesError.className = 'shipping-rates-error text-sm text-danger text-center';
      } finally {
        // Restore the original button text
        estimateButton.disabled = false;
        estimateButton.textContent = 'Estimate';
      }
    });
  }

  // Handle gift wrap
  const giftWrapCheckbox = document.getElementById('checkGift');
  if (giftWrapCheckbox) {
    // Check if gift wrap exists in cart on page load
    const checkGiftWrapInCart = async () => {
      try {
        const cartData = await fetch('/cart.js').then(res => res.json());
        const variantId = giftWrapCheckbox.dataset.variantId;
        const hasGiftWrap = cartData.items.some(item => item.variant_id == variantId);
        giftWrapCheckbox.checked = hasGiftWrap;
      } catch (error) {
        console.error('Error checking gift wrap in cart:', error);
      }
    };

    // Check gift wrap status on page load
    checkGiftWrapInCart();

    giftWrapCheckbox.addEventListener('change', async function() {
      const variantId = this.dataset.variantId;
      if (!variantId) return;
      try {
        if (this.checked) {
          const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              items: [{ id: variantId, quantity: 1 }]
            })
          });

          const data = await response.json();
          
          // Add gift wrap item to cart table immediately
          const cartTableBody = document.querySelector('.table-page-cart tbody');
          if (cartTableBody) {
            const giftWrapItem = data.items.find(item => item.variant_id == variantId);
            if (giftWrapItem) {
              const giftWrapRow = document.createElement('tr');
              giftWrapRow.className = 'tf-cart-item';
              giftWrapRow.setAttribute('data-item-id', giftWrapItem.key);
              giftWrapRow.setAttribute('data-variant-id', giftWrapItem.variant_id);
              
              giftWrapRow.innerHTML = `
                <td class="tf-cart-item_product">
                  <a href="${giftWrapItem.url}" class="img-box">
                    <img src="${giftWrapItem.image}" alt="${giftWrapItem.title}" width="150" height="150">
                  </a>
                  <div class="cart-info">
                    <a href="${giftWrapItem.url}" class="name text-md link fw-medium">${giftWrapItem.product_title}</a>
                    <div></div>
                    <span class="remove-cart link remove" data-item-id="${giftWrapItem.key}" data-variant-id="${giftWrapItem.variant_id}">Remove</span>
                  </div>
                </td>
                <td class="tf-cart-item_price text-center" data-cart-title="Price">
                  <span class="cart-price price-on-sale text-md fw-medium">${formatMoney(giftWrapItem.final_price)}</span>
                </td>
                <td class="tf-cart-item_quantity" data-cart-title="Quantity">
                  <div class="wg-quantity">
                    <button type="button" class="btn-quantity minus" data-variant-id="${giftWrapItem.variant_id}" data-item-id="${giftWrapItem.key}">-</button>
                    <input class="quantity-product" type="text" name="updates[]" value="1" min="0" data-variant-id="${giftWrapItem.variant_id}" data-item-id="${giftWrapItem.key}">
                    <button type="button" class="btn-quantity plus" data-variant-id="${giftWrapItem.variant_id}" data-item-id="${giftWrapItem.key}">+</button>
                  </div>
                </td>
                <td class="tf-cart-item_total text-center" data-cart-title="Total">
                  <div class="cart-total total-price text-md fw-medium">${formatMoney(giftWrapItem.final_line_price)}</div>
                </td>
              `;
              
              // Insert at the top of the cart table
              if (cartTableBody.firstChild) {
                cartTableBody.insertBefore(giftWrapRow, cartTableBody.firstChild);
              } else {
                cartTableBody.appendChild(giftWrapRow);
              }
              
              // Re-bind event listeners for the new gift wrap item
              const removeButton = giftWrapRow.querySelector('.remove-cart');
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

                    // Update cart total and count
                    const cartData = await response.json();
                    const cartTotal = document.querySelector('.total');
                    if (cartTotal) {
                      cartTotal.textContent = formatMoney(cartData.total_price);
                    }
                    const cartCount = document.querySelector('.cart-count');
                    if (cartCount) {
                      cartCount.textContent = cartData.item_count;
                    }

                    // Update shipping progress only if cart still has items
                    if (cartData.item_count > 0) {
                      updateShippingProgress();
                    }

                    // Uncheck the gift wrap checkbox
                    giftWrapCheckbox.checked = false;

                    // Check if cart is now empty
                    if (cartData.item_count === 0) {
                      handleEmptyCart();
                    }
                  } catch (error) {
                    console.error('Error removing item:', error);
                    alert('Failed to remove item. Please try again.');
                  }
                });
              }

              // Add quantity button event listeners
              const quantityButtons = giftWrapRow.querySelectorAll('.btn-quantity');
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
                      throw new Error('Failed to update quantity. Product out of stock.');
                    }

                    const cartData = await response.json();

                    // Update the item's total price
                    const itemRow = this.closest('.tf-cart-item');
                    if (itemRow) {
                      const itemTotal = itemRow.querySelector('.cart-total');
                      if (itemTotal) {
                        const updatedItem = cartData.items.find(item => item.variant_id == variantId);
                        if (updatedItem) {
                          itemTotal.textContent = formatMoney(updatedItem.final_line_price);
                        }
                      }
                    }

                    // Update cart total
                    const cartTotal = document.querySelector('.total');
                    if (cartTotal) {
                      cartTotal.textContent = formatMoney(cartData.total_price);
                    }

                    // Update cart count
                    const cartCount = document.querySelector('.cart-count');
                    if (cartCount) {
                      cartCount.textContent = cartData.item_count;
                    }

                    // Update shipping progress only if cart still has items
                    if (cartData.item_count > 0) {
                      updateShippingProgress();
                    }

                    // If quantity is 0, remove the item row and uncheck the checkbox
                    if (newQuantity === 0) {
                      const itemRow = this.closest('.tf-cart-item');
                      if (itemRow) {
                        itemRow.remove();
                      }
                      giftWrapCheckbox.checked = false;

                      // Check if cart is now empty
                      if (cartData.item_count === 0) {
                        handleEmptyCart();
                      }
                    }
                  } catch (error) {
                    console.error('Error updating quantity:', error);
                    alert('Failed to update quantity. Product out of stock.');
                  }
                });
              });
            }
          }
        } else {
          // Remove all gift wrap items from cart
          const cartItems = await fetch('/cart.js').then(res => res.json());
          const giftWrapItem = cartItems.items.find(item => item.variant_id == variantId);
          if (giftWrapItem) {
            await fetch('/cart/change.js', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: giftWrapItem.key,
                quantity: 0
              })
            });

            // Remove the gift wrap item from the cart table
            const giftWrapRow = document.querySelector(`[data-variant-id="${variantId}"]`);
            if (giftWrapRow) {
              giftWrapRow.remove();
            }
          }
        }

        // Update cart total and count
        const cartData = await fetch('/cart.js').then(res => res.json());
        const cartTotal = document.querySelector('.total');
        if (cartTotal) {
          cartTotal.textContent = formatMoney(cartData.total_price);
        }
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
          cartCount.textContent = cartData.item_count;
        }

        // Update shipping progress only if cart still has items
        if (cartData.item_count > 0) {
          updateShippingProgress();
        }

        // Check if cart is now empty
        if (cartData.item_count === 0) {
          handleEmptyCart();
        }
      } catch (error) {
        console.error('Error updating gift wrap:', error);
        alert('Failed to update gift wrap. Product out of stock.');
      }
    });
  }

  // Handle discount code
  const discountForm = document.querySelector('.box-ip-discount');
  const discountInput = discountForm?.querySelector('input[name="discount_code"]');
  const applyButton = discountForm?.querySelector('button');
  
  if (applyButton && discountInput) {
    applyButton.addEventListener('click', async function() {
      const code = discountInput.value.trim();
      if (!code) {
        alert('Please enter a discount code');
        return;
      }

      try {
        const response = await fetch('/cart/update.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            discount_code: code
          })
        });

        const data = await response.json();
        
        if (data.discount_applications && data.discount_applications.length > 0) {
          alert('Discount code applied successfully!');
          // Update the cart total display
          const cartTotal = document.querySelector('.total');
          if (cartTotal) {
            cartTotal.textContent = formatMoney(data.total_price);
          }
          // Update shipping progress only if cart has items
          if (data.item_count > 0) {
            updateShippingProgress();
          }
        } else {
          alert('Invalid discount code');
        }
      } catch (error) {
        console.error('Error applying discount code:', error);
        alert('Failed to apply discount code. Please try again.');
      }
    });
  }

  // Handle cart note
  const cartNote = document.getElementById('note');
  if (cartNote) {
    let noteTimeout;
    
    cartNote.addEventListener('input', async function() {
      // Clear any existing timeout
      if (noteTimeout) {
        clearTimeout(noteTimeout);
      }
      
      // Show saving indicator
      const savingIndicator = document.createElement('span');
      savingIndicator.className = 'saving-indicator';
      savingIndicator.textContent = 'Saving...';
      savingIndicator.style.marginLeft = '10px';
      savingIndicator.style.fontSize = '0.9em';
      savingIndicator.style.color = '#666';
      
      // Remove any existing indicator
      const existingIndicator = cartNote.parentElement.querySelector('.saving-indicator');
      if (existingIndicator) {
        existingIndicator.remove();
      }
      
      cartNote.parentElement.appendChild(savingIndicator);
      
      // Set a timeout to save the note after 1 second of no typing
      noteTimeout = setTimeout(async () => {
        try {
          const response = await fetch('/cart/update.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              note: this.value
            })
          });
          
          const data = await response.json();
          
          if (data.note === this.value) {
            // Update the indicator to show success
            savingIndicator.textContent = 'Saved!';
            savingIndicator.style.color = '#28a745';
            
            // Remove the indicator after 2 seconds
            setTimeout(() => {
              savingIndicator.remove();
            }, 2000);
          } else {
            throw new Error('Note not updated correctly');
          }
        } catch (error) {
          console.error('Error updating cart note:', error);
          savingIndicator.textContent = 'Failed to save';
          savingIndicator.style.color = '#dc3545';
          
          // Remove the indicator after 2 seconds
          setTimeout(() => {
            savingIndicator.remove();
          }, 2000);
        }
      }, 1000);
    });
  }

  // Helper function to format money
  function formatMoney(cents) {
    if (window.Shopify && Shopify.formatMoney) {
      return Shopify.formatMoney(cents, window.theme && window.theme.moneyFormat ? window.theme.moneyFormat : "${{amount}}");
    } else {
      return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
  }

  // Ensure terms checkbox and button are reset when returning via browser back/forward
  window.addEventListener('pageshow', function(event) {
    const termsCheckbox = document.getElementById('check-agree');
    const checkoutButton = document.getElementById('checkout-button');
    if (termsCheckbox && checkoutButton) {
      termsCheckbox.checked = false;
      // Try to call the updateCheckoutButtonState function if available
      if (typeof updateCheckoutButtonState === 'function') {
        updateCheckoutButtonState();
      } else {
        // Fallback: manually update button
        checkoutButton.disabled = true;
        checkoutButton.textContent = 'Please agree to terms';
      }
    }
  });
}); 
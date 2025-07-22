// Theme JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // Initialize quantity inputs
  document.querySelectorAll('quantity-input').forEach((input) => {
    input.addEventListener('change', (event) => {
      const form = event.target.closest('form');
      if (form) {
        form.requestSubmit();
      }
    });
  });

  // Initialize variant selectors
  document.querySelectorAll('[data-option-selector]').forEach((select) => {
    select.addEventListener('change', (event) => {
      try {
        const form = event.target.closest('form');
        if (!form) {
          console.warn('Variant selector form not found');
          return;
        }

        const variantIdInput = form.querySelector('[name="id"]');
        if (!variantIdInput) {
          console.warn('Variant ID input not found');
          return;
        }

        const variantId = variantIdInput.value;
        if (!variantId) {
          console.warn('No variant ID value found');
          return;
        }

        const variant = form.querySelector(`[data-variant-id="${variantId}"]`);
        if (variant) {
          const priceElement = variant.querySelector('[data-price]');
          const comparePriceElement = variant.querySelector('[data-compare-price]');
          const availabilityElement = variant.querySelector('[data-availability]');
          const addButton = form.querySelector('[type="submit"]');

          // Update price
          const priceContainer = form.querySelector('.product-price');
          if (priceContainer && priceElement) {
            // Create price elements safely using HTMLSanitizer
            const priceWrapper = HTMLSanitizer.createElement('div');
            
            // Add main price
            const mainPrice = HTMLSanitizer.createElement('span', {
              class: 'product-price__main'
            }, priceElement.textContent);
            priceWrapper.appendChild(mainPrice);
            
            // Add compare price if exists
            if (comparePriceElement && comparePriceElement.textContent) {
              const comparePrice = HTMLSanitizer.createElement('span', {
                class: 'product-price__compare'
              }, comparePriceElement.textContent);
              priceWrapper.appendChild(comparePrice);
            }
            
            // Clear and update price container
            while (priceContainer.firstChild) {
              priceContainer.removeChild(priceContainer.firstChild);
            }
            priceContainer.appendChild(priceWrapper);
          }

          // Update availability and button state
          if (addButton && availabilityElement) {
            const isAvailable = availabilityElement.textContent === 'true';
            addButton.disabled = !isAvailable;
            addButton.textContent = isAvailable ? 
              addButton.dataset.addText || 'Add to Cart' : 
              addButton.dataset.soldText || 'Sold Out';
          }
        } else {
          console.warn('Variant element not found for ID:', variantId);
        }
      } catch (error) {
        console.error('Error updating variant selection:', error);
      }
    });
  });

  // Initialize cart drawer
  const cartDrawer = document.querySelector('cart-drawer');
  if (cartDrawer) {
    document.querySelectorAll('[data-cart-trigger]').forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        cartDrawer.open();
      });
    });
  }

  // Initialize newsletter form
  const newsletterForm = document.querySelector('.footer-block__newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(newsletterForm);
      const submitButton = newsletterForm.querySelector('[type="submit"]');
      const messageElement = newsletterForm.querySelector('.footer-block__newsletter-form-message');

      try {
        submitButton.disabled = true;
        submitButton.classList.add('loading');

        const response = await fetch('/contact#contact_form', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          messageElement.textContent = 'Thank you for subscribing!';
          messageElement.classList.add('success');
          newsletterForm.reset();
        } else {
          throw new Error('Subscription failed');
        }
      } catch (error) {
        messageElement.textContent = 'There was an error subscribing. Please try again.';
        messageElement.classList.add('error');
      } finally {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
      }
    });
  }

  // Initialize lazy loading
  if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach((img) => {
      img.src = img.dataset.src;
    });
  } else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
  }
});
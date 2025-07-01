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
      const form = event.target.closest('form');
      if (form) {
        const variantId = form.querySelector('[name="id"]').value;
        const variant = form.querySelector(`[data-variant-id="${variantId}"]`);
        if (variant) {
          const price = variant.querySelector('[data-price]').textContent;
          const comparePrice = variant.querySelector('[data-compare-price]')?.textContent;
          const availability = variant.querySelector('[data-availability]').textContent;
          const addButton = form.querySelector('[type="submit"]');

          // Update price
          const priceElement = form.querySelector('.product-price');
          if (priceElement) {
            priceElement.innerHTML = price;
            if (comparePrice) {
              priceElement.innerHTML += `<span class="product-price__compare">${comparePrice}</span>`;
            }
          }

          // Update availability
          if (addButton) {
            addButton.disabled = availability === 'false';
            addButton.textContent = availability === 'false' ? 'Sold Out' : 'Add to Cart';
          }
        }
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
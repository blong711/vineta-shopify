// Shopify JavaScript
window.addEventListener('load', () => {
  // Initialize Shopify section rendering
  document.querySelectorAll('[data-shopify="section"]').forEach((section) => {
    const sectionId = section.dataset.sectionId;
    const sectionType = section.dataset.sectionType;

    // Register section
    window.Shopify.sections.register(sectionType, {
      onLoad: () => {
        // Section loaded
        console.log(`Section ${sectionId} loaded`);
      },
      onSelect: () => {
        // Section selected in theme editor
        console.log(`Section ${sectionId} selected`);
      },
      onDeselect: () => {
        // Section deselected in theme editor
        console.log(`Section ${sectionId} deselected`);
      },
      onBlockSelect: (event) => {
        // Block selected in theme editor
        console.log(`Block ${event.detail.blockId} selected in section ${sectionId}`);
      },
      onBlockDeselect: (event) => {
        // Block deselected in theme editor
        console.log(`Block ${event.detail.blockId} deselected in section ${sectionId}`);
      },
    });
  });

  // Initialize Shopify cart
  if (window.Shopify && window.Shopify.checkout) {
    const cart = window.Shopify.checkout;
    const cartDrawer = document.querySelector('cart-drawer');

    // Update cart drawer when cart is updated
    cart.on('cart:updated', (event) => {
      if (cartDrawer) {
        cartDrawer.refresh();
      }
    });
  }

  // Initialize Shopify product form
  document.querySelectorAll('product-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitButton = form.querySelector('[type="submit"]');
      const formData = new FormData(form);

      try {
        submitButton.disabled = true;
        submitButton.classList.add('loading');

        const response = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Add to cart failed');
        }

        const data = await response.json();
        const cartDrawer = document.querySelector('cart-drawer');

        if (cartDrawer) {
          cartDrawer.refresh();
          cartDrawer.open();
        }
      } catch (error) {
        console.error('Error:', error);
        submitButton.textContent = 'Error adding to cart';
      } finally {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
      }
    });
  });

  // Initialize Shopify search
  const searchForm = document.querySelector('form[action="/search"]');
  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      const searchInput = searchForm.querySelector('input[type="search"]');
      if (searchInput.value.trim() === '') {
        event.preventDefault();
        searchInput.focus();
      }
    });
  }

  // Initialize Shopify currency selector
  const currencySelector = document.querySelector('currency-selector');
  if (currencySelector) {
    currencySelector.addEventListener('change', async (event) => {
      const currency = event.target.value;
      const formData = new FormData();
      formData.append('currency_code', currency);

      try {
        const response = await fetch('/cart/update', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Currency update failed');
        }

        window.location.reload();
      } catch (error) {
        console.error('Error:', error);
      }
    });
  }

  // Initialize Shopify language selector
  const languageSelectors = document.querySelectorAll('.type-languages');
  console.log('Found language selectors:', languageSelectors.length);
  
  languageSelectors.forEach((languageSelector, index) => {
    console.log(`Initializing language selector ${index + 1}:`, languageSelector);
    
    languageSelector.addEventListener('change', (event) => {
      const language = event.target.value;
      console.log('Language changed to:', language);
      
      try {
        window.location.href = `/localization?locale=${language}`;
      } catch (error) {
        console.error('Error changing language:', error);
      }
    });
  });
}); 
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

        const response = await fetch(window.theme.routes.cart_add_url + '.js', {
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
        if (window.cartNotifications) {
          window.cartNotifications.show(error.message || 'Error adding to cart', 'error');
        }
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
  const currencySelectors = document.querySelectorAll('select[name="currency"]');
  console.log('Found currency selectors:', currencySelectors.length);
  
  currencySelectors.forEach(selector => {
    selector.addEventListener('change', async function(e) {
      const currency = e.target.value;
      
      try {
        const formData = new FormData();
        formData.append('form_type', 'currency');
        formData.append('currency', currency);
        
        const response = await fetch(window.theme.routes.cart_update_url, {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: formData
        });
        
        if (response.ok) {
          window.location.href = window.location.href;
        } else {
          const errorData = await response.text();
          console.error('Failed to change currency. Server response:', errorData);
        }
      } catch (error) {
        console.error('Error changing currency:', error);
      }
    });
  });

  // Initialize Shopify language selector
  const languageSelectors = document.querySelectorAll('.type-languages');
  
  languageSelectors.forEach((languageSelector, index) => {
    
    languageSelector.addEventListener('change', (event) => {
      const language = event.target.value;
      
      // Get the primary language (first option in the selector)
      const primaryLanguage = languageSelector.options[0].value;
      
      // Remove any existing language prefix from the path
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const supportedLocales = Array.from(languageSelector.options).map(opt => opt.value);
      
      // Check if the first part of the path is a language code
      const currentLanguageInPath = supportedLocales.includes(pathParts[0]) ? pathParts[0] : null;
      
      let newPath;
      if (language === primaryLanguage) {
        // For primary language, remove the language prefix if it exists
        if (currentLanguageInPath) {
          pathParts.shift(); // Remove the language code
        }
        newPath = '/' + pathParts.join('/');
      } else {
        // For non-primary languages, ensure the language code is in the path
        if (currentLanguageInPath) {
          pathParts[0] = language; // Replace existing language code
        } else {
          pathParts.unshift(language); // Add language code at the beginning
        }
        newPath = '/' + pathParts.join('/');
      }
      
      window.location.href = `${newPath}${window.location.search}`;
    });
  });
}); 
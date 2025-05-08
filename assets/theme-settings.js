// Theme Settings JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // RTL Switcher
  if ({{ settings.enable_rtl_switcher }}) {
    const rtlSwitcher = document.createElement('button');
    rtlSwitcher.classList.add('rtl-switcher');
    rtlSwitcher.textContent = 'Switch Direction';
    rtlSwitcher.style.position = 'fixed';
    rtlSwitcher.style.bottom = '20px';
    rtlSwitcher.style.right = '20px';
    rtlSwitcher.style.zIndex = '1000';
    rtlSwitcher.style.padding = '10px 20px';
    rtlSwitcher.style.borderRadius = '4px';
    rtlSwitcher.style.border = 'none';
    rtlSwitcher.style.cursor = 'pointer';
    rtlSwitcher.style.backgroundColor = 'var(--primary-button)';
    rtlSwitcher.style.color = 'var(--primary-button-text)';
    
    rtlSwitcher.addEventListener('click', () => {
      const currentDir = document.documentElement.getAttribute('dir');
      const newDir = currentDir === 'rtl' ? 'ltr' : 'rtl';
      document.documentElement.setAttribute('dir', newDir);
      localStorage.setItem('theme-direction', newDir);
    });
    
    document.body.appendChild(rtlSwitcher);
    
    // Check for saved direction preference
    const savedDirection = localStorage.getItem('theme-direction');
    if (savedDirection) {
      document.documentElement.setAttribute('dir', savedDirection);
    }
  }

  // Animations
  if ({{ settings.enable_animations }}) {
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in, .zoom-in');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0) scale(1)';
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });

    animatedElements.forEach(element => {
      element.style.opacity = '0';
      if (element.classList.contains('slide-in')) {
        element.style.transform = 'translateY(20px)';
      } else if (element.classList.contains('zoom-in')) {
        element.style.transform = 'scale(0.95)';
      }
      observer.observe(element);
    });
  }

  // Search Functionality
  if ({{ settings.show_search_suggestions }}) {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      let searchTimeout;
      
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value;
        
        if (query.length >= 2) {
          searchTimeout = setTimeout(() => {
            fetchSearchSuggestions(query);
          }, 300);
        }
      });
    }
  }
});

// Search Suggestions Function
async function fetchSearchSuggestions(query) {
  try {
    const response = await fetch(`/search/suggest.json?q=${query}&resources[type]=product&resources[limit]={{ settings.search_suggestions_limit }}`);
    const data = await response.json();
    
    const suggestionsContainer = document.querySelector('.search-suggestions');
    if (suggestionsContainer) {
      suggestionsContainer.innerHTML = '';
      
      if (data.resources.results.products.length > 0) {
        const products = data.resources.results.products;
        
        products.forEach(product => {
          const suggestion = document.createElement('div');
          suggestion.classList.add('search-suggestion-item');
          suggestion.innerHTML = `
            <img src="${product.featured_image.url}" alt="${product.title}">
            <div class="suggestion-details">
              <h4>${product.title}</h4>
              <p>${product.price}</p>
            </div>
          `;
          suggestionsContainer.appendChild(suggestion);
        });
        
        suggestionsContainer.style.display = 'block';
      } else {
        suggestionsContainer.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
  }
} 
/**
 * Search Page JavaScript
 * Handles search page functionality including sorting, filtering, layout switching, and recently viewed products
 */

class SearchPage {
  constructor() {
    this.translations = this.getTranslations();
    this.initialize();
  }

  getTranslations() {
    // Get translations from the page
    const translationElement = document.getElementById('search-page-translations');
    if (translationElement) {
      try {
        return JSON.parse(translationElement.textContent);
      } catch (error) {
        console.warn(this.translations.failedParseTranslations || 'Failed to parse search page translations:', error);
      }
    }
    
    // Fallback translations
    return {
      addToCart: 'Add to cart',
      addToWishlist: 'Add to wishlist',
      quickView: 'Quick view',
      addToCompare: 'Add to compare',
      off: 'Off',
      sortBestSelling: 'Best Selling',
      sortAZ: 'A-Z',
      sortZA: 'Z-A',
      sortPriceAscending: 'Price: Low to High',
      sortPriceDescending: 'Price: High to Low',
      filterButton: 'Filter',
      availability: 'Availability',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      priceLabel: 'Price',
      priceRangeLabel: 'Price Range',
      brandLabel: 'Brand',
      clearAll: 'Clear All',
      loading: 'Loading...',
      errorUpdatingProducts: 'Error updating products. Please try again.',
      errorFetchingProduct: 'Error fetching product data',
      recentlyViewedManagerUnavailable: 'RecentlyViewedManager not available',
      productCardUnavailable: 'ProductCard module not available for search recently viewed products',
      errorInitializingProductCard: 'Error initializing product card functionality for search recently viewed products',
      failedParseTranslations: 'Failed to parse search page translations:',
      triggeringAlphabeticalSorting: 'Triggering alphabetical sorting:'
    };
  }

  initialize() {
    this.setDefaultSort();
    this.initializeSorting();
    this.initializeLayoutSwitching();
    this.initializeFilters();
    this.initializePriceRange();
    this.initializeRecentlyViewed();
    this.initializeProductEvents();
  }

  setDefaultSort() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('sort_by')) {
      url.searchParams.set('sort_by', 'best-selling');
      window.history.replaceState({}, '', url.toString());
      this.updateProductsWithSort('best-selling');
    }
  }

  initializeSorting() {
    const sortItems = document.querySelectorAll('.select-item');
    const sortDropdown = document.querySelector('.tf-dropdown-sort');
    const sortValueDisplay = document.querySelector('.text-sort-value');

    sortItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const sortValue = e.currentTarget.dataset.sortValue;
        this.updateProductsWithSort(sortValue);
        
        // Close dropdown after selection
        if (sortDropdown) {
          const dropdown = bootstrap.Dropdown.getInstance(sortDropdown);
          if (dropdown) {
            dropdown.hide();
          }
        }
      });
    });
  }

  async updateProductsWithSort(sortValue) {
    const url = new URL(window.location.href);
    const existingParams = new URLSearchParams(url.search);
    
    // Reset to page 1 when applying filters or changing sort
    existingParams.delete('page');
    
    // Handle alphabetical sorting on client side
    if (sortValue === 'title-ascending' || sortValue === 'title-descending') {
      console.log(this.translations.triggeringAlphabeticalSorting || 'Triggering alphabetical sorting:', sortValue);
      // Remove sort_by parameter for alphabetical sorting to get unsorted results
      existingParams.delete('sort_by');
      
      try {
        const response = await fetch(url.pathname + '?' + existingParams.toString());
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        this.updateProductLayouts(doc, sortValue);
        this.updateSortDisplay(sortValue);
        this.updateURL(existingParams, sortValue);
        this.initializeProductEvents();
      } catch (error) {
        console.error(this.translations.errorUpdatingProducts, error);
      }
    } else {
      // Handle server-side sorting for other options
      existingParams.set('sort_by', sortValue);
      
      try {
        const response = await fetch(url.pathname + '?' + existingParams.toString());
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        this.updateProductLayouts(doc);
        this.updateSortDisplay(sortValue);
        this.updateURL(existingParams, sortValue);
        this.initializeProductEvents();
      } catch (error) {
        console.error(this.translations.errorUpdatingProducts, error);
      }
    }
  }

  updateProductLayouts(doc, sortValue = null) {
    const productGrid = document.querySelector('.tf-grid-layout');
    const productList = document.querySelector('.tf-list-layout');
    const newGrid = doc.querySelector('.tf-grid-layout');
    const newList = doc.querySelector('.tf-list-layout');
    
    if (newGrid && productGrid) {
      const currentLayoutClass = productGrid.className;
      
      if (sortValue === 'title-ascending' || sortValue === 'title-descending') {
        // Handle client-side sorting
        const allNodes = Array.from(newGrid.childNodes);
        const products = allNodes.filter(node => node.nodeType === 1 && node.classList.contains('card-product'));
        
        products.sort((a, b) => {
          const titleA = a.querySelector('.name-product')?.textContent?.trim() || '';
          const titleB = b.querySelector('.name-product')?.textContent?.trim() || '';
          
          if (sortValue === 'title-ascending') {
            return titleA.localeCompare(titleB);
          } else {
            return titleB.localeCompare(titleA);
          }
        });
        
        productGrid.innerHTML = products.map(p => p.outerHTML).join('\n');
      } else {
        // Server-side sorting
        productGrid.innerHTML = newGrid.innerHTML;
      }
      
      productGrid.className = currentLayoutClass;
    }

    if (newList && productList) {
      if (sortValue === 'title-ascending' || sortValue === 'title-descending') {
        const allNodes = Array.from(newList.childNodes);
        const products = allNodes.filter(node => node.nodeType === 1 && node.classList.contains('card-product'));
        
        products.sort((a, b) => {
          const titleA = a.querySelector('.name-product')?.textContent?.trim() || '';
          const titleB = b.querySelector('.name-product')?.textContent?.trim() || '';
          
          if (sortValue === 'title-ascending') {
            return titleA.localeCompare(titleB);
          } else {
            return titleB.localeCompare(titleA);
          }
        });
        
        productList.innerHTML = products.map(p => p.outerHTML).join('\n');
      } else {
        productList.innerHTML = newList.innerHTML;
      }
    }
  }

  updateSortDisplay(sortValue) {
    const sortValueDisplay = document.querySelector('.text-sort-value');
    const sortItems = document.querySelectorAll('.select-item');
    
    if (sortValueDisplay) {
      const sortItem = document.querySelector(`.select-item[data-sort-value="${sortValue}"]`);
      if (sortItem) {
        sortValueDisplay.textContent = sortItem.querySelector('.text-value-item').textContent.trim();
      } else {
        // Fallback
        sortValueDisplay.textContent = sortValue.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }

    // Update active state
    sortItems.forEach(item => {
      item.classList.toggle('active', item.dataset.sortValue === sortValue);
    });
  }

  updateURL(existingParams, sortValue) {
    const url = new URL(window.location.href);
    existingParams.set('sort_by', sortValue);
    window.history.pushState({}, '', url.pathname + '?' + existingParams.toString());
  }

  initializeLayoutSwitching() {
    const layoutSwitches = document.querySelectorAll('.tf-view-layout-switch');
    const listLayout = document.getElementById('listLayout');
    const gridLayout = document.getElementById('gridLayout');
    const productCountGrid = document.getElementById('product-count-grid');
    const productCountList = document.getElementById('product-count-list');

    layoutSwitches.forEach(switchEl => {
      switchEl.addEventListener('click', (e) => {
        const layout = e.currentTarget.dataset.valueLayout;
        
        // Update active state
        layoutSwitches.forEach(s => s.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Show/hide layouts
        if (listLayout && gridLayout) {
          const hasProducts = gridLayout.querySelector('.card-product');

          listLayout.style.display = layout === 'list' ? 'block' : 'none';
          gridLayout.style.display = layout === 'list' ? 'none' : '';
          
          if (layout !== 'list' && hasProducts) {
            gridLayout.classList.remove('tf-col-2', 'tf-col-3', 'tf-col-4');
            if (!gridLayout.classList.contains('tf-grid-layout')) {
              gridLayout.classList.add('tf-grid-layout');
            }
            gridLayout.classList.add(layout);
          }
          
          // Update product count visibility based on layout
          if (productCountGrid) {
            productCountGrid.style.display = layout === 'list' ? 'none' : 'block';
          }
          if (productCountList) {
            productCountList.style.display = layout === 'list' ? 'block' : 'none';
          }
        }
      });
    });
  }

  initializeFilters() {
    this.initializeFilterTags();
    this.initializeClearAllFilters();
    this.initializeAvailabilityFilter();
    this.initializeBrandFilter();
  }

  initializeFilterTags() {
    const filterTags = document.querySelectorAll('.filter-tag');
    filterTags.forEach(tag => {
      tag.addEventListener('click', (e) => {
        const tagText = e.currentTarget.textContent.trim();
        const url = new URL(window.location.href);
        const tags = url.searchParams.get('filter.v.tag')?.split(',') || [];
        const newTags = tags.filter(t => t !== tagText);
        
        if (newTags.length > 0) {
          url.searchParams.set('filter.v.tag', newTags.join(','));
        } else {
          url.searchParams.delete('filter.v.tag');
        }
        
        // Reset to page 1 when applying filters
        url.searchParams.delete('page');
        
        this.updateProductsWithSort(url.searchParams.get('sort_by') || 'best-selling');
      });
    });
  }

  initializeClearAllFilters() {
    const clearAllBtn = document.getElementById('remove-all');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', (e) => {
        const url = new URL(window.location.href);
        // Remove all filter parameters
        for (const param of url.searchParams.keys()) {
          if (param.startsWith('filter.v.')) {
            url.searchParams.delete(param);
          }
        }
        
        // Reset to page 1 when applying filters
        url.searchParams.delete('page');
        
        this.updateProductsWithSort(url.searchParams.get('sort_by') || 'best-selling');
      });
    }
  }

  initializeAvailabilityFilter() {
    const availabilityInputs = document.querySelectorAll('input[name="availability"]');
    availabilityInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const url = new URL(window.location.href);
        if (e.currentTarget.checked) {
          const value = e.currentTarget.id === 'inStock' ? '1' : '0';
          url.searchParams.set('filter.v.availability', value);
        } else {
          url.searchParams.delete('filter.v.availability');
        }

        // Reset to page 1 when applying filters
        url.searchParams.delete('page');

        // Update URL first
        window.history.pushState({}, '', url.toString());
        
        // Use updateProductsWithSort to maintain current sort order
        const currentSort = url.searchParams.get('sort_by') || 'best-selling';
        this.updateProductsWithSort(currentSort);
      });
    });
  }

  initializeBrandFilter() {
    const brandInputs = document.querySelectorAll('input[name="brand"]');
    brandInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const url = new URL(window.location.href);
        if (e.currentTarget.checked) {
          url.searchParams.set('filter.v.option.brand', e.currentTarget.id);
        } else {
          url.searchParams.delete('filter.v.option.brand');
        }

        // Reset to page 1 when applying filters
        url.searchParams.delete('page');

        // Update URL first
        window.history.pushState({}, '', url.toString());
        
        // Use updateProductsWithSort to maintain current sort order
        const currentSort = url.searchParams.get('sort_by') || 'best-selling';
        this.updateProductsWithSort(currentSort);
      });
    });
  }

  initializePriceRange() {
    const priceRange = document.getElementById('price-value-range');
    if (priceRange && typeof noUiSlider !== 'undefined') {
      const minPrice = parseInt(priceRange.dataset.min);
      const maxPrice = parseInt(priceRange.dataset.max);
      
      noUiSlider.create(priceRange, {
        start: [minPrice, maxPrice],
        connect: true,
        range: {
          'min': 0,
          'max': 500
        }
      });

      const minValue = document.getElementById('price-min-value');
      const maxValue = document.getElementById('price-max-value');
      const currency = minValue.dataset.currency;

      priceRange.noUiSlider.on('update', (values) => {
        minValue.textContent = currency + Math.round(values[0]);
        maxValue.textContent = currency + Math.round(values[1]);
      });

      // Handle price range changes
      priceRange.noUiSlider.on('change', (values) => {
        const url = new URL(window.location.href);
        url.searchParams.set('filter.v.price.gte', Math.round(values[0]));
        url.searchParams.set('filter.v.price.lte', Math.round(values[1]));
        
        // Reset to page 1 when applying filters
        url.searchParams.delete('page');
        
        this.updateProductsWithSort(url.searchParams.get('sort_by') || 'best-selling');
      });
    }
  }

  initializeRecentlyViewed() {
    const searchSection = document.getElementById('search-recently-viewed-section');
    const searchProductsContainer = document.getElementById('search-recently-viewed-products');
    
    if (!searchSection || !searchProductsContainer) return;
    
    // Track if products have been rendered to prevent unnecessary re-renders
    let productsRendered = false;
    
    const renderRecentlyViewedProducts = async (force = false) => {
      if (typeof window.RecentlyViewedManager === 'undefined') {
        console.warn(this.translations.recentlyViewedManagerUnavailable);
        return;
      }
      
      // Get recently viewed products (no current product to exclude on search page)
      const recentlyViewed = window.RecentlyViewedManager.getProducts().slice(0, 8);
      
      if (recentlyViewed.length === 0) {
        searchSection.style.display = 'none';
        return;
      }
      
      // Show the section
      searchSection.style.display = 'block';
      
      // If products are already rendered and we're not forcing a re-render, skip
      if (productsRendered && !force && searchProductsContainer.children.length > 0) {
        return;
      }
      
      // Clear existing products
      searchProductsContainer.innerHTML = '';
      
      // Fetch full product data for each recently viewed product
      const productPromises = recentlyViewed.map(async (product) => {
        try {
          const response = await fetch(`/products/${product.handle}.js`);
          if (!response.ok) throw new Error('Failed to fetch product data');
          return await response.json();
        } catch (error) {
          console.error(this.translations.errorFetchingProduct, product.handle, error);
          // Return the basic product data if fetch fails
          return product;
        }
      });
      
      const fullProductData = await Promise.all(productPromises);
      
      // Render each product using the card-product snippet structure
      fullProductData.forEach((product) => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        
        // Create product card HTML using the translation function
        slide.innerHTML = this.createProductCardHTML(product);
        
        searchProductsContainer.appendChild(slide);
      });
      
      // Initialize product card functionality for the newly added products
      if (typeof ProductCard !== 'undefined') {
        try {
          ProductCard.initializeForDynamicProducts(searchProductsContainer);
        } catch (error) {
          console.warn(this.translations.errorInitializingProductCard, error);
        }
      } else {
        console.warn(this.translations.productCardUnavailable);
      }
      
      // Mark products as rendered
      productsRendered = true;
    };
    
    // Initial render
    renderRecentlyViewedProducts();
    
    // Listen for updates to recently viewed products
    window.addEventListener('recentlyViewedUpdated', () => {
      renderRecentlyViewedProducts(true); // Force re-render when recently viewed products change
    });
    
    // Only render once when section becomes visible (for initial lazy loading)
    let hasInitiallyRendered = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasInitiallyRendered) {
          renderRecentlyViewedProducts();
          hasInitiallyRendered = true;
          // Disconnect observer after first render to prevent future re-renders
          observer.disconnect();
        }
      });
    });
    
    observer.observe(searchSection);
  }

  createProductCardHTML(product) {
    return `
      <div class="card-product style-1" data-availability="${product.available ? this.translations.inStock : this.translations.outOfStock}" data-brand="${product.vendor || ''}">
        <div class="card-product-wrapper asp-ratio-1">
          <a href="${product.url}" class="product-img">
            ${product.featured_image ? 
              `<img class="img-product lazyloaded" src="${product.featured_image}" alt="${product.title}" loading="lazy">` :
              `<div class="placeholder-svg">${product.title}</div>`
            }
            ${product.images && product.images[1] ? 
              `<img class="img-hover lazyloaded" src="${product.images[1]}" alt="${product.title}" loading="lazy">` : ''
            }
          </a>
          
          ${product.compare_at_price && product.compare_at_price > product.price ? 
            `<div class="on-sale-wrap">
              <span class="on-sale-item">${Math.round((product.compare_at_price - product.price) / product.compare_at_price * 100)}% ${this.translations.off}</span>
            </div>` : ''
          }
          
          ${product.available ? `
          <ul class="list-product-btn">
            <li>
              <a href="#" 
                 class="box-icon hover-tooltip tooltip-left add-to-cart" 
                 data-variant-id="${product.variants ? product.variants[0].id : product.id}"
                 data-quantity="1"
                 aria-label="${this.translations.addToCart}">
                <i class="icon icon-cart" aria-hidden="true"></i>
                <span class="tooltip" aria-hidden="true">${this.translations.addToCart}</span>
              </a>
            </li>
            <li class="wishlist">
              <a href="#" 
                 class="box-icon hover-tooltip tooltip-left" 
                 data-wishlist 
                 data-id="${product.id}" 
                 data-action="add"
                 aria-label="${this.translations.addToWishlist}">
                <span class="icon icon-heart2" aria-hidden="true"></span>
                <span class="tooltip" aria-hidden="true">${this.translations.addToWishlist}</span>
              </a>
            </li>
            <li>
              <a href="#" 
                 class="box-icon hover-tooltip tooltip-left quickview" 
                 data-product-handle="${product.handle}"
                 data-product-id="${product.id}"
                 data-bs-toggle="modal" 
                 data-bs-target="#quickView"
                 aria-label="${this.translations.quickView}"
                 aria-expanded="false">
                <span class="icon icon-view" aria-hidden="true"></span>
                <span class="tooltip" aria-hidden="true">${this.translations.quickView}</span>
              </a>
            </li>
            <li class="compare">
              <a href="#" 
                 class="box-icon hover-tooltip tooltip-left" 
                 data-compare 
                 data-id="${product.id}" 
                 data-action="add"
                 aria-label="${this.translations.addToCompare}">
                <span class="icon icon-compare" aria-hidden="true"></span>
                <span class="tooltip" aria-hidden="true">${this.translations.addToCompare}</span>
              </a>
            </li>
          </ul>
          ` : ''}
        </div>
        
        <div class="card-product-info">
          <a href="${product.url}" class="name-product link fw-medium text-md">${product.title}</a>
          <p class="price-wrap fw-medium">
            ${product.compare_at_price && product.compare_at_price > product.price ? 
              `<span class="price-new text-primary">${this.formatMoney(product.price)}</span>
               <span class="price-old">${this.formatMoney(product.compare_at_price)}</span>` :
              `<span class="price-new">${this.formatMoney(product.price)}</span>`
            }
          </p>
        </div>
      </div>
    `;
  }

  formatMoney(cents) {
    if (typeof cents !== 'number') return '';
    
    // Try to use Shopify's money format if available
    if (typeof window.Shopify !== 'undefined' && window.Shopify.formatMoney) {
      return window.Shopify.formatMoney(cents);
    }
    
    // Fallback to basic formatting
    const dollars = cents / 100;
    return '$' + dollars.toFixed(2);
  }

  initializeProductEvents() {
    // Add any product-specific event listeners here
    // For example, quick view, add to cart, etc.
  }
}

// Initialize SearchPage when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  new SearchPage();
}); 
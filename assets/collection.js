// Add CSS styles for no products found message and loading spinner
const noProductsStyles = `
  <style>
    .no-products-found {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
      width: 100%;
      padding: 40px 20px;
    }
    
    .no-products-content {
      text-align: center;
      max-width: 500px;
    }
    
    .no-products-icon {
      margin-bottom: 24px;
      color: #6b7280;
    }
    
    .no-products-icon svg {
      width: 64px;
      height: 64px;
    }
    
    .no-products-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #1f2937;
    }
    
    .no-products-description {
      font-size: 16px;
      line-height: 1.5;
      color: #6b7280;
      margin-bottom: 32px;
    }
    
    .no-products-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .no-products-actions .tf-btn {
      min-width: 140px;
    }
    
    /* Loading spinner styles */
    .filter-loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    
    .filter-loading-overlay.show {
      opacity: 1;
      visibility: visible;
    }
    
    .filter-loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .filter-loading-spinner .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @media (max-width: 768px) {
      .no-products-found {
        min-height: 300px;
        padding: 20px;
      }
      
      .no-products-title {
        font-size: 20px;
      }
      
      .no-products-description {
        font-size: 14px;
      }
      
      .no-products-actions {
        flex-direction: column;
        align-items: center;
      }
      
      .no-products-actions .tf-btn {
        width: 100%;
        max-width: 200px;
      }
      
      .filter-loading-spinner .spinner {
        width: 32px;
        height: 32px;
      }
    }
  </style>
`;

// Inject styles into head when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Inject styles
  document.head.insertAdjacentHTML('beforeend', noProductsStyles);

  // Add loading overlay to body
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'filter-loading-overlay';
  loadingOverlay.innerHTML = `
    <div class="filter-loading-spinner">
      <div class="spinner"></div>
    </div>
  `;
  document.body.appendChild(loadingOverlay);

  // Global variables for state management
  let isLoading = false;
  let currentPage = 1;
  let currentSort = document.querySelector('.tf-dropdown-sort')?.dataset.defaultSort || 'best-selling';
  let currentFilters = new URLSearchParams(window.location.search);
  
  // Cache DOM elements
  const productGrid = document.querySelector('.tf-grid-layout');
  const productList = document.querySelector('.tf-list-layout');
  const sortDropdown = document.querySelector('.tf-dropdown-sort');
  const sortValueDisplay = document.querySelector('.text-sort-value');
  const filterForm = document.getElementById('collection-filters-form');
  const appliedFiltersContainer = document.getElementById('applied-filters');
  const productCountGrid = document.getElementById('product-count-grid');
  const productCountList = document.getElementById('product-count-list');
  const metaFilterShop = document.querySelector('.meta-filter-shop');

  // Function to show loading spinner
  function showFilterLoading() {
    const overlay = document.querySelector('.filter-loading-overlay');
    if (overlay) {
      overlay.classList.add('show');
    }
  }

  // Function to hide loading spinner
  function hideFilterLoading() {
    const overlay = document.querySelector('.filter-loading-overlay');
    if (overlay) {
      overlay.classList.remove('show');
    }
  }

  // Initialize everything
  function initializeAll() {
    // Hide any existing loading spinner on page load
    hideFilterLoading();
    
    // Initialize price range slider first
    initializePriceRangeSlider();
    
    // Initialize filter state with a small delay to ensure Liquid-rendered filters are present
    setTimeout(() => {
      initializeFilterState();
    }, 50);
    
    // Initialize product events
    initializeProductEvents();
    
    // Initialize infinite scroll with a delay to ensure DOM is ready
    setTimeout(() => {
      initializeInfiniteScroll();
    }, 200);
    
    // Update availability counts after products are loaded
    setTimeout(() => {
      updateAvailabilityCounts().catch(console.error);
    }, 300);
  }

  // Start initialization
  initializeAll();

  // Initialize price range slider
  function initializePriceRangeSlider() {
    // Check for all possible price range sliders
    const priceRangeDrawer = document.getElementById('price-value-range-drawer');
    const priceRangeSidebar = document.getElementById('price-value-range-sidebar');
    const priceRangeHorizontal = document.getElementById('price-value-range-horizontal');
    
    // Initialize drawer price range slider
    if (priceRangeDrawer && !priceRangeDrawer.noUiSlider) {
      initializeSinglePriceSlider(priceRangeDrawer, 'price-min-value-drawer', 'price-max-value-drawer', 'price-min-input', 'price-max-input');
    }
    
    // Initialize sidebar price range slider
    if (priceRangeSidebar && !priceRangeSidebar.noUiSlider) {
      initializeSinglePriceSlider(priceRangeSidebar, 'price-min-value-sidebar', 'price-max-value-sidebar', 'price-min-input', 'price-max-input');
    }
    
    // Initialize horizontal price range slider
    if (priceRangeHorizontal && !priceRangeHorizontal.noUiSlider) {
      initializeSinglePriceSlider(priceRangeHorizontal, 'price-min-value-horizontal', 'price-max-value-horizontal', 'price-min-input-horizontal', 'price-max-input-horizontal');
    }
  }

  // Helper function to initialize a single price slider
  function initializeSinglePriceSlider(priceRange, minValueId, maxValueId, minInputId, maxInputId) {
    // Check if noUiSlider is available
    if (typeof noUiSlider === 'undefined') {
      console.warn('noUiSlider not available, retrying in 500ms...');
      setTimeout(() => initializePriceRangeSlider(), 500);
      return;
    }

    const minValue = document.getElementById(minValueId);
    const maxValue = document.getElementById(maxValueId);
    const minInput = document.getElementById(minInputId);
    const maxInput = document.getElementById(maxInputId);
    
    if (!minValue || !maxValue) return;

    const currency = minValue.dataset.currency || '$';
    const rangeMin = parseInt(priceRange.dataset.rangeMin) || 0;
    const rangeMax = parseInt(priceRange.dataset.rangeMax) || 1000;
    const currentMin = parseInt(priceRange.dataset.min) || rangeMin;
    const currentMax = parseInt(priceRange.dataset.max) || rangeMax;

    try {
      noUiSlider.create(priceRange, {
        start: [currentMin, currentMax],
        connect: true,
        range: {
          'min': rangeMin,
          'max': rangeMax
        },
        step: 1
      });

      // Update display values
      priceRange.noUiSlider.on('update', function(values) {
        if (minValue) minValue.textContent = currency + Math.round(values[0]);
        if (maxValue) maxValue.textContent = currency + Math.round(values[1]);
        if (minInput) minInput.value = Math.round(values[0]);
        if (maxInput) maxInput.value = Math.round(values[1]);
      });

      // Handle change event
      priceRange.noUiSlider.on('change', function(values) {
        const minVal = Math.round(values[0]);
        const maxVal = Math.round(values[1]);
        const rangeMin = parseInt(priceRange.dataset.rangeMin) || 0;
        const rangeMax = parseInt(priceRange.dataset.rangeMax) || 1000;
        
        // Get or create the hidden inputs
        let currentMinInput = document.getElementById(minInputId);
        let currentMaxInput = document.getElementById(maxInputId);
        
        // Only add price filter if it's different from the full range
        if (minVal > rangeMin || maxVal < rangeMax) {
          // Create the hidden inputs if they don't exist
          if (!currentMinInput) {
            currentMinInput = document.createElement('input');
            currentMinInput.type = 'hidden';
            currentMinInput.name = 'filter.v.price.gte';
            currentMinInput.id = minInputId;
            priceRange.closest('.widget-price').appendChild(currentMinInput);
          }
          if (!currentMaxInput) {
            currentMaxInput = document.createElement('input');
            currentMaxInput.type = 'hidden';
            currentMaxInput.name = 'filter.v.price.lte';
            currentMaxInput.id = maxInputId;
            priceRange.closest('.widget-price').appendChild(currentMaxInput);
          }
          
          // Update the values
          currentMinInput.value = minVal;
          currentMaxInput.value = maxVal;
        } else {
          // Remove the inputs if they exist (back to full range)
          if (currentMinInput) currentMinInput.remove();
          if (currentMaxInput) currentMaxInput.remove();
        }
        
        // Submit the form
        const form = document.getElementById('collection-filters-form') || 
                    document.getElementById('collection-filters-form-sidebar') || 
                    document.getElementById('collection-filters-form-drawer');
        if (form) {
          form.submit();
        }
      });

    } catch (error) {
      console.error('Error initializing price range slider:', error);
    }
  }

  // Initialize filter state from URL parameters
  function initializeFilterState() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Debug: Log URL parameters
    console.log('Initializing filter state with URL params:', urlParams.toString());
    
    // Set checkboxes based on URL parameters
    const checkboxes = document.querySelectorAll('.filter-checkbox');
    checkboxes.forEach(checkbox => {
      const paramName = checkbox.name;
      const paramValue = checkbox.value;
      
      if (urlParams.has(paramName)) {
        const urlValue = urlParams.get(paramName);
        if (urlValue === paramValue || urlValue.includes(paramValue)) {
          checkbox.checked = true;
          console.log('Checked checkbox:', paramName, paramValue);
        }
      }
    });

    // Set color and size filter states
    const colorFilters = urlParams.getAll('filter.v.option.color');
    const sizeFilters = urlParams.getAll('filter.v.option.size');
    
    // Initialize color filters
    colorFilters.forEach(color => {
      const decodedColor = decodeURIComponent(color);
      let colorItem = document.querySelector(`[data-color="${color}"]`) || 
                     document.querySelector(`[data-color="${decodedColor}"]`);
      
      if (!colorItem) {
        const checkbox = document.querySelector(`input[name="filter.v.option.color"][value="${color}"]`) ||
                        document.querySelector(`input[name="filter.v.option.color"][value="${decodedColor}"]`);
        if (checkbox) {
          colorItem = checkbox.closest('.color-check');
        }
      }
      
      if (!colorItem) {
        const colorItems = document.querySelectorAll('.color-check');
        colorItems.forEach(item => {
          const colorText = item.querySelector('.color-text');
          if (colorText && (colorText.textContent.trim() === color || colorText.textContent.trim() === decodedColor)) {
            colorItem = item;
          }
        });
      }
      
      if (colorItem) {
        const checkbox = colorItem.querySelector('.filter-checkbox');
        if (checkbox) {
          checkbox.checked = true;
          colorItem.classList.add('active');
        }
      }
    });
    
    // Initialize size filters
    sizeFilters.forEach(size => {
      const decodedSize = decodeURIComponent(size);
      let sizeItem = document.querySelector(`[data-size="${size}"]`) || 
                     document.querySelector(`[data-size="${decodedSize}"]`);
      
      if (!sizeItem) {
        const checkbox = document.querySelector(`input[name="filter.v.option.size"][value="${size}"]`) ||
                        document.querySelector(`input[name="filter.v.option.size"][value="${decodedSize}"]`);
        if (checkbox) {
          sizeItem = checkbox.closest('.size-check');
        }
      }
      
      if (!sizeItem) {
        const sizeItems = document.querySelectorAll('.size-check');
        sizeItems.forEach(item => {
          const sizeText = item.querySelector('.size');
          if (sizeText && (sizeText.textContent.trim() === size || sizeText.textContent.trim() === decodedSize)) {
            sizeItem = item;
          }
        });
      }
      
      if (sizeItem) {
        const checkbox = sizeItem.querySelector('.filter-checkbox');
        if (checkbox) {
          checkbox.checked = true;
          sizeItem.classList.add('active');
        }
      }
    });

    // Set price range if exists
    const minPrice = urlParams.get('filter.v.price.gte');
    const maxPrice = urlParams.get('filter.v.price.lte');
    
    if (minPrice && maxPrice) {
      const priceRanges = [
        document.getElementById('price-value-range-drawer'),
        document.getElementById('price-value-range-sidebar'),
        document.getElementById('price-value-range-horizontal')
      ];
      
      priceRanges.forEach(priceRange => {
        if (priceRange && priceRange.noUiSlider) {
          priceRange.noUiSlider.set([parseInt(minPrice), parseInt(maxPrice)]);
        }
      });
    }

    // Update applied filters display
    updateAppliedFiltersDisplay();
    
    // Show meta-filter-shop if there are URL parameters
    if (urlParams.toString().length > 0 && metaFilterShop) {
      metaFilterShop.style.display = 'flex';
    }
  }

  // Update applied filters display
  function updateAppliedFiltersDisplay() {
    if (!appliedFiltersContainer) return;
    
    // Check if applied filters were already rendered by Liquid
    const existingFilters = appliedFiltersContainer.querySelectorAll('.filter-tag');
    const hasLiquidRenderedFilters = existingFilters.length > 0;
    
    if (!hasLiquidRenderedFilters) {
      appliedFiltersContainer.innerHTML = '';
      const urlParams = new URLSearchParams(window.location.search);
      const appliedFilters = [];

      // Process availability filters
      const availability = urlParams.get('filter.v.availability');
      if (availability) {
        appliedFilters.push({
          type: 'availability',
          label: `Availability: ${availability === '1' ? 'In stock' : 'Out of stock'}`,
          param: 'filter.v.availability',
          value: availability
        });
      }

      // Process color filters
      urlParams.getAll('filter.v.option.color').forEach(color => {
        const colorItem = document.querySelector(`[data-color="${color}"]`);
        const colorText = colorItem?.querySelector('.color-text')?.textContent || color;
        appliedFilters.push({
          type: 'filter.v.option.color',
          label: `Color: ${colorText}`,
          param: 'filter.v.option.color',
          value: color
        });
      });

      // Process size filters
      urlParams.getAll('filter.v.option.size').forEach(size => {
        const sizeItem = document.querySelector(`[data-size="${size}"]`);
        const sizeText = sizeItem?.querySelector('.size')?.textContent || size;
        appliedFilters.push({
          type: 'filter.v.option.size',
          label: `Size: ${sizeText}`,
          param: 'filter.v.option.size',
          value: size
        });
      });

      // Process price range
      const minPrice = urlParams.get('filter.v.price.gte');
      const maxPrice = urlParams.get('filter.v.price.lte');
      if (minPrice && maxPrice) {
        const currency = document.querySelector('#price-min-value')?.dataset.currency || '$';
        appliedFilters.push({
          type: 'price',
          label: `Price: ${currency}${minPrice} - ${currency}${maxPrice}`,
          param: 'price',
          value: `${minPrice}-${maxPrice}`
        });
      }

      // Render applied filters
      appliedFilters.forEach(filter => {
        const filterTag = document.createElement('span');
        filterTag.className = 'filter-tag';
        filterTag.innerHTML = `
          <i class="icon icon-close" data-filter-type="${filter.type}" data-param="${filter.param}" data-value="${filter.value}"></i>
          ${filter.label}
        `;
        appliedFiltersContainer.appendChild(filterTag);
      });
    }

    // Show/hide clear all button based on filter count
    const totalFilters = appliedFiltersContainer.querySelectorAll('.filter-tag').length;
    const clearAllBtn = document.getElementById('remove-all');
    if (clearAllBtn) {
      clearAllBtn.style.display = totalFilters > 0 ? 'block' : 'none';
    }
    
    // Show/hide meta-filter-shop container
    if (metaFilterShop) {
      metaFilterShop.style.display = totalFilters > 0 ? 'flex' : 'none';
    }
  }

  // Main function to update products with filters and sort
  async function updateProducts(filters = null, sort = null, page = 1, skipFilterDisplayUpdate = false) {
    if (isLoading) return;
    isLoading = true;

    try {
      // Show loading state
      if (productGrid) {
        productGrid.style.opacity = '1';
        productGrid.style.pointerEvents = 'none';
      }
      if (productList) {
        productList.style.opacity = '1';
        productList.style.pointerEvents = 'none';
      }
      showFilterLoading();

      const url = new URL(window.location.href);
      
      // Update filters
      if (filters) {
        // Clear existing filter parameters
        for (const param of url.searchParams.keys()) {
          if (param.startsWith('filter.v.')) {
            url.searchParams.delete(param);
          }
        }
        
        // Add new filter parameters
        for (const [key, value] of Object.entries(filters)) {
          if (value !== null && value !== undefined && value !== '') {
            url.searchParams.set(key, value);
          }
        }
      }

      // Update sort
      if (sort) {
        url.searchParams.set('sort_by', sort);
        currentSort = sort;
      }

      // Update page
      if (page > 1) {
        url.searchParams.set('page', page);
      } else {
        url.searchParams.delete('page');
      }

      // Fetch updated content
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Network response was not ok');
      
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Update product grids
      const newGrid = doc.querySelector('.tf-grid-layout');
      const newList = doc.querySelector('.tf-list-layout');
      
      if (newGrid && productGrid) {
        if (page > 1) {
          // Append for pagination
          const loadMoreContainer = productGrid.querySelector('.wd-load');
          if (loadMoreContainer) {
            const newProducts = newGrid.querySelectorAll('.loadItem');
            newProducts.forEach(product => {
              productGrid.insertBefore(product, loadMoreContainer);
            });
          }
        } else {
          // Replace for filtering/sorting
          productGrid.innerHTML = newGrid.innerHTML;
        }
      }
      
      if (newList && productList) {
        if (page > 1) {
          // Append for pagination
          const loadMoreContainer = productList.querySelector('.wd-load');
          if (loadMoreContainer) {
            const newProducts = newList.querySelectorAll('.loadItem');
            newProducts.forEach(product => {
              productList.insertBefore(product, loadMoreContainer);
            });
          }
        } else {
          // Replace for filtering/sorting
          productList.innerHTML = newList.innerHTML;
        }
      }

      // Check for no products and show message if needed
      const gridProducts = productGrid ? productGrid.querySelectorAll('.loadItem') : [];
      const listProducts = productList ? productList.querySelectorAll('.loadItem') : [];
      
      if (gridProducts.length === 0 && listProducts.length === 0 && page === 1) {
        const noProductsHTML = `
          <div class="no-products-found">
            <div class="no-products-content">
              <div class="no-products-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9.5 8.96997C9.5 8.96997 10.5 8.96997 11.5 9.96997C12.5 10.97 12.5 12.97 12.5 12.97" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14.5 8.96997C14.5 8.96997 13.5 8.96997 12.5 9.96997C11.5 10.97 11.5 12.97 11.5 12.97" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9.5 15.03C9.5 15.03 10.5 15.03 11.5 16.03C12.5 17.03 12.5 19.03 12.5 19.03" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14.5 15.03C14.5 15.03 13.5 15.03 12.5 16.03C11.5 17.03 11.5 19.03 11.5 19.03" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h3 class="no-products-title">No products found</h3>
              <p class="no-products-description">We couldn't find any products matching your criteria. Try adjusting your filters or browse our other collections.</p>
              <div class="no-products-actions">
                <a href="/collections" class="tf-btn btn-out-line-dark2">Browse all collections</a>
              </div>
            </div>
          </div>
        `;
        
        if (productGrid) {
          productGrid.innerHTML = noProductsHTML;
          productGrid.className = 'wrapper-shop';
        }
        if (productList) {
          productList.innerHTML = noProductsHTML;
        }
        
        // Hide shop controls
        const shopControl = document.querySelector('.tf-shop-control');
        const metaFilterShop = document.querySelector('.meta-filter-shop');
        if (shopControl) shopControl.style.display = 'none';
        if (metaFilterShop) metaFilterShop.style.display = 'none';
      } else {
        // Show shop controls
        const shopControl = document.querySelector('.tf-shop-control');
        const metaFilterShop = document.querySelector('.meta-filter-shop');
        if (shopControl) shopControl.style.display = '';
        if (metaFilterShop) metaFilterShop.style.display = '';
        
        // Restore grid layout classes
        if (productGrid && !productGrid.classList.contains('tf-grid-layout')) {
          const defaultColumns = productGrid.dataset.defaultColumns || '4';
          productGrid.className = `wrapper-shop tf-grid-layout tf-col-${defaultColumns}`;
        }
      }

      // Update URL without reload for non-infinite scroll or first page
      const currentPaginationType = document.querySelector('.wrapper-control-shop')?.dataset.paginationType;
      if (currentPaginationType !== 'infinite_scroll' || page === 1) {
        window.history.pushState({}, '', url.toString());
      }
      
      // Update current filters
      currentFilters = new URLSearchParams(url.search);
      
      // Update applied filters display
      if (!skipFilterDisplayUpdate) {
        updateAppliedFiltersDisplay();
      }
      
      // Update sort display
      if (sortValueDisplay && sort) {
        sortValueDisplay.textContent = sort.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }

      // Reinitialize event listeners and update counts
      initializeProductEvents();
      updateAvailabilityCounts().catch(console.error);
      ensurePaginationVisibility();

    } catch (error) {
      console.error('Error updating products:', error);
      const errorMessage = document.createElement('div');
      errorMessage.className = 'alert alert-danger';
      errorMessage.textContent = 'An error occurred while updating the products. Please try again.';
      errorMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 300px;
      `;
      document.body.appendChild(errorMessage);
      setTimeout(() => errorMessage.remove(), 5000);
    } finally {
      isLoading = false;
      if (productGrid) {
        productGrid.style.opacity = '1';
        productGrid.style.pointerEvents = 'auto';
      }
      if (productList) {
        productList.style.opacity = '1';
        productList.style.pointerEvents = 'auto';
      }
      hideFilterLoading();
    }
  }

  // Event Handlers
  
  // Handle sort selection
  const sortItems = document.querySelectorAll('.select-item');
  sortItems.forEach(item => {
    item.addEventListener('click', function() {
      const sortValue = this.dataset.sortValue;
      sortItems.forEach(s => s.classList.remove('active'));
      this.classList.add('active');
      updateProducts(null, sortValue);
      if (sortDropdown) {
        const dropdown = bootstrap.Dropdown.getInstance(sortDropdown);
        if (dropdown) dropdown.hide();
      }
    });
  });

  // Handle layout switching
  const layoutSwitches = document.querySelectorAll('.tf-view-layout-switch');
  const listLayout = document.getElementById('listLayout');
  const gridLayout = document.getElementById('gridLayout');

  layoutSwitches.forEach(switchEl => {
    switchEl.addEventListener('click', function() {
      const layout = this.dataset.valueLayout;
      layoutSwitches.forEach(s => s.classList.remove('active'));
      this.classList.add('active');

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
        
        // Update product count visibility
        const hasFilters = new URLSearchParams(window.location.search).toString().includes('filter.v');
        if (productCountGrid) {
          productCountGrid.style.display = (layout !== 'list' && hasFilters) ? 'block' : 'none';
        }
        if (productCountList) {
          productCountList.style.display = (layout === 'list' && hasFilters) ? 'block' : 'none';
        }
      }
    });
  });

  // Handle filter checkbox changes
  const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
  filterCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      if (this.name === 'filter.v.availability') {
        const availabilityCheckboxes = document.querySelectorAll('input[name="filter.v.availability"]');
        availabilityCheckboxes.forEach(cb => {
          if (cb !== this) cb.checked = false;
        });
      }
      
      const form = document.getElementById('collection-filters-form') || 
                  document.getElementById('collection-filters-form-sidebar') || 
                  document.getElementById('collection-filters-form-drawer');
      if (form) form.submit();
    });
  });

  // Handle color and size filter clicks
  document.addEventListener('click', function(e) {
    const colorItem = e.target.closest('.color-check');
    const sizeItem = e.target.closest('.size-check');
    
    if (colorItem || sizeItem) {
      const item = colorItem || sizeItem;
      const checkbox = item.querySelector('.filter-checkbox');
      
      checkbox.checked = !checkbox.checked;
      item.classList.toggle('active', checkbox.checked);
      
      const form = document.getElementById('collection-filters-form') || 
                  document.getElementById('collection-filters-form-sidebar') || 
                  document.getElementById('collection-filters-form-drawer');
      if (form) form.submit();
    }
  });

  // Handle reset price button
  document.querySelectorAll('.reset-price').forEach(resetPriceBtn => {
    resetPriceBtn.addEventListener('click', function() {
      const priceRange = this.closest('.widget-price').querySelector('.price-val-range');
      if (priceRange && priceRange.noUiSlider) {
        const minPrice = parseInt(priceRange.dataset.rangeMin);
        const maxPrice = parseInt(priceRange.dataset.rangeMax);
        
        priceRange.noUiSlider.set([minPrice, maxPrice]);
        
        const minInput = this.closest('.widget-price').querySelector('input[name="filter.v.price.gte"]');
        const maxInput = this.closest('.widget-price').querySelector('input[name="filter.v.price.lte"]');
        
        if (minInput) minInput.remove();
        if (maxInput) maxInput.remove();
        
        const horizontalMinInput = document.getElementById('price-min-input-horizontal');
        const horizontalMaxInput = document.getElementById('price-max-input-horizontal');
        if (horizontalMinInput) horizontalMinInput.remove();
        if (horizontalMaxInput) horizontalMaxInput.remove();
        
        const form = document.getElementById('collection-filters-form') || 
                    document.getElementById('collection-filters-form-sidebar') || 
                    document.getElementById('collection-filters-form-drawer');
        if (form) form.submit();
      }
    });
  });

  // Handle filter tag removal
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('icon-close') || e.target.closest('.icon-close')) {
      const closeIcon = e.target.classList.contains('icon-close') ? e.target : e.target.closest('.icon-close');
      const filterTag = closeIcon.closest('.filter-tag');
      
      if (filterTag) {
        const filterType = closeIcon.dataset.filterType;
        const filterParam = closeIcon.dataset.param;
        const filterValue = closeIcon.dataset.value;
        
        showFilterLoading();
        filterTag.remove();
        
        const url = new URL(window.location.href);
        
        if (filterType === 'availability') {
          url.searchParams.delete('filter.v.availability');
        } else if (filterType === 'price') {
          url.searchParams.delete('filter.v.price.gte');
          url.searchParams.delete('filter.v.price.lte');
        } else {
          url.searchParams.delete(filterParam);
        }
        
        window.location.href = url.toString();
      }
    }
  });

  // Handle clear all filters
  const clearAllBtn = document.getElementById('remove-all');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showFilterLoading();

      const url = new URL(window.location.href);
      for (const param of url.searchParams.keys()) {
        if (param.startsWith('filter.v.')) {
          url.searchParams.delete(param);
        }
      }

      window.location.href = url.toString();
    });
  }

  // Initialize infinite scroll if enabled
  function initializeInfiniteScroll() {
    const scrollPaginationType = document.querySelector('.wrapper-control-shop')?.dataset.paginationType;
    if (scrollPaginationType !== 'infinite_scroll') return;

    // Remove filter loading spinner when infinite scroll is active
    const filterLoadingOverlay = document.querySelector('.filter-loading-overlay');
    if (filterLoadingOverlay) {
      filterLoadingOverlay.remove();
    }

    if (window.infiniteScrollObserver) {
      window.infiniteScrollObserver.disconnect();
    }

    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0.1
    };

    window.infiniteScrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isLoading) {
          const layout = listLayout && listLayout.style.display === 'block' ? 'list' : 'grid';
          loadMoreProducts(layout);
        }
      });
    }, options);

    let sentinelElement = document.getElementById('infiniteScrollLoader');
    if (!sentinelElement) {
      sentinelElement = document.createElement('div');
      sentinelElement.id = 'infiniteScrollLoader';
      sentinelElement.style.height = '20px';
      sentinelElement.style.width = '100%';
      sentinelElement.style.display = 'block';
      
      const targetLayout = listLayout && listLayout.style.display === 'block' ? listLayout : gridLayout;
      if (targetLayout) {
        targetLayout.appendChild(sentinelElement);
      }
    }

    if (sentinelElement) {
      window.infiniteScrollObserver.observe(sentinelElement);
    }
  }

  // Handle load more functionality
  async function loadMoreProducts(layout) {
    if (isLoading) return;
    
    // Remove filter loading spinner when using load more
    const filterLoadingOverlay = document.querySelector('.filter-loading-overlay');
    if (filterLoadingOverlay) {
      filterLoadingOverlay.remove();
    }
    
    currentPage++;
    
    const filters = {};
    const checkboxes = document.querySelectorAll('.filter-checkbox');
    checkboxes.forEach(cb => {
      if (cb.checked) {
        filters[cb.name] = cb.value;
      }
    });
    
    const minPrice = document.getElementById('price-min-input-horizontal')?.value || 
                    document.getElementById('price-min-input')?.value;
    const maxPrice = document.getElementById('price-max-input-horizontal')?.value || 
                    document.getElementById('price-max-input')?.value;
    
    if (minPrice && maxPrice) {
      filters['filter.v.price.gte'] = minPrice;
      filters['filter.v.price.lte'] = maxPrice;
    }
    
    await updateProducts(filters, currentSort, currentPage);
  }

  const loadMoreListBtn = document.getElementById('loadMoreListBtn');
  const loadMoreGridBtn = document.getElementById('loadMoreGridBtn');

  if (loadMoreListBtn) {
    loadMoreListBtn.addEventListener('click', () => loadMoreProducts('list'));
  }

  if (loadMoreGridBtn) {
    loadMoreGridBtn.addEventListener('click', () => loadMoreProducts('grid'));
  }

  // Initialize product-specific event listeners
  function initializeProductEvents() {
    // Add any product-specific event listeners here
    // For example, quick view, add to cart, etc.
    
    // Handle pagination links
    const paginationLinks = document.querySelectorAll('.wg-pagination a');
    paginationLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        // Allow normal navigation for pagination links
      });
    });
    
    // Re-observe for infinite scroll
    if (document.querySelector('[data-pagination-type="infinite_scroll"]')) {
      initializeInfiniteScroll();
    }
  }

  // Ensure pagination is visible
  function ensurePaginationVisibility() {
    const pagination = document.querySelector('.wg-pagination');
    if (pagination) {
      if (window.getComputedStyle(pagination).display === 'none') {
        pagination.style.display = 'flex';
      }
      
      const paginationLinks = pagination.querySelectorAll('a');
      paginationLinks.forEach(link => {
        if (window.getComputedStyle(link).pointerEvents === 'none') {
          link.style.pointerEvents = 'auto';
        }
      });
    }
  }

  // Update availability filter counts
  async function updateAvailabilityCounts() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('page');
      url.searchParams.delete('filter.v.availability');
      
      const response = await fetch(url.toString());
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const inStockElement = doc.querySelector('label[for="Filter-availability-1"] .count');
      const outOfStockElement = doc.querySelector('label[for="Filter-availability-2"] .count');
      
      const inStockText = inStockElement?.textContent || '';
      const outOfStockText = outOfStockElement?.textContent || '';
      
      const inStockMatch = inStockText.match(/\((\d+)\)/);
      const outOfStockMatch = outOfStockText.match(/\((\d+)\)/);
      
      const inStockCount = inStockMatch?.[1] || '0';
      const outOfStockCount = outOfStockMatch?.[1] || '0';
      
      // Update sidebar counts
      const inStockLabel = document.querySelector('label[for="Filter-availability-1"] .count');
      const outOfStockLabel = document.querySelector('label[for="Filter-availability-2"] .count');
      
      if (inStockLabel) inStockLabel.textContent = `(${inStockCount})`;
      if (outOfStockLabel) outOfStockLabel.textContent = `(${outOfStockCount})`;
      
      // Update horizontal filter counts
      const horizontalInStockLabel = document.querySelector('.dropdown-filter .collapse-body label[for="Filter-availability-1"] .count');
      const horizontalOutOfStockLabel = document.querySelector('.dropdown-filter .collapse-body label[for="Filter-availability-2"] .count');
      
      if (horizontalInStockLabel) horizontalInStockLabel.textContent = `(${inStockCount})`;
      if (horizontalOutOfStockLabel) horizontalOutOfStockLabel.textContent = `(${outOfStockCount})`;

    } catch (error) {
      console.error('Error updating availability counts:', error);
      
      // Fallback: use the product count display to estimate availability
      const productCountGrid = document.getElementById('product-count-grid');
      const productCountList = document.getElementById('product-count-list');
      
      let filteredProducts = 0;
      if (productCountGrid) {
        const countSpan = productCountGrid.querySelector('.count');
        if (countSpan) filteredProducts = parseInt(countSpan.textContent) || 0;
      } else if (productCountList) {
        const countSpan = productCountList.querySelector('.count');
        if (countSpan) filteredProducts = parseInt(countSpan.textContent) || 0;
      }
      
      if (filteredProducts > 0) {
        const gridLayout = document.getElementById('gridLayout');
        const listLayout = document.getElementById('listLayout');
        const isListActive = listLayout && listLayout.style.display === 'block';
        const activeLayout = isListActive ? listLayout : gridLayout;
        
        if (activeLayout) {
          const products = activeLayout.querySelectorAll('.loadItem');
          let inStockCount = 0;
          let outOfStockCount = 0;
          
          products.forEach(product => {
            const computedStyle = window.getComputedStyle(product);
            if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
              const availability = product.dataset.availability;
              if (availability === 'true' || availability === 'In stock') {
                inStockCount++;
              } else {
                outOfStockCount++;
              }
            }
          });
          
          const totalVisible = inStockCount + outOfStockCount;
          if (totalVisible > 0) {
            const inStockRatio = inStockCount / totalVisible;
            const estimatedInStock = Math.round(filteredProducts * inStockRatio);
            const estimatedOutOfStock = filteredProducts - estimatedInStock;
            
            const inStockLabel = document.querySelector('label[for="Filter-availability-1"] .count');
            const outOfStockLabel = document.querySelector('label[for="Filter-availability-2"] .count');
            
            if (inStockLabel) inStockLabel.textContent = `(${estimatedInStock})`;
            if (outOfStockLabel) outOfStockLabel.textContent = `(${estimatedOutOfStock})`;
          }
        }
      }
    }
  }
});

(function () {
  "use strict";

  /* Range Two Price
  -------------------------------------------------------------------------------------*/
  var rangeTwoPrice = function () {
    document.querySelectorAll(".price-val-range").forEach(function(skipSlider) {
      // Skip if already initialized
      if (skipSlider.noUiSlider) {
        return;
      }
      
      // Find min/max value elements within the same container
      var container = skipSlider.closest('.widget-price, .collapse-body');
      var skipValues = [
        container.querySelector("#price-min-value"),
        container.querySelector("#price-max-value"),
      ];

      // Skip if min/max value elements are not found
      if (!skipValues[0] || !skipValues[1]) {
        return;
      }

      // Validate and sanitize min/max values
      var rawMin = skipSlider.getAttribute("data-min");
      var rawMax = skipSlider.getAttribute("data-max");
      
      // Ensure values are valid numbers and within reasonable bounds
      var min = Math.max(0, Math.min(10000, parseInt(rawMin, 10) || 0));
      var max = Math.max(min + 1, Math.min(10000, parseInt(rawMax, 10) || 500));
      
      // Update data attributes with sanitized values
      skipSlider.setAttribute("data-min", min);
      skipSlider.setAttribute("data-max", max);

      try {
        noUiSlider.create(skipSlider, {
          start: [min, max],
          connect: true,
          step: 1,
          range: {
            min: min,
            max: max,
          },
          format: {
            from: function (value) {
              return Math.max(min, Math.min(max, parseInt(value, 10) || min));
            },
            to: function (value) {
              return Math.max(min, Math.min(max, parseInt(value, 10) || min));
            },
          },
        });

        skipSlider.noUiSlider.on("update", function (val, e) {
          // Sanitize and validate values before updating DOM
          var sanitizedValue = Math.max(min, Math.min(max, parseInt(val[e], 10) || min));
          skipValues[e].innerText = sanitizedValue;
        });
      } catch (error) {
        console.error('Error initializing price slider:', error);
        // Fallback: disable the slider if initialization fails
        skipSlider.style.display = 'none';
      }
    });
  };

  /* Filter Products
  -------------------------------------------------------------------------------------*/
  var filterProducts = function () {
    const priceSlider = document.getElementById("price-value-range");
    const filterForm = document.getElementById("collection-filters-form");

    // Only proceed if priceSlider exists
    if (!priceSlider) {
      return;
    }

    // Validate and sanitize price range values
    const rawMinPrice = priceSlider.dataset.min;
    const rawMaxPrice = priceSlider.dataset.max;
    
    const minPrice = Math.max(0, Math.min(10000, parseInt(rawMinPrice, 10) || 0));
    const maxPrice = Math.max(minPrice + 1, Math.min(10000, parseInt(rawMaxPrice, 10) || 500));
    
    // Update dataset with sanitized values
    priceSlider.dataset.min = minPrice;
    priceSlider.dataset.max = maxPrice;

    const filters = {
      minPrice: minPrice,
      maxPrice: maxPrice,
      size: null,
      color: null,
      availability: null,
      brands: null,
      sale: false,
    };

    // Input validation utility function
    function validateAndSanitizePrice(price) {
      const parsed = parseFloat(price);
      return isNaN(parsed) ? 0 : Math.max(0, Math.min(10000, parsed));
    }

    // Handle checkbox changes
    document.querySelectorAll('.tf-check').forEach(function(checkbox) {
      checkbox.addEventListener('change', function() {
        if (filterForm) {
          filterForm.submit();
        }
      });
    });

    // Only set up noUiSlider if priceSlider exists
    if (priceSlider && priceSlider.noUiSlider) {
      priceSlider.noUiSlider.on("update", function (values) {
        // Validate and sanitize slider values
        const newMinPrice = validateAndSanitizePrice(values[0]);
        const newMaxPrice = validateAndSanitizePrice(values[1]);
        
        // Ensure min doesn't exceed max
        if (newMinPrice <= newMaxPrice) {
          filters.minPrice = newMinPrice;
          filters.maxPrice = newMaxPrice;
        } else {
          // Reset to valid range if invalid
          filters.minPrice = minPrice;
          filters.maxPrice = maxPrice;
          priceSlider.noUiSlider.set([minPrice, maxPrice]);
        }

        // Safely update DOM elements
        const minValueElement = document.getElementById("price-min-value");
        const maxValueElement = document.getElementById("price-max-value");
        
        if (minValueElement) {
          minValueElement.textContent = filters.minPrice;
        }
        if (maxValueElement) {
          maxValueElement.textContent = filters.maxPrice;
        }

        applyFilters();
        updateMetaFilter();
      });
    }

    document.querySelectorAll(".size-check").forEach(function(element) {
      element.addEventListener("click", function() {
        const sizeText = this.querySelector(".size").textContent;
        // Sanitize size text to prevent XSS
        filters.size = sizeText ? sizeText.trim().substring(0, 100) : null;
        applyFilters();
        updateMetaFilter();
      });
    });

    document.querySelectorAll(".color-check").forEach(function(element) {
      element.addEventListener("click", function() {
        const colorText = this.querySelector(".color-text").textContent;
        // Sanitize color text to prevent XSS
        filters.color = colorText ? colorText.trim().substring(0, 100) : null;
        applyFilters();
        updateMetaFilter();
      });
    });

    document.querySelectorAll('input[name="availability"]').forEach(function(element) {
      element.addEventListener("change", function() {
        const availabilityId = this.getAttribute("id");
        // Validate availability value
        filters.availability = availabilityId === "inStock" ? "In stock" : "Out of stock";
        applyFilters();
        updateMetaFilter();
      });
    });

    document.querySelectorAll('input[name="brand"]').forEach(function(element) {
      element.addEventListener("change", function() {
        const brandId = this.getAttribute("id");
        // Sanitize brand ID to prevent XSS
        filters.brands = brandId ? brandId.trim().substring(0, 100) : null;
        applyFilters();
        updateMetaFilter();
      });
    });

    document.querySelectorAll(".shop-sale-text").forEach(function(element) {
      element.addEventListener("click", function() {
        filters.sale = !filters.sale;
        this.classList.toggle("active", filters.sale);
        applyFilters();
        updateMetaFilter();
      });
    });

    function updateMetaFilter() {
      const appliedFilters = document.getElementById("applied-filters");
      const metaFilterShop = document.querySelector(".meta-filter-shop");
      
      if (!appliedFilters) return;
      
      appliedFilters.innerHTML = '';

      // Sanitize all filter values before adding to DOM
      if (filters.availability) {
        const sanitizedAvailability = document.createElement('div');
        sanitizedAvailability.textContent = filters.availability;
        appliedFilters.innerHTML +=
          `<span class="filter-tag"><span class="remove-tag icon-close" data-filter="availability"></span> Availability: ${sanitizedAvailability.innerHTML} </span>`;
      }
      if (filters.brands) { 
        const sanitizedBrand = document.createElement('div');
        sanitizedBrand.textContent = filters.brands;
        appliedFilters.innerHTML +=
          `<span class="filter-tag"><span class="remove-tag icon-close" data-filter="brand"></span>Brand: ${sanitizedBrand.innerHTML}</span>`;
      }
      if (filters.minPrice > minPrice || filters.maxPrice < maxPrice) {
        appliedFilters.innerHTML +=
          `<span class="filter-tag"><span class="remove-tag icon-close" data-filter="price"></span>Price: $${filters.minPrice} - $${filters.maxPrice}</span>`;
      }
      if (filters.color) {
        const sanitizedColor = document.createElement('div');
        sanitizedColor.textContent = filters.color;
        appliedFilters.innerHTML +=
          `<span class="filter-tag"><span class="remove-tag icon-close" data-filter="color"></span>Color: ${sanitizedColor.innerHTML}</span>`;
      }
      if (filters.size) {
        const sanitizedSize = document.createElement('div');
        sanitizedSize.textContent = filters.size;
        appliedFilters.innerHTML +=
          `<span class="filter-tag"><span class="remove-tag icon-close" data-filter="size"></span>Size: ${sanitizedSize.innerHTML}</span>`;
      }
      if (filters.sale) {
        appliedFilters.innerHTML +=
          `<span class="filter-tag on-sale d-none">On Sale <span class="remove-tag icon-close" data-filter="sale"></span></span>`;
      }

      const hasFiltersApplied = appliedFilters.children.length > 0;
      if (metaFilterShop) {
        metaFilterShop.style.display = hasFiltersApplied ? '' : 'none';
      }

      const removeAll = document.getElementById("remove-all");
      if (removeAll) {
        removeAll.style.display = hasFiltersApplied ? '' : 'none';
      }
    }

    document.getElementById("applied-filters")?.addEventListener("click", function(e) {
      if (e.target.classList.contains("remove-tag")) {
        const filterType = e.target.dataset.filter;

        if (filterType === "size") {
          filters.size = null;
          document.querySelectorAll(".size-check").forEach(function(el) {
            el.classList.remove("active");
          });
        }
        if (filterType === "color") {
          filters.color = null;
          document.querySelectorAll(".color-check").forEach(function(el) {
            el.classList.remove("active");
          });
        }
        if (filterType === "availability") {
          filters.availability = null;
          document.querySelectorAll('input[name="availability"]').forEach(function(el) {
            el.checked = false;
          });
        }
        if (filterType === "brand") {
          filters.brands = null; 
          document.querySelectorAll('input[name="brand"]').forEach(function(el) {
            el.checked = false;
          });
        }
        if (filterType === "price") {
          filters.minPrice = minPrice;
          filters.maxPrice = maxPrice;
          if (priceSlider && priceSlider.noUiSlider) {
            priceSlider.noUiSlider.set([minPrice, maxPrice]);
          }
        }

        if (filterType === "sale") {
          filters.sale = false;
          document.querySelectorAll(".shop-sale-text").forEach(function(el) {
            el.classList.remove("active");
          });
        }

        applyFilters();
        updateMetaFilter();
      }
    });

    document.getElementById("remove-all")?.addEventListener("click", function() {
      resetFilters();
    });

    document.getElementById("reset-filter")?.addEventListener("click", function() {
      resetFilters();
    });

    function resetFilters() {
      filters.size = null;
      filters.color = null;
      filters.availability = null;
      filters.brands = null;
      filters.minPrice = minPrice;
      filters.maxPrice = maxPrice;
      filters.sale = false;

      document.querySelectorAll(".shop-sale-text").forEach(function(el) {
        el.classList.remove("active");
      });
      document.querySelectorAll('input[name="brand"]').forEach(function(el) {
        el.checked = false;
      });
      document.querySelectorAll('input[name="availability"]').forEach(function(el) {
        el.checked = false;
      });
      document.querySelectorAll(".size-check, .color-check").forEach(function(el) {
        el.classList.remove("active");
      });
      if (priceSlider && priceSlider.noUiSlider) {
        priceSlider.noUiSlider.set([minPrice, maxPrice]);
      }

      applyFilters();
      updateMetaFilter();
    }

    document.querySelectorAll(".reset-price").forEach(function(element) {
      element.addEventListener("click", function() {
        filters.minPrice = minPrice;
        filters.maxPrice = maxPrice;
        if (priceSlider && priceSlider.noUiSlider) {
          priceSlider.noUiSlider.set([minPrice, maxPrice]);
        }
        applyFilters();
        updateMetaFilter();
      });
    });

    function applyFilters() {
      let visibleProductCountGrid = 0;
      let visibleProductCountList = 0;

      document.querySelectorAll(".wrapper-shop .card-product").forEach(function(product) {
        let showProduct = true;

        // Validate and sanitize price parsing
        const priceText = product.querySelector(".price-new").textContent.replace(/[^\d.-]/g, "");
        const price = validateAndSanitizePrice(priceText);
        
        if (price < filters.minPrice || price > filters.maxPrice) {
          showProduct = false;
        }

        // Sanitize filter values before using in selectors
        if (filters.size) {
          const sizeItems = product.querySelectorAll('.size-item');
          let sizeFound = false;
          sizeItems.forEach(function(item) {
            if (item.textContent.includes(filters.size)) {
              sizeFound = true;
            }
          });
          if (!sizeFound) {
            showProduct = false;
          }
        }

        if (filters.color) {
          const colorSwatches = product.querySelectorAll('.color-swatch');
          let colorFound = false;
          colorSwatches.forEach(function(swatch) {
            if (swatch.textContent.includes(filters.color)) {
              colorFound = true;
            }
          });
          if (!colorFound) {
            showProduct = false;
          }
        }

        if (filters.availability) {
          const availabilityStatus = product.dataset.availability;
          if (filters.availability !== availabilityStatus) {
            showProduct = false;
          }
        }

        if (filters.sale) {
          if (!product.querySelector(".on-sale-wrap")) {
            showProduct = false;
          }
        }

        if (filters.brands) { 
          const brandId = product.getAttribute("data-brand");
          if (filters.brands !== brandId) {
            showProduct = false;
          }
        }

        product.style.display = showProduct ? '' : 'none';

        if (showProduct) {
          if (product.classList.contains("grid")) {
            visibleProductCountGrid++;
          } else if (product.classList.contains("style-list")) {
            visibleProductCountList++;
          }
        }
      });

      // Safely update product count displays
      const productCountGrid = document.getElementById("product-count-grid");
      const productCountList = document.getElementById("product-count-list");
      
      if (productCountGrid) {
        productCountGrid.innerHTML =
          `<span class="count">${visibleProductCountGrid}</span>Products found`;
      }
      if (productCountList) {
        productCountList.innerHTML =
          `<span class="count">${visibleProductCountList}</span>Products found`;
      }
      
      updateLastVisibleItem();
    }

    function updateLastVisibleItem() {
      setTimeout(() => {
        document.querySelectorAll(".card-product.style-list").forEach(function(el) {
          el.classList.remove("last");
        });
        const lastVisible = document.querySelector(".card-product.style-list:not([style*='display: none']):last-child");
        if (lastVisible) {
          lastVisible.classList.add("last");
        }
      }, 50);
    }
  };
  
  /* Filter Sort
  -------------------------------------------------------------------------------------*/
  var filterSort = function () {
    let isListActive = document.querySelector(".sw-layout-list")?.classList.contains("active");
    let originalProductsList = document.getElementById("listLayout")?.querySelector(".card-product")?.cloneNode(true);
    let originalProductsGrid = document.getElementById("gridLayout")?.querySelector(".card-product")?.cloneNode(true);
    let paginationList = document.getElementById("listLayout")?.querySelector(".wg-pagination")?.cloneNode(true);
    let paginationGrid = document.getElementById("gridLayout")?.querySelector(".wg-pagination")?.cloneNode(true);

    document.querySelectorAll(".select-item").forEach(function(element) {
      element.addEventListener("click", function() {
        const sortValue = this.dataset.sortValue;
        document.querySelectorAll(".select-item").forEach(function(el) {
          el.classList.remove("active");
        });
        this.classList.add("active");
        
        const dropdown = this.closest(".tf-dropdown");
        const textSortValue = dropdown?.querySelector(".text-sort-value");
        const textValueItem = this.querySelector(".text-value-item");
        if (textSortValue && textValueItem) {
          textSortValue.textContent = textValueItem.textContent;
        }

        applyFilter(sortValue, isListActive);
      });
    });

    document.querySelectorAll(".tf-view-layout-switch").forEach(function(element) {
      element.addEventListener("click", function() {
        const layout = this.dataset.valueLayout;

        if (layout === "list") {
          isListActive = true;
          const gridLayout = document.getElementById("gridLayout");
          const listLayout = document.getElementById("listLayout");
          if (gridLayout) gridLayout.style.display = 'none';
          if (listLayout) listLayout.style.display = '';
        } else {
          isListActive = false;
          const listLayout = document.getElementById("listLayout");
          if (listLayout) listLayout.style.display = 'none';
          setGridLayout(layout);
        }
      });
    });

    function applyFilter(sortValue, isListActive) {
      let products;

      if (isListActive) {
        products = Array.from(document.getElementById("listLayout")?.querySelectorAll(".card-product") || []);
      } else {
        products = Array.from(document.getElementById("gridLayout")?.querySelectorAll(".card-product") || []);
      }

      if (sortValue === "best-selling") {
        if (isListActive) {
          const listLayout = document.getElementById("listLayout");
          if (listLayout && originalProductsList) {
            listLayout.innerHTML = '';
            listLayout.appendChild(originalProductsList.cloneNode(true));
          }
        } else {
          const gridLayout = document.getElementById("gridLayout");
          if (gridLayout && originalProductsGrid) {
            gridLayout.innerHTML = '';
            gridLayout.appendChild(originalProductsGrid.cloneNode(true));
          }
        }
        bindProductEvents();
        displayPagination(products, isListActive);
        return;
      }

      if (sortValue === "price-low-high") {
        products.sort(
          (a, b) =>
            parseFloat(a.querySelector(".price-new").textContent.replace("$", "")) -
            parseFloat(b.querySelector(".price-new").textContent.replace("$", ""))
        );
      } else if (sortValue === "price-high-low") {
        products.sort(
          (a, b) =>
            parseFloat(b.querySelector(".price-new").textContent.replace("$", "")) -
            parseFloat(a.querySelector(".price-new").textContent.replace("$", ""))
        );
      } else if (sortValue === "a-z") {
        products.sort((a, b) =>
          a.querySelector(".name-product").textContent.localeCompare(b.querySelector(".name-product").textContent)
        );
      } else if (sortValue === "z-a") {
        products.sort((a, b) =>
          b.querySelector(".name-product").textContent.localeCompare(a.querySelector(".name-product").textContent)
        );
      }

      if (isListActive) {
        const listLayout = document.getElementById("listLayout");
        if (listLayout) {
          listLayout.innerHTML = '';
          products.forEach(function(product) {
            listLayout.appendChild(product);
          });
        }
      } else {
        const gridLayout = document.getElementById("gridLayout");
        if (gridLayout) {
          gridLayout.innerHTML = '';
          products.forEach(function(product) {
            gridLayout.appendChild(product);
          });
        }
      }
      bindProductEvents();
      displayPagination(products, isListActive);
    }

    function displayPagination(products, isListActive) {
      if (products.length >= 12) {
        if (isListActive) {
          const listLayout = document.getElementById("listLayout");
          if (listLayout && paginationList) {
            listLayout.appendChild(paginationList.cloneNode(true));
          }
        } else {
          const gridLayout = document.getElementById("gridLayout");
          if (gridLayout && paginationGrid) {
            gridLayout.appendChild(paginationGrid.cloneNode(true));
          }
        }
      }
    }

    function setGridLayout(layoutClass) {
      const gridLayout = document.getElementById("gridLayout");
      if (gridLayout) {
        gridLayout.style.display = '';
        gridLayout.className = `wrapper-shop tf-grid-layout ${layoutClass}`;
      }
      
      document.querySelectorAll(".tf-view-layout-switch").forEach(function(el) {
        el.classList.remove("active");
      });
      
      const activeSwitch = document.querySelector(`.tf-view-layout-switch[data-value-layout="${layoutClass}"]`);
      if (activeSwitch) {
        activeSwitch.classList.add("active");
      }
    }
    
    function bindProductEvents() {
      if (document.querySelectorAll(".card-product").length > 0) {
        document.querySelectorAll(".color-swatch").forEach(function(element) {
          element.addEventListener("click", function() {
            handleColorSwatch(this);
          });
          element.addEventListener("mouseover", function() {
            handleColorSwatch(this);
          });
        });
      }
      
      document.querySelectorAll(".size-box").forEach(function(element) {
        element.addEventListener("click", function(e) {
          if (e.target.classList.contains("size-item")) {
            this.querySelectorAll(".size-item").forEach(function(el) {
              el.classList.remove("active");
            });
            e.target.classList.add("active");
          }
        });
      });
    }
    
    function handleColorSwatch(swatch) {
      const swatchColor = swatch.querySelector("img")?.getAttribute("src");
      const cardProduct = swatch.closest(".card-product");
      const imgProduct = cardProduct?.querySelector(".img-product");
      
      if (swatchColor && imgProduct) {
        imgProduct.setAttribute("src", swatchColor);
      }
      
      const activeSwatch = cardProduct?.querySelector(".color-swatch.active");
      if (activeSwatch) {
        activeSwatch.classList.remove("active");
      }
      swatch.classList.add("active");
    }
    
    bindProductEvents();
  };
 
  /* Switch Layout 
  -------------------------------------------------------------------------------------*/  
  var swLayoutShop = function () {
    let isListActive = document.querySelector(".sw-layout-list")?.classList.contains("active");
    let userSelectedLayout = null;

    function hasValidLayout() {
      const gridLayout = document.getElementById("gridLayout");
      return gridLayout && (
        gridLayout.classList.contains("tf-col-2") ||
        gridLayout.classList.contains("tf-col-3") ||
        gridLayout.classList.contains("tf-col-4") ||
        gridLayout.classList.contains("tf-col-5") ||
        gridLayout.classList.contains("tf-col-6") ||
        gridLayout.classList.contains("tf-col-7")
      );
    }

    function updateLayoutDisplay() {
      const windowWidth = window.innerWidth;
      const gridLayout = document.getElementById("gridLayout");
      const currentLayout = gridLayout?.className;

      if (!hasValidLayout()) {
        console.warn(
          "Page does not contain a valid layout (2-7 columns), skipping layout adjustments."
        );
        return;
      }

      if (isListActive) {
        if (gridLayout) gridLayout.style.display = 'none';
        const listLayout = document.getElementById("listLayout");
        if (listLayout) listLayout.style.display = '';
        
        const wrapperControlShop = document.querySelector(".wrapper-control-shop");
        if (wrapperControlShop) {
          wrapperControlShop.classList.add("listLayout-wrapper");
          wrapperControlShop.classList.remove("gridLayout-wrapper");
        }
        return;
      }

      if (userSelectedLayout) {
        if (windowWidth <= 767) {
          setGridLayout("tf-col-2");
        } else if (windowWidth <= 1200 && userSelectedLayout !== "tf-col-2") {
          setGridLayout("tf-col-3");
        } else if (
          windowWidth <= 1400 &&
          (userSelectedLayout === "tf-col-5" ||
            userSelectedLayout === "tf-col-6" ||
            userSelectedLayout === "tf-col-7")
        ) {
          setGridLayout("tf-col-4");
        } else {
          setGridLayout(userSelectedLayout);
        }
        return;
      }

      if (windowWidth <= 767) {
        if (!currentLayout?.includes("tf-col-2")) {
          setGridLayout("tf-col-2");
        }
      } else if (windowWidth <= 1200) {
        if (!currentLayout?.includes("tf-col-3")) {
          setGridLayout("tf-col-3");
        }
      } else if (windowWidth <= 1400) {
        if (
          currentLayout?.includes("tf-col-5") ||
          currentLayout?.includes("tf-col-6") ||
          currentLayout?.includes("tf-col-7")
        ) {
          setGridLayout("tf-col-4");
        }
      } else {
        const listLayout = document.getElementById("listLayout");
        if (listLayout) listLayout.style.display = 'none';
        if (gridLayout) gridLayout.style.display = '';
        
        const wrapperControlShop = document.querySelector(".wrapper-control-shop");
        if (wrapperControlShop) {
          wrapperControlShop.classList.add("gridLayout-wrapper");
          wrapperControlShop.classList.remove("listLayout-wrapper");
        }
      }
    }

    function setGridLayout(layoutClass) {
      const listLayout = document.getElementById("listLayout");
      const gridLayout = document.getElementById("gridLayout");
      
      if (listLayout) listLayout.style.display = 'none';
      if (gridLayout) {
        gridLayout.style.display = '';
        gridLayout.className = `wrapper-shop tf-grid-layout ${layoutClass}`;
      }
      
      document.querySelectorAll(".tf-view-layout-switch").forEach(function(el) {
        el.classList.remove("active");
      });
      
      const activeSwitch = document.querySelector(`.tf-view-layout-switch[data-value-layout="${layoutClass}"]`);
      if (activeSwitch) {
        activeSwitch.classList.add("active");
      }
      
      const wrapperControlShop = document.querySelector(".wrapper-control-shop");
      if (wrapperControlShop) {
        wrapperControlShop.classList.add("gridLayout-wrapper");
        wrapperControlShop.classList.remove("listLayout-wrapper");
      }
      isListActive = false;
    }

    document.addEventListener("DOMContentLoaded", function () {
      if (isListActive) {
        const gridLayout = document.getElementById("gridLayout");
        const listLayout = document.getElementById("listLayout");
        if (gridLayout) gridLayout.style.display = 'none';
        if (listLayout) listLayout.style.display = '';
        
        const wrapperControlShop = document.querySelector(".wrapper-control-shop");
        if (wrapperControlShop) {
          wrapperControlShop.classList.add("listLayout-wrapper");
          wrapperControlShop.classList.remove("gridLayout-wrapper");
        }
      } else {
        const listLayout = document.getElementById("listLayout");
        if (listLayout) listLayout.style.display = 'none';
        updateLayoutDisplay();
      }
    });

    window.addEventListener("resize", updateLayoutDisplay);

    document.querySelectorAll(".tf-view-layout-switch").forEach(function(element) {
      element.addEventListener("click", function() {
        const layout = this.dataset.valueLayout;
        
        document.querySelectorAll(".tf-view-layout-switch").forEach(function(el) {
          el.classList.remove("active");
        });
        this.classList.add("active");
        
        const wrapperControlShop = document.querySelector(".wrapper-control-shop");
        if (wrapperControlShop) {
          wrapperControlShop.classList.add("loading-shop");
        }
        
        setTimeout(() => {
          if (wrapperControlShop) {
            wrapperControlShop.classList.remove("loading-shop");
          }
          
          if (isListActive) {
            const gridLayout = document.getElementById("gridLayout");
            const listLayout = document.getElementById("listLayout");
            if (gridLayout) gridLayout.style.display = 'none';
            if (listLayout) listLayout.style.display = '';
          } else {
            const listLayout = document.getElementById("listLayout");
            const gridLayout = document.getElementById("gridLayout");
            if (listLayout) listLayout.style.display = 'none';
            if (gridLayout) gridLayout.style.display = '';
          }
        }, 500);

        if (layout === "list") {
          isListActive = true;
          userSelectedLayout = null;
          const gridLayout = document.getElementById("gridLayout");
          const listLayout = document.getElementById("listLayout");
          if (gridLayout) gridLayout.style.display = 'none';
          if (listLayout) listLayout.style.display = '';
          
          const wrapperControlShop = document.querySelector(".wrapper-control-shop");
          if (wrapperControlShop) {
            wrapperControlShop.classList.add("listLayout-wrapper");
            wrapperControlShop.classList.remove("gridLayout-wrapper");
          }
        } else {
          userSelectedLayout = layout;
          setGridLayout(layout);
        }
      });
    });
  };


  /* Loading product 
  -------------------------------------------------------------------------------------*/ 
  var loadProduct = function () {
    const gridInitialItems = 8;
    const listInitialItems = 4;
    const gridItemsPerPage = 4;
    const listItemsPerPage = 2;

    let listItemsDisplayed = listInitialItems;
    let gridItemsDisplayed = gridInitialItems;
    let scrollTimeout;

    function hideExtraItems(layout, itemsDisplayed) {
      const loadItems = layout.querySelectorAll(".loadItem");
      loadItems.forEach(function(element, index) {
        if (index >= itemsDisplayed) {
          element.classList.add("hidden");
        }
      });
      if (layout.id === "listLayout") updateLastVisible(layout);
    }

    function showMoreItems(layout, itemsPerPage, itemsDisplayed) {
      const hiddenItems = Array.from(layout.querySelectorAll(".loadItem.hidden"));

      setTimeout(function () {
        hiddenItems.slice(0, itemsPerPage).forEach(function(element) {
          element.classList.remove("hidden");
        });
        if (layout.id === "listLayout") updateLastVisible(layout);
        checkLoadMoreButton(layout);
      }, 600);

      return itemsDisplayed + itemsPerPage;
    }

    function updateLastVisible(layout) {
      layout.querySelectorAll(".loadItem").forEach(function(element) {
        element.classList.remove("last-visible");
      });
      
      const visibleItems = Array.from(layout.querySelectorAll(".loadItem")).filter(function(element) {
        return !element.classList.contains("hidden");
      });
      
      if (visibleItems.length > 0) {
        visibleItems[visibleItems.length - 1].classList.add("last-visible");
      }
    }
    
    function checkLoadMoreButton(layout) {
      if (layout.querySelectorAll(".loadItem.hidden").length === 0) {
        if (layout.id === "listLayout") {
          const loadMoreListBtn = document.getElementById("loadMoreListBtn");
          const infiniteScrollList = document.getElementById("infiniteScrollList");
          if (loadMoreListBtn) loadMoreListBtn.style.display = 'none';
          if (infiniteScrollList) infiniteScrollList.style.display = 'none';
        } else if (layout.id === "gridLayout") {
          const loadMoreGridBtn = document.getElementById("loadMoreGridBtn");
          const infiniteScrollGrid = document.getElementById("infiniteScrollGrid");
          if (loadMoreGridBtn) loadMoreGridBtn.style.display = 'none';
          if (infiniteScrollGrid) infiniteScrollGrid.style.display = 'none';
        }
      }
    }

    const listLayout = document.getElementById("listLayout");
    const gridLayout = document.getElementById("gridLayout");
    
    if (listLayout) hideExtraItems(listLayout, listItemsDisplayed);
    if (gridLayout) hideExtraItems(gridLayout, gridItemsDisplayed);

    document.getElementById("loadMoreListBtn")?.addEventListener("click", function () {
      if (listLayout) {
        listItemsDisplayed = showMoreItems(
          listLayout,
          listItemsPerPage,
          listItemsDisplayed
        );
      }
    });

    document.getElementById("loadMoreGridBtn")?.addEventListener("click", function () {
      if (gridLayout) {
        gridItemsDisplayed = showMoreItems(
          gridLayout,
          gridItemsPerPage,
          gridItemsDisplayed
        );
      }
    });

    // Infinite Scrolling
    function onScroll() {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function () {
        const infiniteScrollList = document.getElementById("infiniteScrollList");
        const infiniteScrollGrid = document.getElementById("infiniteScrollGrid");

        if (
          infiniteScrollList && 
          infiniteScrollList.style.display !== 'none' &&
          isElementInViewport(infiniteScrollList)
        ) {
          if (listLayout) {
            listItemsDisplayed = showMoreItems(
              listLayout,
              listItemsPerPage,
              listItemsDisplayed
            );
          }
        }

        if (
          infiniteScrollGrid && 
          infiniteScrollGrid.style.display !== 'none' &&
          isElementInViewport(infiniteScrollGrid)
        ) {
          if (gridLayout) {
            gridItemsDisplayed = showMoreItems(
              gridLayout,
              gridItemsPerPage,
              gridItemsDisplayed
            );
          }
        }
      }, 300);
    }
    
    function isElementInViewport(el) {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <=
        (window.innerWidth || document.documentElement.clientWidth)
      );
    }
    
    window.addEventListener("scroll", onScroll);
  };

  // Initialize all functions when DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    rangeTwoPrice();
    filterProducts();
    filterSort();
    swLayoutShop();
    loadProduct();
    
    // Reinitialize price slider when dropdowns are shown
    document.addEventListener('shown.bs.dropdown', function (e) {
      const dropdown = e.target;
      const priceSlider = dropdown.querySelector('#price-value-range');
      if (priceSlider && !priceSlider.noUiSlider) {
        rangeTwoPrice();
      }
    });
  });
})();

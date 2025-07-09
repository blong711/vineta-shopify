(function ($) {
  "use strict";

  /* Range Two Price
  -------------------------------------------------------------------------------------*/
  var rangeTwoPrice = function () {
    $(".price-val-range").each(function() {
      var skipSlider = this;
      
      // Skip if already initialized
      if (skipSlider.noUiSlider) {
        return;
      }
      
      // Find min/max value elements within the same container
      var container = $(skipSlider).closest('.widget-price, .collapse-body');
      var skipValues = [
        container.find("#price-min-value")[0],
        container.find("#price-max-value")[0],
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
    $('.tf-check').on('change', function() {
      if (filterForm) {
        filterForm.submit();
      }
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
        const minValueElement = $("#price-min-value");
        const maxValueElement = $("#price-max-value");
        
        if (minValueElement.length) {
          minValueElement.text(filters.minPrice);
        }
        if (maxValueElement.length) {
          maxValueElement.text(filters.maxPrice);
        }

        applyFilters();
        updateMetaFilter();
      });
    }

    $(".size-check").on("click",function () {
      const sizeText = $(this).find(".size").text();
      // Sanitize size text to prevent XSS
      filters.size = sizeText ? sizeText.trim().substring(0, 100) : null;
      applyFilters();
      updateMetaFilter();
    });

    $(".color-check").on("click",function () {
      const colorText = $(this).find(".color-text").text();
      // Sanitize color text to prevent XSS
      filters.color = colorText ? colorText.trim().substring(0, 100) : null;
      applyFilters();
      updateMetaFilter();
    });

    $('input[name="availability"]').on("change",function () {
      const availabilityId = $(this).attr("id");
      // Validate availability value
      filters.availability = availabilityId === "inStock" ? "In stock" : "Out of stock";
      applyFilters();
      updateMetaFilter();
    });

    $('input[name="brand"]').on("change",function () {
      const brandId = $(this).attr("id");
      // Sanitize brand ID to prevent XSS
      filters.brands = brandId ? brandId.trim().substring(0, 100) : null;
      applyFilters();
      updateMetaFilter();
    });

    $(".shop-sale-text").on("click",function () {
      filters.sale = !filters.sale;
      $(this).toggleClass("active", filters.sale);
      applyFilters();
      updateMetaFilter();
    });

    function updateMetaFilter() {
      const appliedFilters = $("#applied-filters");
      const metaFilterShop = $(".meta-filter-shop");
      
      if (!appliedFilters.length) return;
      
      appliedFilters.empty();

      // Sanitize all filter values before adding to DOM
      if (filters.availability) {
        const sanitizedAvailability = $('<div>').text(filters.availability).html();
        appliedFilters.append(
          `<span class="filter-tag"><span class="remove-tag icon-close" data-filter="availability"></span> Availability: ${sanitizedAvailability} </span>`
        );
      }
      if (filters.brands) { 
        const sanitizedBrand = $('<div>').text(filters.brands).html();
        appliedFilters.append(
          `<span class="filter-tag"><span class="remove-tag icon-close" data-filter="brand"></span>Brand: ${sanitizedBrand}</span>`
        );
      }
      if (filters.minPrice > minPrice || filters.maxPrice < maxPrice) {
        appliedFilters.append(
          `<span class="filter-tag"><span class="remove-tag icon-close" data-filter="price"></span>Price: $${filters.minPrice} - $${filters.maxPrice}</span>`
        );
      }
      if (filters.color) {
        const sanitizedColor = $('<div>').text(filters.color).html();
        appliedFilters.append(
          `<span class="filter-tag"><span class="remove-tag icon-close" data-filter="color"></span>Color: ${sanitizedColor}</span>`
        );
      }
      if (filters.size) {
        const sanitizedSize = $('<div>').text(filters.size).html();
        appliedFilters.append(
          `<span class="filter-tag"><span class="remove-tag icon-close" data-filter="size"></span>Size: ${sanitizedSize}</span>`
        );
      }
      if (filters.sale) {
        appliedFilters.append(
          `<span class="filter-tag on-sale d-none">On Sale <span class="remove-tag icon-close" data-filter="sale"></span></span>`
        );
      }

      const hasFiltersApplied = appliedFilters.children().length > 0;
      metaFilterShop.toggle(hasFiltersApplied);

      $("#remove-all").toggle(hasFiltersApplied);
    }

    $("#applied-filters").on("click", ".remove-tag", function () {
      const filterType = $(this).data("filter");

      if (filterType === "size") {
        filters.size = null;
        $(".size-check").removeClass("active");
      }
      if (filterType === "color") {
        filters.color = null;
        $(".color-check").removeClass("active");
      }
      if (filterType === "availability") {
        filters.availability = null;
        $('input[name="availability"]').prop("checked", false);
      }
      if (filterType === "brand") {
        filters.brands = null; 
        $('input[name="brand"]').prop("checked", false);
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
        $(".shop-sale-text").removeClass("active");
      }

      applyFilters();
      updateMetaFilter();
    });

    $("#remove-all,#reset-filter").on("click",function () {
      filters.size = null;
      filters.color = null;
      filters.availability = null;
      filters.brands = null;
      filters.minPrice = minPrice;
      filters.maxPrice = maxPrice;
      filters.sale = false;

      $(".shop-sale-text").removeClass("active");
      $('input[name="brand"]').prop("checked", false);
      $('input[name="availability"]').prop("checked", false);
      $(".size-check, .color-check").removeClass("active");
      if (priceSlider && priceSlider.noUiSlider) {
        priceSlider.noUiSlider.set([minPrice, maxPrice]);
      }

      applyFilters();
      updateMetaFilter();
    });

    $(".reset-price").on("click",function(){
      filters.minPrice = minPrice;
      filters.maxPrice = maxPrice;
      if (priceSlider && priceSlider.noUiSlider) {
        priceSlider.noUiSlider.set([minPrice, maxPrice]);
      }
      applyFilters();
      updateMetaFilter();
    })

    function applyFilters() {
      let visibleProductCountGrid = 0;
      let visibleProductCountList = 0;

      $(".wrapper-shop .card-product").each(function () {
        const product = $(this);
        let showProduct = true;

        // Validate and sanitize price parsing
        const priceText = product.find(".price-new").text().replace(/[^\d.-]/g, "");
        const price = validateAndSanitizePrice(priceText);
        
        if (price < filters.minPrice || price > filters.maxPrice) {
          showProduct = false;
        }

        // Sanitize filter values before using in jQuery selectors
        if (filters.size) {
          const sanitizedSize = $('<div>').text(filters.size).html();
          if (!product.find(`.size-item:contains('${sanitizedSize}')`).length) {
            showProduct = false;
          }
        }

        if (filters.color) {
          const sanitizedColor = $('<div>').text(filters.color).html();
          if (!product.find(`.color-swatch:contains('${sanitizedColor}')`).length) {
            showProduct = false;
          }
        }

        if (filters.availability) {
          const availabilityStatus = product.data("availability");
          if (filters.availability !== availabilityStatus) {
            showProduct = false;
          }
        }

        if (filters.sale) {
          if (!product.find(".on-sale-wrap").length) {
            showProduct = false;
          }
        }

        if (filters.brands) { 
          const brandId = product.attr("data-brand");
          if (filters.brands !== brandId) {
            showProduct = false;
          }
        }

        product.toggle(showProduct);

        if (showProduct) {
          if (product.hasClass("grid")) {
            visibleProductCountGrid++;
          } else if (product.hasClass("style-list")) {
            visibleProductCountList++;
          }
        }
      });

      // Safely update product count displays
      const productCountGrid = $("#product-count-grid");
      const productCountList = $("#product-count-list");
      
      if (productCountGrid.length) {
        productCountGrid.html(
          `<span class="count">${visibleProductCountGrid}</span>Products found`
        );
      }
      if (productCountList.length) {
        productCountList.html(
          `<span class="count">${visibleProductCountList}</span>Products found`
        );
      }
      
      updateLastVisibleItem();
    }

    function updateLastVisibleItem() {
      setTimeout(() => {
        $(".card-product.style-list").removeClass("last");
        const lastVisible = $(".card-product.style-list:visible").last();
        if (lastVisible.length > 0) {
          lastVisible.addClass("last");
        }
      }, 50);
    }
  };
  
  /* Filter Sort
  -------------------------------------------------------------------------------------*/
  var filterSort = function () {
    let isListActive = $(".sw-layout-list").hasClass("active");
    let originalProductsList = $("#listLayout .card-product").clone();
    let originalProductsGrid = $("#gridLayout .card-product").clone();
    let paginationList = $("#listLayout .wg-pagination").clone();
    let paginationGrid = $("#gridLayout .wg-pagination").clone();

    $(".select-item").on("click", function () {
      const sortValue = $(this).data("sort-value");
      $(".select-item").removeClass("active");
      $(this).addClass("active");
      $(this)
        .closest(".tf-dropdown")
        .find(".text-sort-value")
        .text($(this).find(".text-value-item").text());

      applyFilter(sortValue, isListActive);
    });

    $(".tf-view-layout-switch").on("click", function () {
      const layout = $(this).data("value-layout");

      if (layout === "list") {
        isListActive = true;
        $("#gridLayout").hide();
        $("#listLayout").show();
      } else {
        isListActive = false;
        $("#listLayout").hide();
        setGridLayout(layout);
      }
    });

    function applyFilter(sortValue, isListActive) {
      let products;

      if (isListActive) {
        products = $("#listLayout .card-product");
      } else {
        products = $("#gridLayout .card-product");
      }

      if (sortValue === "best-selling") {
        if (isListActive) {
          $("#listLayout").empty().append(originalProductsList.clone());
        } else {
          $("#gridLayout").empty().append(originalProductsGrid.clone());
        }
        bindProductEvents();
        displayPagination(products, isListActive);
        return;
      }

      if (sortValue === "price-low-high") {
        products.sort(
          (a, b) =>
            parseFloat($(a).find(".price-new").text().replace("$", "")) -
            parseFloat($(b).find(".price-new").text().replace("$", ""))
        );
      } else if (sortValue === "price-high-low") {
        products.sort(
          (a, b) =>
            parseFloat($(b).find(".price-new").text().replace("$", "")) -
            parseFloat($(a).find(".price-new").text().replace("$", ""))
        );
      } else if (sortValue === "a-z") {
        products.sort((a, b) =>
          $(a).find(".name-product").text().localeCompare($(b).find(".name-product").text())
        );
      } else if (sortValue === "z-a") {
        products.sort((a, b) =>
          $(b).find(".name-product").text().localeCompare($(a).find(".name-product").text())
        );
      }

      if (isListActive) {
        $("#listLayout").empty().append(products);
      } else {
        $("#gridLayout").empty().append(products);
      }
      bindProductEvents();
      displayPagination(products, isListActive);
    }

    function displayPagination(products, isListActive) {
      if (products.length >= 12) {
        if (isListActive) {
          $("#listLayout").append(paginationList.clone());
        } else {
          $("#gridLayout").append(paginationGrid.clone());
        }
      }
    }

    function setGridLayout(layoutClass) {
      $("#gridLayout")
        .show()
        .removeClass()
        .addClass(`wrapper-shop tf-grid-layout ${layoutClass}`);
      $(".tf-view-layout-switch").removeClass("active");
      $(`.tf-view-layout-switch[data-value-layout="${layoutClass}"]`).addClass(
        "active"
      );
    }
    function bindProductEvents() {
      if ($(".card-product").length > 0) {
        $(".color-swatch").on("click, mouseover", function () {
          var swatchColor = $(this).find("img").attr("src");
          var imgProduct = $(this)
            .closest(".card-product")
            .find(".img-product");
          imgProduct.attr("src", swatchColor);
          $(this)
            .closest(".card-product")
            .find(".color-swatch.active")
            .removeClass("active");
          $(this).addClass("active");
        });
      }
      $(".size-box").on("click", ".size-item", function () {
        $(this).closest(".size-box").find(".size-item").removeClass("active");
        $(this).addClass("active");
      });
    }
    bindProductEvents();
  };
 
  /* Switch Layout 
  -------------------------------------------------------------------------------------*/  
  var swLayoutShop = function () {
    let isListActive = $(".sw-layout-list").hasClass("active");
    let userSelectedLayout = null;

    function hasValidLayout() {
      return (
        $("#gridLayout").hasClass("tf-col-2") ||
        $("#gridLayout").hasClass("tf-col-3") ||
        $("#gridLayout").hasClass("tf-col-4") ||
        $("#gridLayout").hasClass("tf-col-5") ||
        $("#gridLayout").hasClass("tf-col-6") ||
        $("#gridLayout").hasClass("tf-col-7")
      );
    }

    function updateLayoutDisplay() {
      const windowWidth = $(window).width();
      const currentLayout = $("#gridLayout").attr("class");

      if (!hasValidLayout()) {
        console.warn(
          "Page does not contain a valid layout (2-7 columns), skipping layout adjustments."
        );
        return;
      }

      if (isListActive) {
        $("#gridLayout").hide();
        $("#listLayout").show();
        $(".wrapper-control-shop")
          .addClass("listLayout-wrapper")
          .removeClass("gridLayout-wrapper");
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
        if (!currentLayout.includes("tf-col-2")) {
          setGridLayout("tf-col-2");
        }
      } else if (windowWidth <= 1200) {
        if (!currentLayout.includes("tf-col-3")) {
          setGridLayout("tf-col-3");
        }
      } else if (windowWidth <= 1400) {
        if (
          currentLayout.includes("tf-col-5") ||
          currentLayout.includes("tf-col-6") ||
          currentLayout.includes("tf-col-7")
        ) {
          setGridLayout("tf-col-4");
        }
      } else {
        $("#listLayout").hide();
        $("#gridLayout").show();
        $(".wrapper-control-shop")
          .addClass("gridLayout-wrapper")
          .removeClass("listLayout-wrapper");
      }
    }

    function setGridLayout(layoutClass) {
      $("#listLayout").hide();
      $("#gridLayout")
        .show()
        .removeClass()
        .addClass(`wrapper-shop tf-grid-layout ${layoutClass}`);
      $(".tf-view-layout-switch").removeClass("active");
      $(`.tf-view-layout-switch[data-value-layout="${layoutClass}"]`).addClass(
        "active"
      );
      $(".wrapper-control-shop")
        .addClass("gridLayout-wrapper")
        .removeClass("listLayout-wrapper");
      isListActive = false;
    }

    $(document).ready(function () {
      if (isListActive) {
        $("#gridLayout").hide();
        $("#listLayout").show();
        $(".wrapper-control-shop")
          .addClass("listLayout-wrapper")
          .removeClass("gridLayout-wrapper");
      } else {
        $("#listLayout").hide();
        $("#gridLayout").show();
        updateLayoutDisplay();
      }
    });

    $(window).on("resize", updateLayoutDisplay);

    $(".tf-view-layout-switch").on("click", function () {
      const layout = $(this).data("value-layout");
      $(".tf-view-layout-switch").removeClass("active");
      $(this).addClass("active");
      $(".wrapper-control-shop").addClass("loading-shop");
      setTimeout(() => {
        $(".wrapper-control-shop").removeClass("loading-shop");
        if (isListActive) {
          $("#gridLayout").css("display", "none");
          $("#listLayout").css("display", "");
        } else {
          $("#listLayout").css("display", "none");
          $("#gridLayout").css("display", "");
        }
      }, 500);

      if (layout === "list") {
        isListActive = true;
        userSelectedLayout = null;
        $("#gridLayout").hide();
        $("#listLayout").show();
        $(".wrapper-control-shop")
          .addClass("listLayout-wrapper")
          .removeClass("gridLayout-wrapper");
      } else {
        userSelectedLayout = layout;
        setGridLayout(layout);
      }
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
      layout.find(".loadItem").each(function (index) {
        if (index >= itemsDisplayed) {
          $(this).addClass("hidden");
        }
      });
      if (layout.is("#listLayout")) updateLastVisible(layout);
    }

    function showMoreItems(layout, itemsPerPage, itemsDisplayed) {
      const hiddenItems = layout.find(".loadItem.hidden");

      setTimeout(function () {
        hiddenItems.slice(0, itemsPerPage).removeClass("hidden");
        if (layout.is("#listLayout")) updateLastVisible(layout);
        checkLoadMoreButton(layout);
      }, 600);

      return itemsDisplayed + itemsPerPage;
    }

    function updateLastVisible(layout) {
      layout.find(".loadItem").removeClass("last-visible");
      layout
        .find(".loadItem")
        .not(".hidden")
        .last()
        .addClass("last-visible");
    }
    function checkLoadMoreButton(layout) {
      if (layout.find(".loadItem.hidden").length === 0) {
        if (layout.is("#listLayout")) {
          $("#loadMoreListBtn").hide();
          $("#infiniteScrollList").hide();
        } else if (layout.is("#gridLayout")) {
          $("#loadMoreGridBtn").hide();
          $("#infiniteScrollGrid").hide();
        }
      }
    }

    hideExtraItems($("#listLayout"), listItemsDisplayed);
    hideExtraItems($("#gridLayout"), gridItemsDisplayed);

    $("#loadMoreListBtn").on("click", function () {
      listItemsDisplayed = showMoreItems(
        $("#listLayout"),
        listItemsPerPage,
        listItemsDisplayed
      );
    });



    $("#loadMoreGridBtn").on("click", function () {
      gridItemsDisplayed = showMoreItems(
        $("#gridLayout"),
        gridItemsPerPage,
        gridItemsDisplayed
      );
    });

    // Infinite Scrolling
    function onScroll() {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function () {
        const infiniteScrollList = $("#infiniteScrollList");
        const infiniteScrollGrid = $("#infiniteScrollGrid");

        if (
          infiniteScrollList.is(":visible") &&
          isElementInViewport(infiniteScrollList)
        ) {
          listItemsDisplayed = showMoreItems(
            $("#listLayout"),
            listItemsPerPage,
            listItemsDisplayed
          );
        }

        if (
          infiniteScrollGrid.is(":visible") &&
          isElementInViewport(infiniteScrollGrid)
        ) {
          gridItemsDisplayed = showMoreItems(
            $("#gridLayout"),
            gridItemsPerPage,
            gridItemsDisplayed
          );
        }
      }, 300);
    }
    function isElementInViewport(el) {
      const rect = el[0].getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <=
        (window.innerWidth || document.documentElement.clientWidth)
      );
    }
    $(window).on("scroll", onScroll);
  };




  $(function () {
    rangeTwoPrice();
    filterProducts();
    filterSort();
    swLayoutShop();
    loadProduct();
    
    // Reinitialize price slider when dropdowns are shown
    $(document).on('shown.bs.dropdown', function (e) {
      const dropdown = $(e.target);
      const priceSlider = dropdown.find('#price-value-range');
      if (priceSlider.length > 0 && !priceSlider[0].noUiSlider) {
        rangeTwoPrice();
      }
    });
  });
})(jQuery);

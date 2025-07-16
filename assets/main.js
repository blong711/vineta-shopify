/**
  * Select Image
  * Variant Picker
  * Custom Dropdown
  * Check Active 
  * Color Swatch Product
  * Sidebar Mobile
  * Stagger Wrap
  * Modal Second
  * Estimate Shipping
  * Header Sticky
  * Auto Popup
  * Handle Progress
  * Total Price Variant
  * Scroll Grid Product
  * Hover Video
  * Change Value Dropdown
  * Button Loading
  * Item Checkbox
  * Handle Footer
  * Parallax
  * Infinite Slide
  * Button Quantity
  * Delete Item
  * Click Control 
  * Tab Slide
  * Coppy Text 
  * Wish List
  * Bottom Sticky
  * Handle Sidebar Filter 
  * Cookie Setting
  * Preloader
  * Go Top

 */

// Helper functions
function qs(selector, scope = document) {
  return scope.querySelector(selector);
}
function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
        }
function on(el, event, handler) {
  if (typeof handler === 'function') {
    el.addEventListener(event, handler);
  }
}
function onAll(selector, event, handler, scope = document) {
  if (typeof handler === 'function') {
    qsa(selector, scope).forEach(el => on(el, event, handler));
    }
}
function addClass(el, className) {
  el.classList.add(className);
}
function removeClass(el, className) {
  el.classList.remove(className);
        }
function setText(el, text) {
  el.textContent = text;
}
function getData(el, key) {
  return el.dataset[key];
}
function setAttr(el, attr, value) {
  el.setAttribute(attr, value);
}
function getAttr(el, attr) {
  return el.getAttribute(attr);
}
function setStyle(el, prop, value) {
  if (el && el.style) {
    el.style[prop] = value;
  }
}

// CSRF Protected Fetch Utility
  var csrfFetch = function(url, options = {}) {
    // Get CSRF token from meta tag or input field
  var csrfToken = (qs('meta[name="csrf-token"]') && qs('meta[name="csrf-token"]').getAttribute('content')) ||
                  (qs('input[name="authenticity_token"]') && qs('input[name="authenticity_token"]').value) ||
                  (qs('meta[name="csrf-token"]') && qs('meta[name="csrf-token"]').getAttribute('content'));
    
    // Set default headers
    var headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    // Add CSRF token if available
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    
    // Merge with provided options
    options.headers = { ...headers, ...options.headers };
    
    return fetch(url, options);
  };

// Select Image
  var selectImages = function () {
  const selectIMG = qs('.image-select');
  if (selectIMG) {
    // Destroy existing selectpicker instances to avoid conflicts (not needed in vanilla)
    // Set data-content for each option
    qsa('option', selectIMG).forEach(option => {
      const imgURL = option.getAttribute('data-thumbnail');
        if (imgURL) {
        setAttr(option, 'data-content', `<img src="${imgURL}" /> ${option.textContent}`);
        }
      });
    // If you use a custom select plugin, re-initialize here
    }
  };

// Variant Picker
  var variantPicker = function () {
  if (qsa('.variant-picker-item').length) {
      // variant color
    onAll('.color-btn', 'click', function (e) {
      var value = getData(this, 'scroll');
      setText(qs('.value-currentColor', this.closest('.variant-picker-values')), value);
      qsa('.color-btn', this.closest('.variant-picker-values')).forEach(btn => removeClass(btn, 'active'));
      addClass(this, 'active');
      });
      // variant size
    onAll('.size-btn', 'click', function (e) {
      var value = getData(this, 'size');
      setText(qs('.value-currentSize', this.closest('.variant-picker-values')), value);
      qsa('.size-btn', this.closest('.variant-picker-values')).forEach(btn => removeClass(btn, 'active'));
      addClass(this, 'active');
      });
    }
  };

// Custom Dropdown
  var customDropdown = function () {
    function updateDropdownClass() {
    const dropdowns = qsa('.dropdown-custom');
    if (window.innerWidth <= 991) {
      dropdowns.forEach(dropdown => {
        addClass(dropdown, 'dropup');
        removeClass(dropdown, 'dropend');
      });
      } else {
      dropdowns.forEach(dropdown => {
        addClass(dropdown, 'dropend');
        removeClass(dropdown, 'dropup');
      });
      }
    }
    updateDropdownClass();
  window.addEventListener('resize', updateDropdownClass);
  };

  /* Check Active 
  -------------------------------------------------------------------------*/
  var checkClick = function () {
    onAll(".flat-check-list", "click", ".check-item", function () {
      qsa(".flat-check-list", this).forEach(item => removeClass(item, "active"));
      addClass(this, "active");
    });
  };

  /* Color Swatch Product
  -------------------------------------------------------------------------*/
  var swatchColor = function () {
    if (qsa(".card-product").length > 0) {
      onAll(".color-swatch", "click", function () {
        var swatchColor = getData(this, 'src');
        var imgProduct = qs(".img-product", this.closest(".card-product"));
        setAttr(imgProduct, 'src', swatchColor);
        qsa(".color-swatch.active", this.closest(".card-product")).forEach(swatch => removeClass(swatch, "active"));
        addClass(this, "active");
      });
    }
  };

  /* Sidebar Mobile
  -------------------------------------------------------------------------*/
  var sidebarMobile = function () {
    if (qs(".sidebar-content-wrap")) {
      var sidebar = qs(".sidebar-content-wrap").innerHTML;
      qs(".sidebar-mobile-append").innerHTML = sidebar;
    }
  };

  /* Stagger Wrap
  -------------------------------------------------------------------------*/
  var staggerWrap = function () {
    if (qsa(".stagger-wrap").length) {
      var count = qsa(".stagger-item").length;
      for (var i = 1, time = 0.2; i <= count; i++) {
        var staggerItem = qsa(".stagger-item:nth-child(" + i + ")")[0];
        if (staggerItem) {
          staggerItem.style.transitionDelay = time * i + "s";
          addClass(staggerItem, "stagger-finished");
        }
      }
    }
  };

  /* Modal Second
  -------------------------------------------------------------------------*/
  var clickModalSecond = function () {
    onAll(".btn-quickview", "click", function () {
      qs("#quickView").modal("show");
    });
    onAll(".btn-addtocart", "click", function () {
      qs("#shoppingCart").modal("show");
    });
    onAll(".btn-add-gift", "click", function () {
      addClass(qs(".add-gift"), "open");
    });
    onAll(".btn-add-note", "click", function () {
      addClass(qs(".add-note"), "open");
    });
    onAll(".btn-coupon", "click", function () {
      addClass(qs(".coupon"), "open");
    });
    onAll(".btn-estimate-shipping", "click", function () {
      addClass(qs(".estimate-shipping"), "open");
    });
    onAll(".tf-mini-cart-tool-close", "click", function () {
      removeClass(qs(".tf-mini-cart-tool-openable"), "open");
    });
  };

  /* Estimate Shipping
  -------------------------------------------------------------------------*/
  var estimateShipping = function () {
    if (qs(".estimate-shipping")) {
      const countrySelect = qs("#shipping-country-form");
      const provinceSelect = qs("#shipping-province-form");
      const zipcodeInput = qs("#zipcode");
      const zipcodeMessage = qs("#zipcode-message");
      const zipcodeSuccess = qs("#zipcode-success");

      function updateProvinces() {
        const selectedCountry = countrySelect.value;
        const selectedOption =
          countrySelect.options[countrySelect.selectedIndex];
        const provincesData = selectedOption.getAttribute("data-provinces");

        const provinces = JSON.parse(provincesData);

        provinceSelect.innerHTML = "";

        if (provinces.length === 0) {
          const option = document.createElement("option");
          option.textContent = "------";
          provinceSelect.appendChild(option);
        } else {
          provinces.forEach((province) => {
            const option = document.createElement("option");
            option.value = province[0];
            option.textContent = province[1];
            provinceSelect.appendChild(option);
          });
        }
      }

      countrySelect.addEventListener("change", updateProvinces);

      function validateZipcode(zipcode, country) {
        let regex;

        switch (country) {
          case "Australia":
            regex = /^\d{4}$/;
            break;
          case "Austria":
            regex = /^\d{4}$/;
            break;
          case "Belgium":
            regex = /^\d{4}$/;
            break;
          case "Canada":
            regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
            break;
          case "Czech Republic":
            regex = /^\d{5}$/;
            break;
          case "Denmark":
            regex = /^\d{4}$/;
            break;
          case "Finland":
            regex = /^\d{5}$/;
            break;
          case "France":
            regex = /^\d{5}$/;
            break;
          case "Germany":
            regex = /^\d{5}$/;
            break;
          case "United States":
            regex = /^\d{5}(-\d{4})?$/;
            break;
          case "United Kingdom":
            regex = /^[A-Za-z]{1,2}\d[A-Za-z\d]? \d[A-Za-z]{2}$/;
            break;
          case "India":
            regex = /^\d{6}$/;
            break;
          case "Japan":
            regex = /^\d{3}-\d{4}$/;
            break;
          case "Mexico":
            regex = /^\d{5}$/;
            break;
          case "South Korea":
            regex = /^\d{5}$/;
            break;
          case "Spain":
            regex = /^\d{5}$/;
            break;
          case "Italy":
            regex = /^\d{5}$/;
            break;
          case "Vietnam":
            regex = /^\d{6}$/;
            break;
          default:
            return true;
        }

        return regex.test(zipcode);
      }

      qs("#shipping-form").addEventListener("submit", function (event) {
          const zipcode = zipcodeInput.value.trim();
          const country = countrySelect.value;

          if (!validateZipcode(zipcode, country)) {
            if (zipcodeMessage) {
              zipcodeMessage.style.display = "block";
            }
            if (zipcodeSuccess) {
              zipcodeSuccess.style.display = "none";
            }
            event.preventDefault();
          } else {
            if (zipcodeMessage) {
              zipcodeMessage.style.display = "none";
            }
            if (zipcodeSuccess) {
              zipcodeSuccess.style.display = "block";
            }
            event.preventDefault();
          }
        });

      window.onload = updateProvinces;
    }
  };

  /* Header Sticky - Optimized with throttled scroll handling
  -------------------------------------------------------------------------*/
  var headerSticky = function () {
    let lastScrollTop = 0;
    let delta = 5;
    let header = qs('header');
    let navbarHeight = header ? header.offsetHeight : 0;

    // Use ScrollManager for optimized scroll handling
    // This section is removed as per the new_code, as the ScrollManager object is removed.
    // The logic for headerSticky is now directly integrated into the ScrollManager.
  };

  /* Auto Popup
  ------------------------------------------------------------------------------------- */
  var autoPopup = function () {
    if (qsa(".auto-popup").length > 0) {
        let pageKey = "showPopup_" + window.location.pathname; 
        let showPopup = sessionStorage.getItem(pageKey);

        if (!JSON.parse(showPopup)) {
            setTimeout(function () {
                var autoPopupElement = qs(".auto-popup");
                if (autoPopupElement && typeof autoPopupElement.modal === 'function') {
                    autoPopupElement.modal("show");
                }
            }, 3000);
        }
        
        onAll(".btn-hide-popup", "click", function () {
            sessionStorage.setItem(pageKey, true); 
        });
    }
  };

  /* Handle Progress
  ------------------------------------------------------------------------------------- */
  var handleProgress = function () {
    if (qsa(".progress-sold").length > 0) {
      var progressValue = getData(qs(".progress-sold .value"), "progress");
      setTimeout(function () {
        setStyle(qs(".progress-sold .value"), "width", progressValue + "%");
      }, 800);
    }

    function handleProgressBar(showEvent, hideEvent, target) {
      onAll(target, hideEvent, function () {
        setStyle(qs(".tf-progress-bar .value"), "width", "0%");
      });
    
      onAll(target, showEvent, function () {
        setTimeout(function () {
          var progressValue = getData(qs(".tf-progress-bar .value"), "progress");
          setStyle(qs(".tf-progress-bar .value"), "width", progressValue + "%");
        }, 600);
      });
    }
    
    if (qsa(".popup-shopping-cart").length > 0) {
      handleProgressBar("show.bs.offcanvas", "hide.bs.offcanvas", ".popup-shopping-cart");
    }
    
    if (qsa(".popup-shopping-cart").length > 0) {
      handleProgressBar("show.bs.modal", "hide.bs.modal", ".popup-shopping-cart");
    }
  };

  /* Total Price Variant
  ------------------------------------------------------------------------------------- */
  var totalPriceVariant = function () {
    qsa(".tf-product-info-list,.tf-cart-item").forEach(function (productItem) {
      var basePrice =
        parseFloat(getData(qs(".price-on-sale", productItem), "base-price")) ||
        parseFloat(qs(".price-on-sale", productItem).textContent.replace("$", ""));
      var quantityInput = qs(".quantity-product", productItem);

      onAll(".color-btn, .size-btn", productItem, function () {
        var newPrice = parseFloat(getData(this, "price")) || basePrice;
        quantityInput.value = 1;
        setText(qs(".price-on-sale", productItem),
            "$" + newPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        updateTotalPrice(newPrice, productItem);
      });

      onAll(".btn-increase", productItem, function () {
        var currentQuantity = parseInt(quantityInput.value, 10);
        quantityInput.value = currentQuantity + 1;
        updateTotalPrice(null, productItem);
      });

      onAll(".btn-decrease", productItem, function () {
        var currentQuantity = parseInt(quantityInput.value, 10);
        if (currentQuantity > 1) {
          quantityInput.value = currentQuantity - 1;
          updateTotalPrice(null, productItem);
        }
      });

      function updateTotalPrice(price, scope) {
        var currentPrice =
          price ||
          parseFloat(qs(".price-on-sale", scope).textContent.replace("$", ""));
        var quantity = parseInt(qs(".quantity-product", scope).value, 10);
        var totalPrice = currentPrice * quantity;
        setText(qs(".total-price", scope),
            "$" + totalPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
      }
    });
  };

  /* Scroll Grid Product
  ------------------------------------------------------------------------------------- */
  var scrollGridProduct = function () {
    var scrollContainer = qs(".wrapper-gallery-scroll");
    var activescrollBtn = null;
    var offsetTolerance = 20;

    function isHorizontalMode() {
      return window.innerWidth <= 767;
    }

    function getTargetScroll(target, isHorizontal) {
      if (isHorizontal) {
        return (
          target.offsetLeft -
          scrollContainer.offsetLeft +
          scrollContainer.scrollLeft
        );
      } else {
        return (
          target.offsetTop -
          scrollContainer.offsetTop +
          scrollContainer.scrollTop
        );
      }
    }

    onAll(".btn-scroll-target", "click", function () {
      var scroll = getData(this, "scroll");
      var target = qs(".item-scroll-target[data-scroll='" + scroll + "']");

      if (target) {
        var isHorizontal = isHorizontalMode();
        var targetScroll = getTargetScroll(target, isHorizontal);

        if (isHorizontal) {
          scrollContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
        } else {
          document.documentElement.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }

        onAll(".btn-scroll-target", "click", function () {
          removeClass(this, "active");
        });
        addClass(this, "active");
        activescrollBtn = this;
      }
    });

    // Use ScrollManager for optimized scroll handling
    // This section is removed as per the new_code, as the ScrollManager object is removed.
    // The logic for scrollGridProduct is now directly integrated into the ScrollManager.
  };

  /* Hover Video
  ------------------------------------------------------------------------------------- */
  var hoverVideo = function () {
    onAll(".hover-video", "mouseenter", function () {
      this.play();
    });
    qsa(".cls-video").forEach(function (container) {
      const video = container.querySelector("video");
      const poster = container.querySelector(".poster");

      on(container, "mouseenter", function () {
        addClass(poster, "hide");
        video.play();
      });

      on(container, "mouseleave", function () {
        video.pause();
        removeClass(poster, "hide");
      });
    });
  };

  /* Change Value Dropdown
  ------------------------------------------------------------------------------------- */
  var changeValueDropdown = function () {
    if (qsa(".tf-dropdown").length > 0) {
      onAll(".select-item", "click", function (event) {
        qs(".text-sort-value", this.closest(".tf-variant-dropdown")).textContent = qs(".text-value-item", this).textContent;

        qsa(".dropdown-menu", this.closest(".tf-variant-dropdown")).forEach(item => removeClass(item, "active"));
        addClass(this, "active");
      });
    }
  };

  /* Button Loading
  -------------------------------------------------------------------------*/
  var btnLoading = function () {
    if (qsa(".tf-loading").length) {
      onAll(".tf-loading", "click", function (e) {
        addClass(this, "loading");
        var $this = this;
        setTimeout(function () {
          removeClass(this, "loading");
        }, 600);
      });
    }
  };

  /* Item Checkbox
  -------------------------------------------------------------------------*/
  var itemCheckbox = function () {
    if (qsa(".item-has-checkbox").length) {
      onAll(".item-has-checkbox input:checkbox", "click", function (e) {
        addClass(this.closest(".item-has-checkbox"), "check");
      });
    }
  };

  /* Handle Footer
  -------------------------------------------------------------------------*/
  var handleFooter = function () {
    var footerAccordion = function () {
      var args = { duration: 250 };
      onAll(".footer-heading-mobile", "click", function () {
        addClass(this.closest(".footer-col-block"), "open");
        if (!this.closest(".footer-col-block").classList.contains("open")) {
          if (this.nextElementSibling) {
            this.nextElementSibling.style.display = "none";
          }
        } else {
          if (this.nextElementSibling) {
            this.nextElementSibling.style.display = "block";
          }
        }
      });
    };
    function handleAccordion() {
      if (matchMedia("only screen and (max-width: 575px)").matches) {
        var footerHeading = qs(".footer-heading-mobile");
        if (footerHeading && !footerHeading.dataset.accordionInitialized) {
          footerAccordion();
          footerHeading.dataset.accordionInitialized = "true";
        }
      } else {
        onAll(".footer-heading-mobile", "click", null);
        qsa(".footer-heading-mobile").forEach(heading => {
          removeClass(heading.closest(".footer-col-block"), "open");
          if (heading.nextElementSibling) {
            heading.nextElementSibling.removeAttribute("style");
          }
        });
        var footerHeading = qs(".footer-heading-mobile");
        if (footerHeading) {
          footerHeading.dataset.accordionInitialized = "false";
        }
      }
    }
    handleAccordion();
    window.addEventListener("resize", function () {
      handleAccordion();
    });
  };

  /* Parallax
  ----------------------------------------------------------------------------*/
  var efectParalax = function () {
    if (qsa(".effect-paralax").length > 0) {
      qsa(".effect-paralax").forEach(function (container) {
        new SimpleParallax(container, {
          delay: 0.5,
          orientation: "up",
          scale: 1.3,
          transition: "cubic-bezier(0.2, 0.8, 1, 1)",
          customContainer: "",
          customWrapper: "",
        });
      });
    }
  };

  /* Parallaxie js 
  -------------------------------------------------------------------------------------*/

  var parallaxie = function () {
      var $window = window;
      if (qsa(".parallaxie").length && $window.innerWidth > 991) {
          if ($window.innerWidth > 768) {
              qsa(".parallaxie").forEach(function (container) {
                  container.parallaxie({
                  speed: 0.55,
                  offset: 0,
                  });
              });
          }
      }
  };

  /* Infinite Slide
  ----------------------------------------------------------------------------*/
  var infiniteSlide = function () {
    if (qsa(".infiniteslide").length > 0 && typeof infiniteslide === 'function') {
      qsa(".infiniteslide").forEach(function (container) {
        var $this = container;
        var style = getData($this, "style") || "left";
        var clone = getData($this, "clone") || 2;
        var speed = getData($this, "speed") || 100;
        infiniteslide($this, {
          speed: speed,
          direction: style,
          clone: clone,
        });
      });
    }
  };

  /* Button Quantity
  ----------------------------------------------------------------------------*/
  var btnQuantity = function () {
    onAll(".minus-btn", "click", function (e) {
      e.preventDefault();
      var $this = this;
      var $input = this.closest("div").querySelector("input");
      var value = parseInt($input.value, 10);

      if (value > 1) {
        value = value - 1;
      }
      $input.value = value;
    });

    onAll(".plus-btn", "click", function (e) {
      e.preventDefault();
      var $this = this;
      var $input = this.closest("div").querySelector("input");
      var value = parseInt($input.value, 10);

      if (value > -1) {
        value = value + 1;
      }
      $input.value = value;
    });
  };

  /* Delete Item
  ----------------------------------------------------------------------------*/
  var deleteFile = function (e) {
    onAll(".remove", "click", function (e) {
      e.preventDefault();
      var $this = this;
      $this.closest(".file-delete").remove();
    });
    onAll(".clear-file-delete", "click", function (e) {
      e.preventDefault();
      qs(".list-file-delete", this).querySelector(".file-delete").remove();
    });
  };

  /* Click Control 
  ------------------------------------------------------------------------------------- */
  var clickControl = function () {
    onAll(".btn-delete-address", "click", function (e) {
      e.preventDefault();
      
      var formId = getData(this, "form");
      var targetForm = qs("#" + formId);
      
      if (targetForm) {
        // Extract address ID from form ID
        var addressId = formId.replace('form-edit-', '');
        
        // Use CSRF-protected fetch for address deletion
        csrfFetch('/account/addresses/' + addressId, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        .then(function(response) {
          if (response.ok) {
            // Remove the address item from the DOM
            var addressItem = this.closest('.account-address-item');
            if (addressItem) {
              addressItem.style.display = 'none';
              setTimeout(function() {
                if (addressItem && addressItem.parentNode) {
                  addressItem.remove();
                }
              }, 300);
            }
            
            // Show success message
            var myAccountContent = qs(".my-acount-content");
            if (myAccountContent) {
              var successMessage = document.createElement("div");
              successMessage.className = "alert alert-success";
              successMessage.textContent = "Address deleted successfully.";
              myAccountContent.prepend(successMessage);
              setTimeout(function() {
                if (successMessage && successMessage.parentNode) {
                  successMessage.style.display = 'none';
                  successMessage.remove();
                }
              }, 3000);
            }
          } else {
            throw new Error('Failed to delete address');
          }
        })
        .catch(function(error) {
          console.error('Error deleting address:', error);
          
          // Show error message
          var myAccountContent = qs(".my-acount-content");
          if (myAccountContent) {
            var errorMessage = document.createElement("div");
            errorMessage.className = "alert alert-danger";
            errorMessage.textContent = "Failed to delete address. Please try again.";
            myAccountContent.prepend(errorMessage);
            setTimeout(function() {
              if (errorMessage && errorMessage.parentNode) {
                errorMessage.style.display = 'none';
                errorMessage.remove();
              }
            }, 3000);
          }
        });
      }
    });
    
    onAll(".btn-edit-address", "click", function (e) {
      var item = this.closest(".account-address-item");
      var formId = getData(this, "form");
      var targetForm = qs("#" + formId);
      
      // Hide all edit forms first
      qsa(".edit-form-address").forEach(form => {
        if (form) {
          form.style.display = 'none';
        }
      });
      qsa(".edit-form-address").forEach(form => removeClass(form, "show"));
      qsa(".account-address-item").forEach(item => removeClass(item, "editing"));
      
      // Show only the target form
      if (targetForm) {
        targetForm.style.display = 'block';
        addClass(targetForm, "show");
        addClass(item, "editing");
      }
    });
    onAll(".btn-hide-edit-address", "click", function () {
      qsa(".edit-form-address").forEach(form => {
        if (form) {
          form.style.display = 'none';
        }
      });
      qsa(".edit-form-address").forEach(form => removeClass(form, "show"));
      qsa(".account-address-item").forEach(item => removeClass(item, "editing"));
    });
  };

  /* Tab Slide 
  ------------------------------------------------------------------------------------- */
  var tabSlide = function () {
    if (qsa(".tab-slide").length > 0) {
      function updateTabSlide() {
        var $activeTab = qs(".tab-slide li.active");
        if ($activeTab) {
          var $width = $activeTab.offsetWidth;
          var $left = $activeTab.offsetLeft;
          var sideEffect = qs(".item-slide-effect", $activeTab.parentElement);
          setStyle(sideEffect, {
            width: $width + "px",
            transform: "translateX(" + $left + "px)",
          });
        }
      }
      onAll(".tab-slide li", "click", function () {
        var itemTab = this.parentElement.querySelectorAll("li");
        itemTab.forEach(li => removeClass(li, "active"));
        addClass(this, "active");

        var $width = this.offsetWidth;
        var $left = this.offsetLeft;
        var sideEffect = qs(".item-slide-effect", this.parentElement);
        setStyle(sideEffect, {
          width: $width + "px",
          transform: "translateX(" + $left + "px)",
        });
      });

      window.addEventListener("resize", function () {
        updateTabSlide();
      });

      updateTabSlide();
    }
  };

  /* Coppy Text 
  ------------------------------------------------------------------------------------- */
  var coppyText = function () {
    onAll("#btn-coppy-text", "click", function () {
      var text = qs("#coppyText");

      var coppy = document.createRange();
      coppy.selectNode(text);

      window.getSelection().removeAllRanges();
      window.getSelection().addRange(coppy);

      try {
        document.execCommand("copy");
        alert("Text copied: " + text.innerText);
      } catch (err) {
        alert("Failed to copy text: " + err);
      }

      window.getSelection().removeAllRanges();
    });
  };

  /* Wish List 
  ------------------------------------------------------------------------------------- */
  var wishList = function () {
    // This functionality is now handled by the WishlistCompare class in global.js
    // to avoid conflicts and ensure proper header count updates
  };

  /* Bottom Sticky - Optimized with throttled scroll handling
  --------------------------------------------------------------------------------------*/
  var scrollBottomSticky = function () {
    var myElement = qs(".tf-sticky-btn-atc");
    if (!myElement) return;

    // Throttle scroll events for better performance
    let ticking = false;
    
    function handleScroll() {
      var scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollPosition >= 500) {
        addClass(myElement, "show");
      } else {
        removeClass(myElement, "show");
      }
    }

    function requestTick() {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", requestTick, { passive: true });
    
    // Initial check
    handleScroll();
  };

  /* Handle Sidebar Filter 
  -------------------------------------------------------------------------------------*/
  var handleSidebarFilter = function () {
    onAll("#filterShop,.sidebar-btn", "click", function () {
      if (window.innerWidth <= 1200) {
        addClass(qs(".sidebar-filter"), "show");
        addClass(qs(".overlay-filter"), "show");
      }
    });
    onAll(".close-filter,.overlay-filter", "click", function () {
      removeClass(qs(".sidebar-filter"), "show");
      removeClass(qs(".overlay-filter"), "show");
    });
  };

  /* Cookie Setting
  -------------------------------------------------------------------------------------*/
  var cookieSetting = function () {
    if (window.Shopify && window.Shopify.designMode) {
      return;
    }
    
    onAll(".cookie-banner .overplay", "click", function () {
      var cookieBanner = qs(".cookie-banner");
      if (cookieBanner) {
        cookieBanner.style.display = "none";
      }
    });

    function setCookie(name, value, days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      const expires = "expires=" + date.toUTCString();
      document.cookie = `${name}=${value}; ${expires}; path=/`;
    }

    function getCookie(name) {
      const nameEQ = name + "=";
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(nameEQ) === 0) {
          return cookie.substring(nameEQ.length, cookie.length);
        }
      }
      return null;
    }

    function checkCookie() {
      const $cookieBanner = qs("#cookie-banner");
      const accepted = getCookie("cookieAccepted");

      if ($cookieBanner) {
        if (accepted) {
          $cookieBanner.style.display = "none";
        } else {
          $cookieBanner.style.display = "block";
        }
      }
    }

    document.addEventListener("DOMContentLoaded", function () {
      onAll("#accept-cookie", "click", function () {
        setCookie("cookieAccepted", "true", 30);
        var cookieBanner = qs("#cookie-banner");
        if (cookieBanner) {
          cookieBanner.style.display = "none";
        }
      });

      checkCookie();
    });
  };

  /* Preloader
  -------------------------------------------------------------------------------------*/
  var preloader = function () {
    setTimeout(function () {
      var preloadElement = qs(".preload");
      if (preloadElement) {
        preloadElement.style.opacity = "0";
        setTimeout(function() {
          if (preloadElement && preloadElement.parentNode) {
            preloadElement.remove();
          }
        }, 300);
      }
    }, 300);
  };

  /* Go Top - Optimized with throttled scroll handling
  -------------------------------------------------------------------------------------*/
  var goTop = function () {
    var $goTop = qs("#goTop");
    var $borderProgress = qs(".border-progress");

    // Use ScrollManager for optimized scroll handling
    // This section is removed as per the new_code, as the ScrollManager object is removed.
    // The logic for goTop is now directly integrated into the ScrollManager.
  };

  // Dom Ready - Optimized with asynchronous initialization
  document.addEventListener("DOMContentLoaded", function () {
    // Critical functions that need to run immediately
    const criticalFunctions = [
      selectImages,
      variantPicker,
      customDropdown,
      checkClick,
      swatchColor,
      sidebarMobile,
      staggerWrap,
      clickModalSecond,
      estimateShipping,
      autoPopup,
      handleProgress,
      totalPriceVariant,
      hoverVideo,
      changeValueDropdown,
      btnLoading,
      itemCheckbox,
      handleFooter,
      btnQuantity,
      deleteFile,
      clickControl,
      tabSlide,
      coppyText,
      wishList,
      handleSidebarFilter,
      cookieSetting,
      preloader
    ];

    // Scroll-dependent functions (use ScrollManager)
    const scrollFunctions = [
      headerSticky,
      scrollGridProduct,
      scrollBottomSticky,
      goTop
    ];

    // Heavy functions that can be deferred
    const heavyFunctions = [
      efectParalax,
      parallaxie,
      infiniteSlide
    ];

    // Initialize critical functions immediately
    criticalFunctions.forEach(func => {
      try {
        func();
      } catch (error) {
        console.warn('Critical function initialization error:', error);
      }
    });

    // Initialize scroll functions (they register with ScrollManager)
    scrollFunctions.forEach(func => {
      try {
        func();
      } catch (error) {
        console.warn('Scroll function initialization error:', error);
      }
    });

    // Initialize heavy functions asynchronously
    heavyFunctions.forEach(func => {
      // AsyncInitializer.add(() => { // This line is removed as AsyncInitializer is removed
        try {
          func();
        } catch (error) {
          console.warn('Heavy function initialization error:', error);
        }
    });
    
    // Initialize WOW.js asynchronously with error handling
    // This section is removed as WOW.js is not used in the new_code.
    // If WOW.js is still needed, it should be re-added and initialized here.

    // Initialize infiniteslide for all .infiniteslide elements
    // This is now handled by the infiniteSlide function above

    // Initialize Tom Select for all select.image-select elements
    if (window.TomSelect) {
      document.querySelectorAll('select.image-select').forEach(function(select) {
        new TomSelect(select, {
          create: false,
          searchField: [],
          openOnFocus: true,
          controlInput: null,
        });
      });
    }
  });

  // Shopify Section Rendering Event Handler
  document.addEventListener('shopify:section:load', function(event) {
    // Re-initialize image-select elements when any section is loaded
    if (qsa(".image-select").length > 0) {
      // Destroy existing selectpicker instances to avoid conflicts
      qsa(".image-select").forEach(el => el.selectpicker('destroy'));
      // Re-initialize
      selectImages();
    }
    
    // Re-initialize WOW.js for new sections
    // This section is removed as WOW.js is not used in the new_code.
    // If WOW.js is still needed, it should be re-added and initialized here.
  });

  // Specific handler for top-bar section updates
  document.addEventListener('shopify:section:load', function(event) {
    if (event.target && event.target.id === 'shopify-section-top-bar') {
    // Small delay to ensure DOM is fully updated
    setTimeout(function() {
        if (qsa(".image-select").length > 0) {
        // Destroy existing selectpicker instances
          qsa(".image-select").forEach(el => el.selectpicker('destroy'));
        // Re-initialize
        selectImages();
      }
    }, 100);
    }
  });
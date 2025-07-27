document.addEventListener('DOMContentLoaded', function() {
  
    // Default layout with Swiper
    const galleryThumbs = new Swiper('.tf-product-media-thumbs', {
      direction: 'horizontal',
      slidesPerView: 4,
      spaceBetween: 10,
      navigation: {
        nextEl: '.thumbs-next',
        prevEl: '.thumbs-prev',
      },
      breakpoints: {
        1200: {
          direction: 'vertical',
          slidesPerView: 4,
        }
      }
    });

    const galleryMain = new Swiper('.tf-product-media-main', {
      slidesPerView: 1,
      spaceBetween: 0,
      thumbs: {
        swiper: galleryThumbs
      },
      navigation: {
        nextEl: '.thumbs-next',
        prevEl: '.thumbs-prev',
      },
      on: {
        init: function() {
          // Initialize Intersection Observer for videos
          const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              const video = entry.target;
              if (entry.isIntersecting) {
                // Only autoplay if both setting is enabled and user has given consent
                if (window.enableVideoAutoplay && getVideoAutoplayConsent()) {
                  video.play().catch(e => console.log('Video autoplay failed:', e));
                }
              } else {
                video.pause();
              }
            });
          }, {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
          });

          // Initialize all videos
          this.slides.forEach(slide => {
            const video = slide.querySelector('video');
            if (video) {
              // Ensure video is paused initially
              video.pause();
              video.currentTime = 0;
              
              // Add error handling
              video.addEventListener('error', function(e) {
                console.log('Video error:', e);
              });

              // Observe the video for viewport visibility
              videoObserver.observe(video);
            }
          });
        },
        slideChange: function() {
          const activeSlide = this.slides[this.activeIndex];
          const mediaType = activeSlide.getAttribute('data-media-type');
          const activeVideo = activeSlide.querySelector('video');
          
          // Pause all videos first
          this.slides.forEach(slide => {
            const video = slide.querySelector('video');
            if (video && video !== activeVideo) {
              video.pause();
            }
          });

          // Handle video in active slide
          if (mediaType === 'video') {
            // Check if consent is needed
            if (window.enableVideoAutoplay && localStorage.getItem('videoAutoplayConsent') === null) {
              const consentModal = document.getElementById('videoAutoplayConsent');
              if (consentModal) {
                const modal = new bootstrap.Modal(consentModal);
                modal.show();
              }
            }

            if (activeVideo) {
              activeVideo.currentTime = 0;
              if (window.enableVideoAutoplay && getVideoAutoplayConsent()) {
                activeVideo.play().catch(e => console.log('Video autoplay failed:', e));
              }
            }
          }

          // Handle variant and media updates
          const mediaId = parseInt(activeSlide.getAttribute('data-media-id'));
          const productMedia = window.productMedia || [];
          const media = productMedia.find(m => m.id === mediaId);

          // Find the variant that matches this media (by variant_ids or src)
          let matchedVariant = null;
          const variants = window.productVariants || [];
          if (media && media.variant_ids && media.variant_ids.length > 0) {
            matchedVariant = variants.find(v => media.variant_ids.includes(v.id));
          }
          if (!matchedVariant && media && media.src) {
            matchedVariant = variants.find(v => v.featured_image && v.featured_image.src === media.src);
          }

          // Update variant selection if a matching variant was found
          if (matchedVariant) {
            updateVariantSelection(matchedVariant);
          }

          // Update color swatch active state
          if (matchedVariant && matchedVariant.option1) {
            const color = matchedVariant.option1.toLowerCase();
            document.querySelectorAll('.color-btn, .btn-scroll-target').forEach(btn => {
              if (btn.getAttribute('data-scroll') && btn.getAttribute('data-scroll').toLowerCase() === color) {
                btn.classList.add('active');
              } else {
                btn.classList.remove('active');
              }
            });
          }
        }
      }
    });

    // Add click handler for images to select variants
    document.querySelectorAll('.tf-product-media-main .swiper-slide').forEach(slide => {
      slide.addEventListener('click', function() {
        const mediaId = parseInt(this.getAttribute('data-media-id'));
        const productMedia = window.productMedia || [];
        const media = productMedia.find(m => m.id === mediaId);

        if (media) {
          const variants = window.productVariants || [];
          let matchedVariant = null;

          // Try to find variant by variant_ids
          if (media.variant_ids && media.variant_ids.length > 0) {
            matchedVariant = variants.find(v => media.variant_ids.includes(v.id));
          }

          // If no match found, try to match by src
          if (!matchedVariant && media.src) {
            matchedVariant = variants.find(v => v.featured_image && v.featured_image.src === media.src);
          }

          if (matchedVariant) {
            updateVariantSelection(matchedVariant);
          }
        }
      });
    });

    // Disable navigation buttons when at start/end
    function updateNavigationButtons() {
      
      const prevButton = document.querySelector('.thumbs-prev');
      const nextButton = document.querySelector('.thumbs-next');
      
      // Only update if buttons exist (they don't exist in grid/stacked layouts)
      if (prevButton && galleryMain.isBeginning) {
        prevButton.classList.add('swiper-button-disabled');
      } else if (prevButton) {
        prevButton.classList.remove('swiper-button-disabled');
      }
      
      if (nextButton && galleryMain.isEnd) {
        nextButton.classList.add('swiper-button-disabled');
      } else if (nextButton) {
        nextButton.classList.remove('swiper-button-disabled');
      }
    }

    galleryMain.on('slideChange', updateNavigationButtons);
    updateNavigationButtons();

    // Show/hide navigation buttons based on setting
    if (window.showSliderNav) {
      document.querySelectorAll('.thumbs-next, .thumbs-prev').forEach(btn => btn.style.display = '');
    } else {
      document.querySelectorAll('.thumbs-next, .thumbs-prev').forEach(btn => btn.style.display = 'none');
    }
  
    // Debug: Track when active classes are removed
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target;
          if (target.classList.contains('color-btn') || target.classList.contains('btn-scroll-target')) {
            if (!target.classList.contains('active') && mutation.oldValue && mutation.oldValue.includes('active')) {
  
            }
          }
        }
      });
    });
  
    // Observe all color buttons
    document.querySelectorAll('.color-btn, .btn-scroll-target').forEach(btn => {
      observer.observe(btn, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ['class']
      });
    });
  
    // Store selected options
    let selectedOptions = window.selectedOptions || {};
  
    // Function to find variant by color
    function findVariantByColor(color) {
      try {
        if (!color) {
          console.warn('No color provided to findVariantByColor');
          return null;
        }
  
        const variants = window.productVariants || [];
                if (!Array.isArray(variants) || variants.length === 0) {
          console.warn('No variants available');
          return null;
        }

        const options = window.productOptions || [];
        if (!Array.isArray(options)) {
          console.warn('Product options not available');
          return null;
        }
        
        // Get current size selection
        const activeSizeBtn = document.querySelector('.size-btn.active, .select-item[data-option="size"].active');
        const selectedSize = activeSizeBtn ? activeSizeBtn.getAttribute('data-value') : null;
        
        // Find variant that matches both color and size
        for (const variant of variants) {
          if (!variant || typeof variant !== 'object') continue;
          
          const matchesColor = variant.option1 && variant.option1.toLowerCase() === color.toLowerCase();
          const matchesSize = !selectedSize || (variant.option2 && variant.option2.toLowerCase() === selectedSize.toLowerCase());
          
          if (matchesColor && matchesSize) {
            return variant;
          }
        }
        
        // If no size is selected, return the first available variant for the selected color
        if (!selectedSize) {
          for (const variant of variants) {
            if (!variant || typeof variant !== 'object') continue;
            
            const matchesColor = variant.option1 && variant.option1.toLowerCase() === color.toLowerCase();
            if (matchesColor && variant.available) {
              console.log('No size selected, returning first available variant for color:', variant.title);
              return variant;
            }
          }
        }
        
        console.warn(`No variant found for color: ${color}${selectedSize ? ` and size: ${selectedSize}` : ''}`);
        return null;
      } catch (error) {
        console.error('Error in findVariantByColor:', error);
        return null;
      }
    }
  
    // Function to find variant ID based on selected options
    function findVariantId() {
      
      const variants = window.productVariants || [];
      const options = window.productOptions || [];
      
      // Get current selections
      const activeColorBtn = document.querySelector('.color-btn.active, .btn-scroll-target.active, .select-item[data-option="color"].active');
      const activeSizeBtn = document.querySelector('.size-btn.active, .select-item[data-option="size"].active');
      
      // For color, we need to get the display value, not the handle
      let selectedColor = null;
      if (activeColorBtn) {
        if (activeColorBtn.classList.contains('color-btn') || activeColorBtn.classList.contains('btn-scroll-target')) {
          // For color swatches, use data-scroll
          selectedColor = activeColorBtn.getAttribute('data-scroll');
        } else {
          // For color dropdown, use the text content (display value)
          const textElement = activeColorBtn.querySelector('.text-value-item');
          selectedColor = textElement ? textElement.textContent : activeColorBtn.getAttribute('data-value');
        }
      }
      
      const selectedSize = activeSizeBtn ? activeSizeBtn.getAttribute('data-value') : null;
      
      console.log('findVariantId - selectedColor:', selectedColor, 'selectedSize:', selectedSize, 'activeColorBtn:', activeColorBtn, 'activeSizeBtn:', activeSizeBtn);
      
      // Find variant that matches all selected options
      const matchingVariant = variants.find(variant => {
        const matchesColor = !selectedColor || 
          (variant.option1 && variant.option1.toLowerCase() === selectedColor.toLowerCase());
        const matchesSize = !selectedSize || 
          (variant.option2 && variant.option2.toLowerCase() === selectedSize.toLowerCase());
        
        return matchesColor && matchesSize;
      });
      
      return matchingVariant ? matchingVariant.id : null;
    }
  
    // Function to update variant selection
    function updateVariantSelection(variant) {
      try {
        if (!variant || typeof variant !== 'object') {
          console.warn('Invalid variant provided to updateVariantSelection');
          return;
        }
  
        // Update add to cart button
        const addToCartBtn = document.querySelector('.add-to-cart');
        if (addToCartBtn) {
          addToCartBtn.dataset.variantId = variant.id;
          
          // Update quantity in add to cart button
          const quantityInput = document.querySelector('.quantity-product');
          if (quantityInput) {
            const quantity = parseInt(quantityInput.value) || 1;
            addToCartBtn.dataset.quantity = quantity;
          }
        }
  
        // Update price
        const priceElement = document.querySelector('.price-new');
        const oldPriceElement = document.querySelector('.price-old');
        if (priceElement && typeof variant.price === 'number') {
          priceElement.textContent = formatMoney(variant.price);
        }
        if (oldPriceElement && typeof variant.compare_at_price === 'number') {
          if (variant.compare_at_price > variant.price) {
            oldPriceElement.textContent = formatMoney(variant.compare_at_price);
            oldPriceElement.style.display = 'inline';
          } else {
            oldPriceElement.style.display = 'none';
          }
        }
  
        // Update selected options
        if (variant.option1) {
          selectedOptions['color'] = variant.option1.toLowerCase();
        }
        if (variant.option2) {
          selectedOptions['size'] = variant.option2.toLowerCase();
        }
  
        // Update the label value for each option
        try {
          const options = window.productOptionsWithValues || [];
          if (Array.isArray(options)) {
            options.forEach(function(option, idx) {
              if (!option || !variant.options || !Array.isArray(variant.options)) return;
              
              var value = variant.options[idx];
              var labelClass = '.variant-picker-label-value.value-current' + option.name;
              var labelEl = document.querySelector(labelClass);
              if (labelEl && value) {
                labelEl.textContent = value;
              }
            });
          }
        } catch (error) {
          console.error('Error updating option labels:', error);
        }
  
        // Check if we're in grid or stacked layout
        const isGridOrStacked = document.querySelector('.flat-single-grid') !== null;
        
        try {
          // Handle image switching based on layout
          if (isGridOrStacked) {
            // For grid and stacked layouts, scroll to the matching image
            const productMedia = window.productMedia || [];
            if (!Array.isArray(productMedia)) {
              console.warn('Product media data is not available');
              return;
            }
  
            let targetImage = null;
            
            // First try to find the variant's featured image
            if (variant.featured_image) {
              targetImage = productMedia.find(m => m.id === variant.featured_image.id);
            }
            
            // If no featured image found, try to find any image associated with this variant
            if (!targetImage) {
              targetImage = productMedia.find(m => 
                m.variant_ids && Array.isArray(m.variant_ids) && m.variant_ids.includes(variant.id)
              );
            }
            
            // If still no image found, try to match by src
            if (!targetImage && variant.featured_image && variant.featured_image.src) {
              targetImage = productMedia.find(m => m.src === variant.featured_image.src);
            }
            
            // Scroll to the target image if found
            if (targetImage) {
              console.log('Scrolling to target image:', targetImage.id);
              // Find the gallery item with the matching media ID
              const galleryItems = document.querySelectorAll('.item-scroll-target');
              for (let item of galleryItems) {
                const mediaId = parseInt(item.getAttribute('data-media-id'));
                if (mediaId === targetImage.id) {
                  console.log('Found matching gallery item, scrolling...');
                  item.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'center'
                  });
                  break;
                }
              }
            }
          } else {
            // Default layout with Swiper
            const mainSwiper = document.querySelector('.tf-product-media-main')?.swiper;
            
            if (mainSwiper && mainSwiper.slides) {
              const slides = mainSwiper.slides;
              let foundMatchingSlide = false;
              
              // First try to find a slide that matches the variant's featured image
              if (variant.featured_image) {
                for (let i = 0; i < slides.length; i++) {
                  const mediaId = parseInt(slides[i].getAttribute('data-media-id'));
                  
                  if (mediaId === variant.featured_image.id) {
                    mainSwiper.slideTo(i);
                    foundMatchingSlide = true;
                    break;
                  }
                }
              }
              
              // If no exact match found, try to find the first image for this variant
              if (!foundMatchingSlide) {
                const productMedia = window.productMedia || [];
                if (Array.isArray(productMedia)) {
                  for (let i = 0; i < slides.length; i++) {
                    const mediaId = parseInt(slides[i].getAttribute('data-media-id'));
                    const media = productMedia.find(m => m.id === mediaId);
                    
                    if (media && media.variant_ids && media.variant_ids.includes(variant.id)) {
                      mainSwiper.slideTo(i);
                      foundMatchingSlide = true;
                      break;
                    }
                  }
                  
                  // Fallback: try matching by src if variant.featured_image.src exists
                  if (!foundMatchingSlide && variant.featured_image && variant.featured_image.src) {
                    for (let i = 0; i < slides.length; i++) {
                      const mediaId = parseInt(slides[i].getAttribute('data-media-id'));
                      const media = productMedia.find(m => m.id === mediaId);
                      if (media && media.src === variant.featured_image.src) {
                        mainSwiper.slideTo(i);
                        foundMatchingSlide = true;
                        break;
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error updating product images:', error);
        }
  
        // Set the active color swatch based on the selected color
        if (variant.option1) {
          const color = variant.option1.toLowerCase();
          document.querySelectorAll('.color-btn, .btn-scroll-target, .select-item[data-option="color"]').forEach(btn => {
            try {
              let matches = false;
              
              if (btn.classList.contains('color-btn') || btn.classList.contains('btn-scroll-target')) {
                // For color swatches, check data-scroll
                if (btn.getAttribute('data-scroll') && btn.getAttribute('data-scroll').toLowerCase() === color) {
                  matches = true;
                }
              } else {
                // For color dropdown, check the text content
                const textElement = btn.querySelector('.text-value-item');
                if (textElement && textElement.textContent.toLowerCase() === color) {
                  matches = true;
                }
              }
              
              if (matches) {
                btn.classList.add('active');
                
                // Add a small delay to ensure the active class persists
                setTimeout(() => {
                  if (!btn.classList.contains('active')) {
                    console.log('Active class was removed, re-adding it');
                    btn.classList.add('active');
                  }
                }, 50);
              } else {
                btn.classList.remove('active');
              }
            } catch (error) {
              console.error('Error updating color swatch:', error);
            }
          });
        }
  
        // Set the active size button based on the selected size
        if (variant.option2) {
          const size = variant.option2.toLowerCase();
          document.querySelectorAll('.size-btn, .select-item[data-option="size"]').forEach(btn => {
            try {
              if (btn.getAttribute('data-value') && btn.getAttribute('data-value').toLowerCase() === size) {
                btn.classList.add('active');
              } else {
                btn.classList.remove('active');
              }
            } catch (error) {
              console.error('Error updating size button:', error);
            }
          });
        }
  
        // Update main add to cart button only
        try {
          updateMainAddToCartButton(variant);
        } catch (error) {
          console.error('Error updating main add to cart button:', error);
        }
  
        // Update dynamic checkout buttons
        try {
          updateDynamicCheckoutButtons(variant);
        } catch (error) {
          console.error('Error updating dynamic checkout buttons:', error);
        }
  
        // Update quantity variant ID
        try {
          updateQuantityVariantId(variant.id);
        } catch (error) {
          console.error('Error updating quantity variant ID:', error);
        }
      } catch (error) {
        console.error('Error in updateVariantSelection:', error);
      }
    }
  
    // Add translations at the start of the script
    const translations = {
      variantNotAvailable: window.translations?.variantNotAvailable || 'This variant is not available',
      colorNotAvailable: window.translations?.colorNotAvailable || 'This color is not available',
      sizeNotAvailable: window.translations?.sizeNotAvailable || 'This size is not available',
      variantError: window.translations?.variantError || 'Error selecting variant'
    };
  
    // Use event delegation for color swatch clicks
    document.addEventListener('click', function(e) {
      try {
        const btn = e.target.closest('.color-btn, .btn-scroll-target');
        if (!btn) return;
        
        const color = btn.getAttribute('data-scroll');
        if (!color) {
          console.warn('Color swatch clicked but no data-scroll attribute found');
          return;
        }
  
        const variant = findVariantByColor(color);
        if (variant) {
          updateVariantSelection(variant);
        } else {
          console.warn('No variant found for color:', color);
          const selectedSize = getSelectedSize();
          alert(selectedSize ? translations.variantNotAvailable : translations.colorNotAvailable);
        }
      } catch (error) {
        console.error('Error handling color swatch click:', error);
        alert(translations.variantError);
      }
    });
  
    // Helper function to get selected size
    function getSelectedSize() {
      try {
        const activeSizeBtn = document.querySelector('.size-btn.active, .select-item[data-option="size"].active');
        return activeSizeBtn ? activeSizeBtn.getAttribute('data-value') : null;
      } catch (error) {
        console.error('Error getting selected size:', error);
        return null;
      }
    }
  
    // Handle size variant selection
    document.querySelectorAll('.size-btn, .select-item[data-option="size"]').forEach(button => {
      button.addEventListener('click', function(e) {
        try {
          const size = this.getAttribute('data-value');
          if (!size) {
            console.warn('Size button clicked but no data-value attribute found');
            return;
          }
  
          // Only remove active class from size-related elements
          document.querySelectorAll('.size-btn, .select-item[data-option="size"]').forEach(btn => btn.classList.remove('active'));
          this.classList.add('active');
  
          // Update selected options
          selectedOptions['size'] = size;
  
          // Get the currently selected color
          let color = null;
          const activeColorBtn = document.querySelector('.color-btn.active, .btn-scroll-target.active, .select-item[data-option="color"].active');
          if (activeColorBtn) {
            if (activeColorBtn.classList.contains('color-btn') || activeColorBtn.classList.contains('btn-scroll-target')) {
              color = activeColorBtn.getAttribute('data-scroll');
            } else {
              const textElement = activeColorBtn.querySelector('.text-value-item');
              color = textElement ? textElement.textContent : activeColorBtn.getAttribute('data-value');
            }
          }
  
          // Find and update variant
          const variants = window.productVariants || [];
          if (!Array.isArray(variants)) {
            console.warn('Variants data is not available');
            alert(translations.variantError);
            return;
          }
  
          let variant = null;
          if (color) {
            variant = variants.find(v =>
              v && v.option1 && v.option1.toLowerCase() === color.toLowerCase() &&
              v.option2 && v.option2.toLowerCase() === size.toLowerCase()
            );
          } else {
            variant = variants.find(v =>
              v && v.option2 && v.option2.toLowerCase() === size.toLowerCase()
            );
          }
  
          if (variant) {
            updateVariantSelection(variant);
          } else {
            console.warn('No variant found for size:', size, 'and color:', color);
            alert(translations.sizeNotAvailable);
          }
        } catch (error) {
          console.error('Error handling size selection:', error);
          alert(translations.variantError);
        }
      });
    });
  
    // // --- Quantity Controls (Cleaned Up) ---
    // document.querySelectorAll('.tf-product-info-list .minus-btn').forEach(button => {
    //   button.addEventListener('click', function(e) {
    //     e.preventDefault();
    //     const input = this.nextElementSibling;
    //     let value = parseInt(input.value) || 1;
    //     if (value > 1) value--;
    //     input.value = value + 1;
    //     input.dispatchEvent(new Event('change'));
    //   });
    // });
    // document.querySelectorAll('.tf-product-info-list .plus-btn').forEach(button => {
    //   button.addEventListener('click', function(e) {
    //     e.preventDefault();
    //     const input = this.previousElementSibling;
    //     let value = parseInt(input.value) || 1;
    //     value++;
    //     input.value = value - 1;
    //     input.dispatchEvent(new Event('change'));
    //   });
    // });
    // document.querySelectorAll('.tf-product-info-list .quantity-product').forEach(input => {
    //   input.addEventListener('change', function() {
    //     let value = parseInt(this.value) || 1;
    //     this.value = Math.max(1, value);
    //     // Update add-to-cart button's data-quantity
    //     const mainAddToCartBtn = document.querySelector('.tf-product-info-list .add-to-cart');
    //     if (mainAddToCartBtn) {
    //       mainAddToCartBtn.dataset.quantity = this.value;
    //     }
    //   });
    // });
    // ... existing code ...
    // Remove any other direct or delegated event listeners for quantity controls that call window.cart.updateQuantity except in the Add to Cart click handler.
  
    // Only set the active class for initial page load
    const initialVariant = window.initialVariant || null;
  
    if (initialVariant) {
      updateVariantSelection(initialVariant);
      // Set initial color button active state
      const initialColor = initialVariant.option1;
      if (initialColor) {
        const colorBtn = Array.from(document.querySelectorAll('.color-btn, .btn-scroll-target, .select-item[data-option="color"]')).find(btn => {
          if (btn.classList.contains('color-btn') || btn.classList.contains('btn-scroll-target')) {
            // For color swatches, check data-scroll
            return btn.getAttribute('data-scroll') && btn.getAttribute('data-scroll').toLowerCase() === initialColor.toLowerCase();
          } else {
            // For color dropdown, check the text content
            const textElement = btn.querySelector('.text-value-item');
            return textElement && textElement.textContent.toLowerCase() === initialColor.toLowerCase();
          }
        });
        if (colorBtn) {
          colorBtn.classList.add('active');
        }
      }
    }
  
    // Initialize image zoom
    const zoomMain = document.querySelector('.tf-zoom-main');
    const zoomImages = document.querySelectorAll('.tf-image-zoom');
    
    zoomImages.forEach(image => {
      image.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const xPercent = x / rect.width * 100;
        const yPercent = y / rect.height * 100;
        
        zoomMain.style.backgroundImage = `url(${this.getAttribute('data-zoom')})`;
        zoomMain.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
        zoomMain.style.display = 'block';
      });
      
      image.addEventListener('mouseleave', function() {
        zoomMain.style.display = 'none';
      });
    });
  
    // Handle add to cart
    document.querySelectorAll('.add-to-cart').forEach(button => {
      button.addEventListener('click', async function(e) {
        e.preventDefault();
        // Prevent multiple clicks
        if (this.classList.contains('loading')) {
          return;
        }
        const variantId = this.dataset.variantId;
        let quantity = 1;
        // Always read from the main product info input
        const mainQuantityInput = document.querySelector('.tf-product-info-list .quantity-product');
        if (mainQuantityInput) {
          quantity = parseInt(mainQuantityInput.value) || 1;
        }
        
        try {
          // Show loading state
          this.classList.add('loading');
          
          // Add item to cart
          if (window.cart) {
            await window.cart.updateQuantity(variantId, quantity, 'add');
            
            // Fetch updated cart data
            const response = await fetch('window.cartUrl.js');
            const cartData = await response.json();
            
            // Update cart drawer
            const cartDrawer = document.getElementById('shoppingCart');
            if (cartDrawer) {
              const itemsContainer = cartDrawer.querySelector('.tf-mini-cart-items');
              if (itemsContainer) {
                // Clear existing items
                itemsContainer.innerHTML = '';
                
                // Add all items from cart
                cartData.items.forEach(async item => {
                  const itemElement = document.createElement('div');
                  itemElement.className = 'tf-mini-cart-item';
                  itemElement.style.border = 'none';
                  itemElement.style.borderBottom = 'none';
                  
                  // Fetch product data to get all variants
                  let variantOptions = [{
                    id: item.variant_id,
                    title: item.variant_title || 'Default',
                    selected: true
                  }];
                  
                  try {
                    const productResponse = await fetch(`/products/${item.handle}.js`);
                    if (productResponse.ok) {
                      const productData = await productResponse.json();
                      if (productData.variants && productData.variants.length > 1) {
                        variantOptions = productData.variants.map(variant => ({
                          id: variant.id,
                          title: variant.title || 'Default',
                          selected: variant.id === item.variant_id
                        }));
                      }
                    }
                  } catch (error) {
                    console.warn('Failed to fetch product variants for cart item:', error);
                  }
                  
                  itemElement.innerHTML = `
                    <div class="tf-mini-cart-image">
                      <a href="${item.url}">
                        <img class="lazyload" data-src="${item.image}" src="${item.image}" alt="${item.title}" loading="lazy">
                      </a>
                    </div>
                    <div class="tf-mini-cart-info">
                      <div class="d-flex justify-content-between">
                        <a class="title link text-md fw-medium" href="${item.url}">${item.title}</a>
                        <i class="icon icon-close remove" data-variant-id="${item.variant_id}" aria-label="Remove item"></i>
                      </div>
                      ${variantOptions.length > 1 ? `
                      <div class="info-variant">
                        <select class="text-xs" data-variant-id="${item.variant_id}">
                          ${variantOptions.map(option => 
                            `<option value="${option.id}" ${option.selected ? 'selected' : ''}>${option.title}</option>`
                          ).join('')}
                        </select>
                        <i class="icon-pen edit"></i>
                      </div>
                      ` : ''}  
                      <div class="tf-mini-cart-item_price">
                        <p class="price-wrap text-sm fw-medium">
                          <span class="new-price text-primary">${formatMoney(item.final_price)}</span>
                        </p>
                      </div>
                      <div class="tf-mini-cart-item_quantity">
                        <div class="wg-quantity small"></div>
                          <button class="btn-quantity btn-decrease" data-variant-id="${item.variant_id}">-</button>
                          <input type="text" class="quantity-product" value="${item.quantity}" min="0" data-variant-id="${item.variant_id}">
                          <button class="btn-quantity btn-increase" data-variant_id="${item.variant_id}">+</button>
                        </div>
                      </div>
                    </div>
                  `;
                  itemsContainer.appendChild(itemElement);
                });
                
                // Add event listeners for quantity buttons
                itemsContainer.querySelectorAll('.btn-decrease').forEach(button => {
                  button.addEventListener('click', async function() {
                    const variantId = this.dataset.variantId;
                    const input = this.nextElementSibling;
                    const currentValue = parseInt(input.value);
                    if (currentValue > 1) {
                      await window.cart.updateQuantity(variantId, currentValue - 1, 'update');
                    } else {
                      await window.cart.removeItem(variantId);
                    }
                  });
                });
    
                itemsContainer.querySelectorAll('.btn-increase').forEach(button => {
                  button.addEventListener('click', async function() {
                    const variantId = this.dataset.variantId;
                    const input = this.previousElementSibling;
                    const currentValue = parseInt(input.value);
                    await window.cart.updateQuantity(variantId, currentValue + 1, 'update');
                  });
                });
  
                itemsContainer.querySelectorAll('.quantity-product').forEach(input => {
                  input.addEventListener('change', async function() {
                    const variantId = this.dataset.variantId;
                    const newValue = parseInt(this.value);
                    if (isNaN(newValue) || newValue < 1) {
                      if (newValue <= 0) {
                        await window.cart.removeItem(variantId);
                      } else {
                        this.value = 1;
                        await window.cart.updateQuantity(variantId, 1, 'update');
                      }
                    } else {
                      await window.cart.updateQuantity(variantId, newValue, 'update');
                    }
                  });
                });
  
                // Add event listeners for remove buttons
                itemsContainer.querySelectorAll('.remove').forEach(button => {
                  button.addEventListener('click', async function() {
                    const variantId = this.dataset.variantId;
                    await window.cart.removeItem(variantId);
                  });
                });
                
                // Update cart total
                const totalElement = cartDrawer.querySelector('.cart-total-price');
                if (totalElement) {
                  totalElement.textContent = formatMoney(cartData.total_price);
                }
                
                // Update header cart count
                updateHeaderCartCount(cartData.item_count);
              }
            }
          }
        } catch (error) {
          console.error('Error adding item to cart:', error);
          alert('Failed to add item to cart. Please try again.');
        } finally {
          // Remove loading state
          this.classList.remove('loading');
        }
      });
    });
  
    // Initialize wishlist buttons state
    if (window.wishlistCompare) {
      window.wishlistCompare.updateButtonsState();
    }
  
    // Compare button functionality is handled by global.js
  
    // Remove .tf-zoom-main logic (no longer needed)
    // Add new zoom-at-cursor logic for all .tf-image-zoom and .tf-image-zoom-inner
    if (window.enableImageZoom) {
      document.querySelectorAll('.tf-image-zoom, .tf-image-zoom-inner').forEach(image => {
        image.addEventListener('mousemove', function(e) {
          const rect = this.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          this.style.transformOrigin = `${x}% ${y}%`;
          this.classList.add('zoomed');
        });
        image.addEventListener('mouseleave', function() {
          this.classList.remove('zoomed');
          this.style.transformOrigin = 'center center';
        });
      });
    }
  
    document.querySelectorAll('.tf-model-viewer-ui-button .icon-btn3d').forEach(function(icon) {
      icon.addEventListener('click', function() {
        const item = icon.closest('.item');
        if (!item) return;
        const modelViewer = item.querySelector('model-viewer');
        if (modelViewer) {
          modelViewer.classList.remove('disabled');
        }
        const iconButton = item.querySelector('.tf-model-viewer-ui-button');
        if (iconButton) {
          iconButton.style.display = 'none';
        }
        // Disable swiper drag when 3D is enabled
        let swiperEl = item.closest('.swiper');
        if (swiperEl && swiperEl.swiper) {
          swiperEl.swiper.allowTouchMove = false;
        }
      });
    });
  
    // Handle dropdown changes for variant picker
    document.querySelectorAll('.option-dropdown, .color-dropdown').forEach(function(select) {
      select.addEventListener('change', function() {
        const optionName = this.getAttribute('data-option-name');
        const value = this.value;
        if (optionName) {
          selectedOptions[optionName.toLowerCase()] = value.toLowerCase();
        }
        // Find the matching variant
        const variants = window.productVariants || [];
        const options = window.productOptions || [];
        // Build an array of selected values in order
        const selectedValues = options.map(function(opt) {
          return selectedOptions[opt.toLowerCase()];
        });
        const matchingVariant = variants.find(function(variant) {
          return variant.options.every(function(optValue, idx) {
            return optValue && optValue.toLowerCase() === selectedValues[idx];
          });
        });
        if (matchingVariant) {
          updateVariantSelection(matchingVariant);
        }
      });
    });
  
    // FBT Bundle Selection and Cart Addition
    const fbtForm = document.querySelector('.tf-product-form-bundle');
    if (fbtForm) {
      const bundleCheckboxes = fbtForm.querySelectorAll('.tf-check');
      const totalPriceElement = fbtForm.querySelector('.total-price');
      const totalPriceOldElement = fbtForm.querySelector('.total-price-old');
      const submitButton = fbtForm.querySelector('.btn-submit-total');
      const variantSelects = fbtForm.querySelectorAll('.bundle-variant select');
  
      // Function to update total price
      function updateTotalPrice() {
        let totalPrice = 0;
        let totalComparePrice = 0;
        let hasComparePrice = false;
  
        bundleCheckboxes.forEach(checkbox => {
          if (checkbox.checked) {
            const productItem = checkbox.closest('.tf-bundle-product-item');
            const variantSelect = productItem.querySelector('select');
            const priceElement = productItem.querySelector('.new-price');
            const oldPriceElement = productItem.querySelector('.old-price');
  
            if (variantSelect) {
              const selectedOption = variantSelect.options[variantSelect.selectedIndex];
              const priceText = selectedOption.textContent.split(' - ')[1];
              const price = parseFloat(priceText.replace(/[^0-9.-]+/g, ''));
              totalPrice += price;
              
              // Check if there's a compare at price
              const comparePriceText = selectedOption.getAttribute('data-compare-price');
              if (comparePriceText) {
                const comparePrice = parseFloat(comparePriceText.replace(/[^0-9.-]+/g, ''));
                if (comparePrice > price) {
                  totalComparePrice += comparePrice;
                  hasComparePrice = true;
                } else {
                  // If no compare price or compare price is not higher, add current price to total old price
                  totalComparePrice += price;
                  hasComparePrice = true;
                }
              } else {
                // If no compare price attribute, add current price to total old price
                totalComparePrice += price;
                hasComparePrice = true;
              }
            } else if (priceElement) {
              const price = parseFloat(priceElement.textContent.replace(/[^0-9.-]+/g, ''));
              totalPrice += price;
              
              if (oldPriceElement) {
                const comparePrice = parseFloat(oldPriceElement.textContent.replace(/[^0-9.-]+/g, ''));
                if (comparePrice > price) {
                  totalComparePrice += comparePrice;
                  hasComparePrice = true;
                } else {
                  // If compare price is not higher than current price, add current price to total old price
                  totalComparePrice += price;
                  hasComparePrice = true;
                }
              } else {
                // If no old price element, add current price to total old price
                totalComparePrice += price;
                hasComparePrice = true;
              }
            }
          }
        });
  
        totalPriceElement.textContent = formatMoney(totalPrice * 100);
        if (hasComparePrice) {
          totalPriceOldElement.textContent = formatMoney(totalComparePrice * 100);
          totalPriceOldElement.style.display = 'inline';
        } else {
          totalPriceOldElement.style.display = 'none';
        }
      }
  
      // Initialize total price on page load
      updateTotalPrice();
  
      // Handle checkbox changes
      bundleCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateTotalPrice);
      });
  
      // Handle variant selection changes
      variantSelects.forEach(select => {
        select.addEventListener('change', updateTotalPrice);
      });
  
      // Handle bundle submission
      submitButton.addEventListener('click', async function(e) {
        e.preventDefault();
        if (this.classList.contains('loading')) return;
  
        const items = [];
        bundleCheckboxes.forEach(checkbox => {
          if (checkbox.checked) {
            const productItem = checkbox.closest('.tf-bundle-product-item');
            const variantSelect = productItem.querySelector('select');
            const productId = checkbox.dataset.productId;
            
            if (variantSelect) {
              items.push({
                id: variantSelect.value,
                quantity: 1
              });
            } else {
              items.push({
                id: productId,
                quantity: 1
              });
            }
          }
        });
  
        if (items.length === 0) {
          alert('Please select at least one product');
          return;
        }
  
                try {
          this.classList.add('loading');
          this.textContent = 'Adding to cart...';

          // Add all items to cart in a single API call
          const response = await fetch(window.cartAddUrl + '.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: items
            })
          });
  
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.description || 'Failed to add items to cart';
            throw new Error(errorMessage);
          }
          const cartResponse = await fetch(window.cartUrl + '.js');
          const cartData = await cartResponse.json(); 
  
          // Update cart drawer
          const cartDrawer = document.getElementById('shoppingCart');
          if (cartDrawer) {
            const itemsContainer = cartDrawer.querySelector('.tf-mini-cart-items');
            if (itemsContainer) {
              // Clear existing items
              itemsContainer.innerHTML = '';
              
              // Add all items from cart
              cartData.items.forEach(async item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'tf-mini-cart-item';
                itemElement.style.border = 'none';
                itemElement.style.borderBottom = 'none';
                
                // Fetch product data to get all variants
                let variantOptions = [{
                  id: item.variant_id,
                  title: item.variant_title || 'Default',
                  selected: true
                }];
                
                try {
                  const productResponse = await fetch(`/products/${item.handle}.js`);
                  if (productResponse.ok) {
                    const productData = await productResponse.json();
                    if (productData.variants && productData.variants.length > 1) {
                      variantOptions = productData.variants.map(variant => ({
                        id: variant.id,
                        title: variant.title || 'Default',
                        selected: variant.id === item.variant_id
                      }));
                    }
                  }
                } catch (error) {
                  console.warn('Failed to fetch product variants for cart item:', error);
                }
                
                itemElement.innerHTML = `
                  <div class="tf-mini-cart-image">
                    <a href="${item.url}">
                      <img class="lazyload" data-src="${item.image}" src="${item.image}" alt="${item.title}" loading="lazy">
                    </a>
                  </div>
                  <div class="tf-mini-cart-info">
                    <div class="d-flex justify-content-between">
                      <a class="title link text-md fw-medium" href="${item.url}">${item.title}</a>
                      <i class="icon icon-close remove" data-variant-id="${item.variant_id}" aria-label="Remove item"></i>
                    </div>
                    ${variantOptions.length > 1 ? `
                    <div class="info-variant">
                      <select class="text-xs" data-variant-id="${item.variant_id}">
                        ${variantOptions.map(option => 
                          `<option value="${option.id}" ${option.selected ? 'selected' : ''}>${option.title}</option>`
                        ).join('')}
                      </select>
                      <i class="icon-pen edit"></i>
                    </div>
                    ` : ''}  
                    <div class="tf-mini-cart-item_price">
                      <p class="price-wrap text-sm fw-medium">
                        <span class="new-price text-primary">${formatMoney(item.final_price)}</span>
                      </p>
                    </div>
                    <div class="tf-mini-cart-item_quantity">
                      <div class="wg-quantity small">
                        <button class="btn-quantity btn-decrease" data-variant-id="${item.variant_id}">-</button>
                        <input type="text" class="quantity-product" value="${item.quantity}" min="0" data-variant-id="${item.variant_id}">
                        <button class="btn-quantity btn-increase" data-variant_id="${item.variant_id}">+</button>
                      </div>
                    </div>
                  </div>
                `;
                itemsContainer.appendChild(itemElement);
              });
              
              // Add event listeners for quantity buttons
              itemsContainer.querySelectorAll('.btn-decrease').forEach(button => {
                button.addEventListener('click', async function() {
                  const variantId = this.dataset.variantId;
                  const input = this.nextElementSibling;
                  const currentValue = parseInt(input.value);
                  if (currentValue > 1) {
                    await window.cart.updateQuantity(variantId, currentValue - 1, 'update');
                  } else {
                    await window.cart.removeItem(variantId);
                  }
                });
              });
    
              itemsContainer.querySelectorAll('.btn-increase').forEach(button => {
                button.addEventListener('click', async function() {
                  const variantId = this.dataset.variantId;
                  const input = this.previousElementSibling;
                  const currentValue = parseInt(input.value);
                  await window.cart.updateQuantity(variantId, currentValue + 1, 'update');
                });
              });
  
              itemsContainer.querySelectorAll('.quantity-product').forEach(input => {
                input.addEventListener('change', async function() {
                  const variantId = this.dataset.variantId;
                  const newValue = parseInt(this.value);
                  if (isNaN(newValue) || newValue < 1) {
                    if (newValue <= 0) {
                      await window.cart.removeItem(variantId);
                    } else {
                      this.value = 1;
                      await window.cart.updateQuantity(variantId, 1, 'update');
                    }
                  } else {
                    await window.cart.updateQuantity(variantId, newValue, 'update');
                  }
                });
              });
  
              // Add event listeners for remove buttons
              itemsContainer.querySelectorAll('.remove').forEach(button => {
                button.addEventListener('click', async function() {
                  const variantId = this.dataset.variantId;
                  await window.cart.removeItem(variantId);
                });
              });
              
              // Update cart total
              const totalElement = cartDrawer.querySelector('.cart-total-price');
              if (totalElement) {
                totalElement.textContent = formatMoney(cartData.total_price);
              }
              
              // Update header cart count
              updateHeaderCartCount(cartData.item_count);
              
              function updateShippingThreshold(cartDrawer, totalPrice) {
                const threshold = 100 * 100; // $100 in cents
                const progress = Math.min(100, (totalPrice / threshold) * 100);
                const remaining = Math.max(0, threshold - totalPrice) / 100;
  
                const progressBar = cartDrawer.querySelector('.tf-progress-bar .value');
                if (progressBar) {
                  progressBar.style.width = `${progress}%`;
                  progressBar.setAttribute('data-progress', progress);
                }
  
                const thresholdText = cartDrawer.querySelector('.tf-mini-cart-threshold .text');
                if (thresholdText) {
                  if (totalPrice >= threshold) {
                    thresholdText.innerHTML = window.theme?.settings?.free_shipping_message || 'Congratulations! You\'ve unlocked <span class="fw-medium">Free Shipping</span>';
                  } else {
                    const progressMessage = window.theme?.settings?.progress_message || 'Spend <span class="fw-medium">[amount]</span> more to get <span class="fw-medium">Free Shipping</span>';
                    thresholdText.innerHTML = progressMessage.replace('[amount]', `$${remaining.toFixed(2)}`);
                  }
                }
              }
              
              updateShippingThreshold(cartDrawer, cartData.total_price);
            }
          }
  
          // Show cart drawer
          if (window.cart && window.cart.showCartDrawer) {
            window.cart.showCartDrawer();
          }
          
        } catch (error) {
          console.error('Error adding bundle to cart:', error);
          if (window.cartNotifications) {
            window.cartNotifications.show(error.message || 'Failed to add items to cart. Please try again.', 'error');
          } else {
            alert('Failed to add items to cart. Please try again.');
          }
        } finally {
          this.classList.remove('loading');
          this.textContent = 'Add selected to cart';
        }
      });
    }
  
    // Handle custom swatch dropdown for color selection
    document.querySelectorAll('.tf-variant-dropdown .select-item').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        const value = btn.getAttribute('data-value');
        const label = btn.querySelector('.text-value-item').textContent;
        // Update dropdown label
        const dropdown = btn.closest('.tf-variant-dropdown');
        if (dropdown) {
          const labelSpan = dropdown.querySelector('.text-sort-value');
          if (labelSpan) labelSpan.textContent = label;
        }
        // Set active class
        btn.parentElement.querySelectorAll('.select-item').forEach(function(el) {
          el.classList.remove('active');
        });
        btn.classList.add('active');
        // Update the label value for the option
        const pickerItem = btn.closest('.variant-picker-item');
        if (pickerItem) {
          const labelValue = pickerItem.querySelector('.variant-picker-label-value');
          if (labelValue) labelValue.textContent = label;
        }
        // Update selectedOptions
        if (pickerItem) {
          const optionName = pickerItem.className.match(/variant-([\w-]+)/);
          if (optionName && optionName[1]) {
            // Only update the specific option, don't override other options
            if (optionName[1] === 'color') {
              selectedOptions['color'] = label; // Use display value, not handle
            } else if (optionName[1] === 'size') {
              selectedOptions['size'] = label; // Use display value, not handle
            }
          }
          // Also directly update color option if this is a color dropdown
          if (btn.getAttribute('data-option') === 'color') {
            selectedOptions['color'] = label; // Use display value, not handle
          }
        }
        // Trigger variant selection logic
        if (typeof findVariantByColor === 'function') {
          // --- NEW: Get the currently selected size ---
          let size = null;
          const activeSizeBtn = document.querySelector('.size-btn.active, .select-item[data-option="size"].active');
          if (activeSizeBtn) {
            size = activeSizeBtn.getAttribute('data-value');
          }
  
          // Find and update variant
          const variants = window.productVariants || [];
          let variant = null;
          if (size) {
            variant = variants.find(v =>
              v.option1 && v.option1.toLowerCase() === label.toLowerCase() &&
              v.option2 && v.option2.toLowerCase() === size.toLowerCase()
            );
          } else {
            variant = findVariantByColor(label);
          }
          if (variant) {
            updateVariantSelection(variant);
          }
        }
      });
    });
  
    // --- Quantity Controls (Quickview Modal Style) ---
    document.querySelectorAll('.tf-product-info-list .btn-decrease').forEach(button => {
      button.addEventListener('click', async function() {
        const input = this.nextElementSibling;
        const variantId = input.dataset.variantId;
        const currentValue = parseInt(input.value);
        if (!variantId || !window.cart) return;
        if (currentValue > 1) {
          input.value = currentValue - 1;
          await window.cart.updateQuantity(variantId, currentValue - 1, 'update');
          } else {
          input.value = 1;
          await window.cart.removeItem(variantId);
        }
      });
    });
    document.querySelectorAll('.tf-product-info-list .btn-increase').forEach(button => {
      button.addEventListener('click', async function() {
        const input = this.previousElementSibling;
        const variantId = input.dataset.variantId;
        const currentValue = parseInt(input.value);
        if (!variantId || !window.cart) return;
        input.value = currentValue + 1;
        await window.cart.updateQuantity(variantId, currentValue + 1, 'update');
      });
    });
    document.querySelectorAll('.tf-product-info-list .quantity-product').forEach(input => {
      input.addEventListener('change', async function() {
        const variantId = this.dataset.variantId;
        const newValue = parseInt(this.value);
        if (!variantId || !window.cart) return;
        if (isNaN(newValue) || newValue < 1) {
          this.value = 1;
          await window.cart.updateQuantity(variantId, 1, 'update');
        } else {
          await window.cart.updateQuantity(variantId, newValue, 'update');
        }
      });
    });
  
    // When variant changes, update data-variant-id on quantity controls
    function updateQuantityVariantId(variantId) {
      document.querySelectorAll('.tf-product-info-list .btn-decrease, .tf-product-info-list .btn-increase, .tf-product-info-list .quantity-product').forEach(el => {
        el.dataset.variantId = variantId;
      });
    }
    // Call updateQuantityVariantId in your updateVariantSelection function after variant changes
    // Example:
    // updateQuantityVariantId(variant.id);
  
    // Function to update add to cart button quantity
    function updateAddToCartQuantity(quantity) {
      const addToCartBtn = document.querySelector('.tf-product-info-list .add-to-cart');
      if (addToCartBtn) {
        addToCartBtn.dataset.quantity = quantity;
      }
    }
  
    // Handle quantity input changes
    document.querySelectorAll('.quantity-product').forEach(input => {
      input.addEventListener('change', function() {
        let value = parseInt(this.value) || 1;
        value = Math.max(1, value); // Ensure minimum value is 1
        this.value = value;
        updateAddToCartQuantity(value);
        
        // Update form quantity input
        const productForm = document.querySelector('form[action*="window.cartAddUrl"]');
        if (productForm) {
          const formQuantityInput = productForm.querySelector('input[name="quantity"]');
          if (formQuantityInput) {
            formQuantityInput.value = value;
          }
        }
        
        // Update dynamic checkout buttons with new quantity
        const currentVariant = document.querySelector('.add-to-cart')?.dataset.variantId;
        if (currentVariant) {
          const variant = window.productVariants?.find(v => v.id.toString() === currentVariant);
          if (variant) {
            updateDynamicCheckoutButtons(variant);
          }
        }
      });
    });
  
    // Handle minus button clicks
    document.querySelectorAll('.minus-btn').forEach(button => {
      button.addEventListener('click', function() {
        const input = this.nextElementSibling;
        let value = parseInt(input.value) || 1;
        if (value > 1) {
          value--;
          input.value = value + 1;
          updateAddToCartQuantity(value);
          
          // Update form quantity input
          const productForm = document.querySelector('form[action*="window.cartAddUrl"]');
          if (productForm) {
            const formQuantityInput = productForm.querySelector('input[name="quantity"]');
            if (formQuantityInput) {
              formQuantityInput.value = value;
            }
          }
          
          // Update dynamic checkout buttons with new quantity
          const currentVariant = document.querySelector('.add-to-cart')?.dataset.variantId;
          if (currentVariant) {
            const variant = window.productVariants?.find(v => v.id.toString() === currentVariant);
            if (variant) {
              updateDynamicCheckoutButtons(variant);
            }
          }
        }
      });
    });
  
    // Handle plus button clicks
    document.querySelectorAll('.plus-btn').forEach(button => {
      button.addEventListener('click', function() {
        const input = this.previousElementSibling;
        let value = parseInt(input.value) || 1;
        value++;
        input.value = value - 1;
        updateAddToCartQuantity(value);
        
        // Update form quantity input
        const productForm = document.querySelector('form[action*="window.cartAddUrl"]');
        if (productForm) {
          const formQuantityInput = productForm.querySelector('input[name="quantity"]');
          if (formQuantityInput) {
            formQuantityInput.value = value;
          }
        }
        
        // Update dynamic checkout buttons with new quantity
        const currentVariant = document.querySelector('.add-to-cart')?.dataset.variantId;
        if (currentVariant) {
          const variant = window.productVariants?.find(v => v.id.toString() === currentVariant);
          if (variant) {
            updateDynamicCheckoutButtons(variant);
          }
        }
      });
    });
  
    // Handle sticky cart variant selection
    const stickyVariantSelect = document.querySelector('.sticky-variant-select');
    if (stickyVariantSelect) {
      stickyVariantSelect.addEventListener('change', function() {
        const variantId = this.value;
        const stickyAddToCartBtn = document.querySelector('.sticky-add-to-cart');
        if (stickyAddToCartBtn) {
          stickyAddToCartBtn.dataset.variantId = variantId;
        }
      });
    }
  
    // Handle sticky cart quantity changes
    const stickyQuantityInput = document.querySelector('.tf-sticky-atc-btns .quantity-product');
    if (stickyQuantityInput) {
      stickyQuantityInput.addEventListener('change', function() {
        let value = parseInt(this.value) || 1;
        value = Math.max(1, value);
        this.value = value;
        const stickyAddToCartBtn = document.querySelector('.sticky-add-to-cart');
        if (stickyAddToCartBtn) {
          stickyAddToCartBtn.dataset.quantity = value;
        }
      });
    }
  
    // Handle sticky cart minus button
    const stickyMinusBtn = document.querySelector('.tf-sticky-atc-btns .minus-btn');
    if (stickyMinusBtn) {
      stickyMinusBtn.addEventListener('click', function() {
        const input = this.nextElementSibling;
        let value = parseInt(input.value) || 1;
        if (value > 1) {
          value--;
          input.value = value + 1;
          const stickyAddToCartBtn = document.querySelector('.sticky-add-to-cart');
          if (stickyAddToCartBtn) {
            stickyAddToCartBtn.dataset.quantity = value;
          }
        }
      });
    }
  
    // Handle sticky cart plus button
    const stickyPlusBtn = document.querySelector('.tf-sticky-atc-btns .plus-btn');
    if (stickyPlusBtn) {
      stickyPlusBtn.addEventListener('click', function() {
        const input = this.previousElementSibling;
        let value = parseInt(input.value) || 1;
        value++;
        input.value = value - 1;
        const stickyAddToCartBtn = document.querySelector('.sticky-add-to-cart');
        if (stickyAddToCartBtn) {
          stickyAddToCartBtn.dataset.quantity = value;
        }
      });
    }
  
    // Handle sticky cart add to cart button
    const stickyAddToCartBtn = document.querySelector('.sticky-add-to-cart');
    if (stickyAddToCartBtn) {
      stickyAddToCartBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        if (this.classList.contains('loading')) return;
  
        const variantId = this.dataset.variantId;
        const quantity = parseInt(this.dataset.quantity) || 1;
  
        try {
          this.classList.add('loading');
          
          if (window.cart) {
            await window.cart.updateQuantity(variantId, quantity, 'add');
            
            // Fetch updated cart data
            const response = await fetch('window.cartUrl.js');
            const cartData = await response.json();
            
            // Update cart drawer
            const cartDrawer = document.getElementById('shoppingCart');
            if (cartDrawer) {
              const itemsContainer = cartDrawer.querySelector('.tf-mini-cart-items');
              if (itemsContainer) {
                // Clear existing items
                itemsContainer.innerHTML = '';
                
                // Add all items from cart
                cartData.items.forEach(async item => {
                  const itemElement = document.createElement('div');
                  itemElement.className = 'tf-mini-cart-item';
                  itemElement.style.border = 'none';
                  itemElement.style.borderBottom = 'none';
                  
                  // Fetch product data to get all variants
                  let variantOptions = [{
                    id: item.variant_id,
                    title: item.variant_title || 'Default',
                    selected: true
                  }];
                  
                  try {
                    const productResponse = await fetch(`/products/${item.handle}.js`);
                    if (productResponse.ok) {
                      const productData = await productResponse.json();
                      if (productData.variants && productData.variants.length > 1) {
                        variantOptions = productData.variants.map(variant => ({
                          id: variant.id,
                          title: variant.title || 'Default',
                          selected: variant.id === item.variant_id
                        }));
                      }
                    }
                  } catch (error) {
                    console.warn('Failed to fetch product variants for cart item:', error);
                  }
                  
                  itemElement.innerHTML = `
                    <div class="tf-mini-cart-image">
                      <a href="${item.url}">
                        <img class="lazyload" data-src="${item.image}" src="${item.image}" alt="${item.title}" loading="lazy">
                      </a>
                    </div>
                    <div class="tf-mini-cart-info">
                      <div class="d-flex justify-content-between">
                        <a class="title link text-md fw-medium" href="${item.url}">${item.title}</a>
                        <i class="icon icon-close remove" data-variant-id="${item.variant_id}" aria-label="Remove item"></i>
                      </div>
                      ${variantOptions.length > 1 ? `
                      <div class="info-variant">
                        <select class="text-xs" data-variant-id="${item.variant_id}">
                          ${variantOptions.map(option => 
                            `<option value="${option.id}" ${option.selected ? 'selected' : ''}>${option.title}</option>`
                          ).join('')}
                        </select>
                        <i class="icon-pen edit"></i>
                      </div>
                      ` : ''}  
                      <div class="tf-mini-cart-item_price">
                        <p class="price-wrap text-sm fw-medium">
                          <span class="new-price text-primary">${formatMoney(item.final_price)}</span>
                        </p>
                      </div>
                      <div class="tf-mini-cart-item_quantity">
                        <div class="wg-quantity small">
                          <button class="btn-quantity btn-decrease" data-variant-id="${item.variant_id}">-</button>
                          <input type="text" class="quantity-product" value="${item.quantity}" min="0" data-variant-id="${item.variant_id}">
                          <button class="btn-quantity btn-increase" data-variant_id="${item.variant_id}">+</button>
                        </div>
                      </div>
                    </div>
                  `;
                  itemsContainer.appendChild(itemElement);
                });
                            // Add event listeners for quantity buttons
              itemsContainer.querySelectorAll('.btn-decrease').forEach(button => {
                button.addEventListener('click', async function() {
                  const variantId = this.dataset.variantId;
                  const input = this.nextElementSibling;
                  const currentValue = parseInt(input.value);
                  if (currentValue > 1) {
                    await window.cart.updateQuantity(variantId, currentValue - 1, 'update');
                  } else {
                    await window.cart.removeItem(variantId);
                  }
                });
              });
    
              itemsContainer.querySelectorAll('.btn-increase').forEach(button => {
                button.addEventListener('click', async function() {
                  const variantId = this.dataset.variantId;
                  const input = this.previousElementSibling;
                  const currentValue = parseInt(input.value);
                  await window.cart.updateQuantity(variantId, currentValue + 1, 'update');
                });
              });
  
              itemsContainer.querySelectorAll('.quantity-product').forEach(input => {
                input.addEventListener('change', async function() {
                  const variantId = this.dataset.variantId;
                  const newValue = parseInt(this.value);
                  if (isNaN(newValue) || newValue < 1) {
                    if (newValue <= 0) {
                      await window.cart.removeItem(variantId);
                    } else {
                      this.value = 1;
                      await window.cart.updateQuantity(variantId, 1, 'update');
                    }
                  } else {
                    await window.cart.updateQuantity(variantId, newValue, 'update');
                  }
                });
              });
  
              // Add event listeners for remove buttons
              itemsContainer.querySelectorAll('.remove').forEach(button => {
                button.addEventListener('click', async function() {
                  const variantId = this.dataset.variantId;
                  await window.cart.removeItem(variantId);
                });
              });
              
              // Update cart total
              const totalElement = cartDrawer.querySelector('.cart-total-price');
              if (totalElement) {
                totalElement.textContent = formatMoney(cartData.total_price);
              }
              
              // Update header cart count
              updateHeaderCartCount(cartData.item_count);
              
              function updateShippingThreshold(cartDrawer, totalPrice) {
                const threshold = 100 * 100; // $100 in cents
                const progress = Math.min(100, (totalPrice / threshold) * 100);
                const remaining = Math.max(0, threshold - totalPrice) / 100;
  
                const progressBar = cartDrawer.querySelector('.tf-progress-bar .value');
                if (progressBar) {
                  progressBar.style.width = `${progress}%`;
                  progressBar.setAttribute('data-progress', progress);
                }
  
                const thresholdText = cartDrawer.querySelector('.tf-mini-cart-threshold .text');
                if (thresholdText) {
                  if (totalPrice >= threshold) {
                    thresholdText.innerHTML = window.theme?.settings?.free_shipping_message || 'Congratulations! You\'ve unlocked <span class="fw-medium">Free Shipping</span>';
                  } else {
                    const progressMessage = window.theme?.settings?.progress_message || 'Spend <span class="fw-medium">[amount]</span> more to get <span class="fw-medium">Free Shipping</span>';
                    thresholdText.innerHTML = progressMessage.replace('[amount]', `$${remaining.toFixed(2)}`);
                  }
                }
              }
              
              updateShippingThreshold(cartDrawer, cartData.total_price);
              }
            }
          }
        } catch (error) {
          console.error('Error adding item to cart:', error);
          alert('Failed to add item to cart. Please try again.');
        } finally {
          this.classList.remove('loading');
        }
      });
    }
  
    const copyButton = document.getElementById('btn-coppy-text');
    const textToCopy = document.getElementById('coppyText');
    
    if (copyButton && textToCopy) {
      copyButton.addEventListener('click', function() {
        navigator.clipboard.writeText(textToCopy.textContent).then(() => {
          // Show success state
          const originalText = this.textContent;
          this.textContent = 'Copied!';
          this.classList.add('copied');
          
          // Reset after 2 seconds
          setTimeout(() => {
            this.textContent = originalText;
            this.classList.remove('copied');
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy text:', err);
        });
      });
    }
    
    // Handle social share links
    document.querySelectorAll('.share-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        window.open(this.href, '', 'width=600,height=460,menubar=no,toolbar=no,resizable=yes,scrollbars=yes');
      });
    });
  
    document.querySelectorAll('.sold-count-js').forEach(function(el) {
      var min = parseInt(el.getAttribute('data-min'), 10);
      var max = parseInt(el.getAttribute('data-max'), 10);
      var random = Math.floor(Math.random() * (max - min + 1)) + min;
      el.textContent = el.textContent.replace(/\d+/, random);
    });
  
    // Handle notify stock form submission
    const notifyForm = document.getElementById('notify-stock-form');
    const successMessage = document.getElementById('notify-success-message');
    
    if (notifyForm) {
      notifyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const name = formData.get('name');
        const email = formData.get('email');
        
        // Hide the form and show success message
        notifyForm.style.display = 'none';
        successMessage.style.display = 'block';
        
        // Optional: Reset the form
        notifyForm.reset();
        
      });
    }
  
    // Special Deal Add to Cart
    document.querySelectorAll('.form-buyX-getY').forEach(form => {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const button = form.querySelector('.btn-special-deal');
        if (button.classList.contains('loading')) return;
  
        // Get selected variants
        const buyVariant = form.querySelector('select[name="buy_variant"]').value;
        const getVariant = form.querySelector('select[name="get_variant"]').value;
  
        // You can adjust quantities if needed
        const items = [
          { id: buyVariant, quantity: 1 },
          { id: getVariant, quantity: 1 }
        ];
  
        try {
          button.classList.add('loading');
          button.textContent = 'Adding...';
  
          const response = await fetch(window.cartAddUrl + '.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items })
          });
  
          if (!response.ok) throw new Error('Failed to add items to cart');
          const cartResponse = await fetch(window.cartUrl + '.js');
          const cartData = await cartResponse.json();
  
          // Show success message briefly
          button.textContent = 'Added!';
          setTimeout(() => {
            button.textContent = form.querySelector('.btn-special-deal').dataset.originalText || 'Grab this deal';
          }, 1000);
  
          // Optionally update cart drawer, similar to FBT logic
          const cartDrawer = document.getElementById('shoppingCart');
          if (cartDrawer) {
            const itemsContainer = cartDrawer.querySelector('.tf-mini-cart-items');
            if (itemsContainer) {
              itemsContainer.innerHTML = '';
              cartData.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'tf-mini-cart-item';
                itemElement.style.border = 'none';
                itemElement.style.borderBottom = 'none';
                itemElement.innerHTML = `
                  <div class="tf-mini-cart-image">
                    <a href="${item.url}">
                      <img class="lazyload" data-src="${item.image}" src="${item.image}" alt="${item.title}" loading="lazy">
                    </a>
                  </div>
                  <div class="tf-mini-cart-info">
                    <div class="d-flex justify-content-between">
                      <a class="title link text-md fw-medium" href="${item.url}">${item.title}</a>
                      <i class="icon icon-close remove" data-variant-id="${item.variant_id}" aria-label="Remove item"></i>
                    </div>
                    <div class="d-flex gap-10">
                      <div class="text-xs">${item.variant_title || ''}</div>
                      <a href="#" class="link edit"><i class="icon-pen"></i></a>
                    </div>
                    <div class="tf-mini-cart-item_price">
                      <p class="price-wrap text-sm fw-medium">
                        <span class="new-price text-primary">${formatMoney(item.final_price)}</span>
                      </p>
                    </div>
                    <div class="tf-mini-cart-item_quantity">
                      <div class="wg-quantity small">
                        <button class="btn-quantity btn-decrease" data-variant-id="${item.variant_id}">-</button>
                        <input type="text" class="quantity-product" value="${item.quantity}" min="0" data-variant-id="${item.variant_id}">
                        <button class="btn-quantity btn-increase" data-variant-id="${item.variant_id}">+</button>
                      </div>
                    </div>
                  </div>
                `;
                itemsContainer.appendChild(itemElement);
              });
                         // Add event listeners for quantity buttons
                         itemsContainer.querySelectorAll('.btn-decrease').forEach(button => {
                button.addEventListener('click', async function() {
                  const variantId = this.dataset.variantId;
                  const input = this.nextElementSibling;
                  const currentValue = parseInt(input.value);
                  if (currentValue > 1) {
                    await window.cart.updateQuantity(variantId, currentValue - 1, 'update');
                  } else {
                    await window.cart.removeItem(variantId);
                  }
                });
              });
    
              itemsContainer.querySelectorAll('.btn-increase').forEach(button => {
                button.addEventListener('click', async function() {
                  const variantId = this.dataset.variantId;
                  const input = this.previousElementSibling;
                  const currentValue = parseInt(input.value);
                  await window.cart.updateQuantity(variantId, currentValue + 1, 'update');
                });
              });
  
              itemsContainer.querySelectorAll('.quantity-product').forEach(input => {
                input.addEventListener('change', async function() {
                  const variantId = this.dataset.variantId;
                  const newValue = parseInt(this.value);
                  if (isNaN(newValue) || newValue < 1) {
                    if (newValue <= 0) {
                      await window.cart.removeItem(variantId);
                    } else {
                      this.value = 1;
                      await window.cart.updateQuantity(variantId, 1, 'update');
                    }
                  } else {
                    await window.cart.updateQuantity(variantId, newValue, 'update');
                  }
                });
              });
  
              // Add event listeners for remove buttons
              itemsContainer.querySelectorAll('.remove').forEach(button => {
                button.addEventListener('click', async function() {
                  const variantId = this.dataset.variantId;
                  await window.cart.removeItem(variantId);
                });
              });
              
              // Update cart total
              const totalElement = cartDrawer.querySelector('.cart-total-price');
              if (totalElement) {
                totalElement.textContent = formatMoney(cartData.total_price);
              }
              
              // Update header cart count
              updateHeaderCartCount(cartData.item_count);
              
              function updateShippingThreshold(cartDrawer, totalPrice) {
                const threshold = 100 * 100; // $100 in cents
                const progress = Math.min(100, (totalPrice / threshold) * 100);
                const remaining = Math.max(0, threshold - totalPrice) / 100;
  
                const progressBar = cartDrawer.querySelector('.tf-progress-bar .value');
                if (progressBar) {
                  progressBar.style.width = `${progress}%`;
                  progressBar.setAttribute('data-progress', progress);
                }
  
                const thresholdText = cartDrawer.querySelector('.tf-mini-cart-threshold .text');
                if (thresholdText) {
                  if (totalPrice >= threshold) {
                    thresholdText.innerHTML = window.theme?.settings?.free_shipping_message || 'Congratulations! You\'ve unlocked <span class="fw-medium">Free Shipping</span>';
                  } else {
                    const progressMessage = window.theme?.settings?.progress_message || 'Spend <span class="fw-medium">[amount]</span> more to get <span class="fw-medium">Free Shipping</span>';
                    thresholdText.innerHTML = progressMessage.replace('[amount]', `$${remaining.toFixed(2)}`);
                  }
                }
              }
              
              updateShippingThreshold(cartDrawer, cartData.total_price);
            }
          }
          if (window.cart && window.cart.showCartDrawer) {
            window.cart.showCartDrawer();
          }
        } catch (error) {
          if (window.cartNotifications) {
            window.cartNotifications.show(error.message || 'Failed to add items to cart. Please try again.', 'error');
          } else {
            alert('Failed to add items to cart. Please try again.');
          }
          // Reset button text on error
          button.textContent = form.querySelector('.btn-special-deal').dataset.originalText || 'Add to Cart';
        } finally {
          button.classList.remove('loading');
        }
      });
    });
  
    // Handle dynamic checkout buttons
    function updateDynamicCheckoutButtons(variant) {
      // Get quantity from the main product info input
      let quantity = 1;
      const mainQuantityInput = document.querySelector('.tf-product-info-list .quantity-product');
      if (mainQuantityInput) {
        quantity = parseInt(mainQuantityInput.value) || 1;
      }
      
      // Update the form hidden inputs
      const productForm = document.querySelector('form[action*="window.cartAddUrl"]');
      if (productForm) {
        const variantInput = productForm.querySelector('input[name="id"]');
        const quantityInput = productForm.querySelector('input[name="quantity"]');
        
        if (variantInput) {
          variantInput.value = variant.id;
        }
        if (quantityInput) {
          quantityInput.value = quantity;
        }
      }
      
      // Reinitialize Shopify's dynamic checkout buttons
      if (window.Shopify && window.Shopify.PaymentButton) {
        window.Shopify.PaymentButton.init();
      }
    }
  
    // Video autoplay consent handling
    window.setVideoAutoplayConsent = function(consent) {
      console.log('Setting video consent to:', consent);
      localStorage.setItem('videoAutoplayConsent', consent);
      
      // Close modal using Bootstrap
      const consentModal = document.getElementById('videoAutoplayConsent');
      if (consentModal) {
        const bsModal = bootstrap.Modal.getInstance(consentModal);
        if (bsModal) {
          bsModal.hide();
        } else {
          console.log('Modal instance not found, trying to create new instance');
          const newModal = new bootstrap.Modal(consentModal);
          newModal.hide();
        }
      }
  
      // If consent was given, play the current video if it's visible
      if (consent && window.enableVideoAutoplay) {
        const mainSwiper = document.querySelector('.tf-product-media-main')?.swiper;
        if (mainSwiper) {
          const activeSlide = mainSwiper.slides[mainSwiper.activeIndex];
          if (activeSlide && activeSlide.getAttribute('data-media-type') === 'video') {
            const video = activeSlide.querySelector('video');
            if (video) {
              console.log('Playing video after consent');
              video.play().catch(e => console.log('Video autoplay failed:', e));
            }
          }
        }
      }
    };
  
    window.getVideoAutoplayConsent = function() {
      return localStorage.getItem('videoAutoplayConsent') === 'true';
    };
  
    // Initialize gallery and consent handlers
    document.addEventListener('DOMContentLoaded', function() {
      console.log('DOM loaded, initializing consent handlers');
      
      // Set up consent button handlers
      const acceptBtn = document.getElementById('acceptAutoplay');
      const declineBtn = document.getElementById('declineAutoplay');
      
      if (acceptBtn) {
        console.log('Found accept button, attaching handler');
        acceptBtn.addEventListener('click', function(e) {
          console.log('Accept button clicked');
          e.preventDefault();
          window.setVideoAutoplayConsent(true);
        });
      } else {
        console.error('Accept button not found');
      }
      
      if (declineBtn) {
        console.log('Found decline button, attaching handler');
        declineBtn.addEventListener('click', function(e) {
          console.log('Decline button clicked');
          e.preventDefault();
          window.setVideoAutoplayConsent(false);
        });
      } else {
        console.error('Decline button not found');
      }
  
      // Initialize gallery
      const galleryThumbs = new Swiper('.tf-product-media-thumbs', {
        // ... existing swiper config ...
      });
  
      const galleryMain = new Swiper('.tf-product-media-main', {
        slidesPerView: 1,
        spaceBetween: 0,
        thumbs: {
          swiper: galleryThumbs
        },
        navigation: {
          nextEl: '.thumbs-next',
          prevEl: '.thumbs-prev',
        },
        on: {
          init: function() {
            console.log('Gallery initialized');
            // Initialize Intersection Observer for videos
            const videoObserver = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                  console.log('Video intersecting, checking consent');
                  // Only autoplay if both setting is enabled and user has given consent
                  if (window.enableVideoAutoplay && window.getVideoAutoplayConsent()) {
                    console.log('Attempting to play video');
                    video.play().catch(e => console.log('Video autoplay failed:', e));
                  }
                } else {
                  video.pause();
                }
              });
            }, {
              root: null,
              rootMargin: '0px',
              threshold: 0.5
            });
  
            // Initialize all videos
            this.slides.forEach(slide => {
              const video = slide.querySelector('video');
              if (video) {
                // Ensure video is paused initially
                video.pause();
                video.currentTime = 0;
                
                // Add error handling
                video.addEventListener('error', function(e) {
                  console.log('Video error:', e);
                });
  
                // Observe the video for viewport visibility
                videoObserver.observe(video);
              }
            });
          },
          slideChange: function() {
            const activeSlide = this.slides[this.activeIndex];
            const mediaType = activeSlide.getAttribute('data-media-type');
            const activeVideo = activeSlide.querySelector('video');
            
            console.log('Slide changed to:', mediaType);
            
            // Pause all videos first
            this.slides.forEach(slide => {
              const video = slide.querySelector('video');
              if (video && video !== activeVideo) {
                video.pause();
              }
            });
  
            // Handle video in active slide
            if (mediaType === 'video') {
              console.log('Current slide is video');
              // Check if consent is needed
              if (window.enableVideoAutoplay && localStorage.getItem('videoAutoplayConsent') === null) {
                console.log('Showing consent modal');
                const consentModal = document.getElementById('videoAutoplayConsent');
                if (consentModal) {
                  const modal = new bootstrap.Modal(consentModal);
                  modal.show();
                }
              }
  
              if (activeVideo) {
                activeVideo.currentTime = 0;
                if (window.enableVideoAutoplay && window.getVideoAutoplayConsent()) {
                  console.log('Attempting to play video after slide change');
                  activeVideo.play().catch(e => console.log('Video autoplay failed:', e));
                }
              }
            }
  
            // Rest of your existing slideChange code...
          }
        }
      });
    });
  
    function updateVideoObservers() {
      const hasConsent = getVideoAutoplayConsent();
      const mainSwiper = document.querySelector('.tf-product-media-main')?.swiper;
      
      if (mainSwiper && mainSwiper.slides) {
        mainSwiper.slides.forEach(slide => {
          const video = slide.querySelector('video');
          if (video) {
            if (!hasConsent) {
              video.pause();
            } else if (window.enableVideoAutoplay && slide.classList.contains('swiper-slide-active')) {
              video.play().catch(e => console.log('Video autoplay failed:', e));
            }
          }
        });
      }
    }
  
    // Initialize consent check when gallery is loaded
    document.addEventListener('DOMContentLoaded', function() {
      console.log('DOM Content Loaded');
      console.log('Video autoplay setting:', window.enableVideoAutoplay);
      
      // Check for existing consent
      const existingConsent = localStorage.getItem('videoAutoplayConsent');
      console.log('Existing consent:', existingConsent);
      
      // Initialize Bootstrap modal
      const consentModal = document.getElementById('videoAutoplayConsent');
      if (!consentModal) {
        console.error('Consent modal element not found');
        return;
      }
      
      // Only show modal if autoplay is enabled and no consent is stored
      if (window.enableVideoAutoplay && existingConsent === null) {
        console.log('Showing consent modal');
        const modal = new bootstrap.Modal(consentModal);
        // Small delay to ensure modal is properly initialized
        setTimeout(() => {
          modal.show();
        }, 100);
      }
    });
  
  });
  
  // Function to update header cart count
  function updateHeaderCartCount(count) {
    // Update all cart count elements in the header
    const cartCountElements = document.querySelectorAll('.cart-count, .cart-count-bubble, .cart-count-number');
    cartCountElements.forEach(element => {
      element.textContent = count || 0;
      
      // If the element has a parent with cart-link class, update aria-label too
      const cartLink = element.closest('.cart-link');
      if (cartLink) {
        cartLink.setAttribute('aria-label', `Cart (${count || 0} items)`);
      }
  
      // Show/hide the count element based on count
      if (count > 0) {
        element.style.display = '';
      } else {
        element.style.display = 'none';
      }
    });
  }
  
  // Helper function to format money
  function formatMoney(cents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: window.shopCurrency
    }).format(cents / 100);
  }
  
  // Function to update main add to cart button (not sticky bar)
  function updateMainAddToCartButton(variant) {
    const mainAddToCartBtn = document.querySelector('.tf-product-info-list .add-to-cart');
    if (mainAddToCartBtn && variant) {
      mainAddToCartBtn.dataset.variantId = variant.id;
      // Update quantity
      const quantityInput = document.querySelector('.tf-product-info-list .quantity-product');
      if (quantityInput) {
        const quantity = parseInt(quantityInput.value) || 1;
        mainAddToCartBtn.dataset.quantity = quantity;
      }
    }
  }

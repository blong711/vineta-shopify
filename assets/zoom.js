import PhotoSwipeLightbox from './photoswipe-lightbox.esm.min.js';
import PhotoSwipe from './photoswipe.esm.min.js';

// Helper functions
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function removeClassFromAll(selector, className) {
  document.querySelectorAll(selector).forEach(el => el.classList.remove(className));
}

function addEventToAll(selector, event, handler) {
  document.querySelectorAll(selector).forEach(el => el.addEventListener(event, handler));
}

function getData(el, key) {
  return el.dataset[key];
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function getText(selector) {
  const el = document.querySelector(selector);
  return el ? el.textContent : '';
}

// Swiper initialization
if (document.querySelector('.thumbs-slider')) {
  const thumbsEl = document.querySelector('.tf-product-media-thumbs');
  const direction = thumbsEl ? thumbsEl.dataset.direction : 'vertical';
  const preview = thumbsEl ? thumbsEl.dataset.preview : 3;
  const thumbs = new Swiper('.tf-product-media-thumbs', {
    spaceBetween: 10,
    slidesPerView: preview,
    freeMode: true,
    direction: 'vertical',
    watchSlidesProgress: true,
    observer: true,
    observeParents: true,
    breakpoints: {
      0: {
        direction: 'horizontal',
        slidesPerView: preview,
      },
      1200: {
        direction: direction,
      },
    },
  });
  const main = new Swiper('.tf-product-media-main', {
    spaceBetween: 0,
    observer: true,
    observeParents: true,
    speed: 800,
    navigation: {
      nextEl: '.thumbs-next',
      prevEl: '.thumbs-prev',
    },
    thumbs: {
      swiper: thumbs,
    },
  });

  const modelViewer = document.querySelector('.slide-3d');
  if (modelViewer) {
    modelViewer.addEventListener('mouseenter', () => {
      main.allowTouchMove = false;
    });
    modelViewer.addEventListener('mouseleave', () => {
      main.allowTouchMove = true;
    });
  }

  function updateActiveButton(type, activeIndex) {
    const btnClass = `.${type}-btn`;
    const dataAttr = `data-${type}`;
    const currentClass = `.value-current${capitalizeFirstLetter(type)}`;
    const selectClass = `.select-current${capitalizeFirstLetter(type)}`;
    removeClassFromAll(btnClass, 'active');
    const slides = document.querySelectorAll('.tf-product-media-main .swiper-slide');
    const currentSlide = slides[activeIndex];
    const currentValue = currentSlide ? currentSlide.getAttribute(dataAttr) : null;
    if (currentValue) {
      document.querySelectorAll(`${btnClass}[${dataAttr}='${currentValue}']`).forEach(el => el.classList.add('active'));
      setText(currentClass, currentValue);
      setText(selectClass, currentValue);
    }
  }

  function scrollToVariant(type, value, color) {
    if (!value || !color) return;
    const slides = Array.from(document.querySelectorAll('.tf-product-media-main .swiper-slide'));
    let firstIndex = slides.findIndex(slide => slide.getAttribute(`data-${type}`) === value && slide.getAttribute('data-color') === color);
    if (firstIndex === -1) {
      firstIndex = slides.findIndex(slide => slide.getAttribute(`data-${type}`) === value);
    }
    if (firstIndex !== -1) {
      main.slideTo(firstIndex, 1000, false);
      thumbs.slideTo(firstIndex, 1000, false);
    }
  }

  function setupVariantButtons(type) {
    addEventToAll(`.${type}-btn`, 'click', function (event) {
      const value = this.dataset[type];
      const color = getText('.value-currentColor');
      removeClassFromAll(`.${type}-btn`, 'active');
      this.classList.add('active');
      scrollToVariant(type, value, color);
    });
  }

  ['color', 'size'].forEach(type => {
    main.on('slideChange', function () {
      updateActiveButton(type, this.activeIndex);
    });
    setupVariantButtons(type);
    updateActiveButton(type, main.activeIndex);
  });
}

// Section zoom (vanilla JS)
function section_zoom() {
  addEventToAll('.tf-image-zoom', 'mouseover', function () {
    const section = this.closest('.section-image-zoom');
    if (section) section.classList.add('zoom-active');
  });
  addEventToAll('.tf-image-zoom', 'mouseleave', function () {
    const section = this.closest('.section-image-zoom');
    if (section) section.classList.remove('zoom-active');
  });
}

// Custom zoom (vanilla JS)
function cus_zoom() {
  function image_zoom() {
    const driftAll = document.querySelectorAll('.tf-image-zoom');
    const pane = document.querySelector('.tf-zoom-main');
    if (window.matchMedia('only screen and (min-width: 1200px)').matches) {
      driftAll.forEach(el => {
        if (!el._drift) {
          el._drift = new Drift(el, {
            zoomFactor: 2,
            paneContainer: pane,
            inlinePane: false,
            handleTouch: false,
            hoverBoundingBox: true,
            containInline: true,
          });
        }
      });
    } else {
      driftAll.forEach(el => {
        if (el._drift) {
          el._drift.destroy();
          el._drift = null;
        }
      });
    }
    // If you need magnificPopup functionality, use a vanilla lightbox alternative here
    // Example: implement your own or use a vanilla JS library
  }
  window.addEventListener('resize', image_zoom);
  image_zoom();
}

function image_zoom_magnifier() {
  const driftAll = document.querySelectorAll('.tf-image-zoom-magnifier');
  driftAll.forEach(el => {
    new Drift(el, {
      zoomFactor: 2,
      inlinePane: true,
      containInline: false,
    });
  });
}

function image_zoom_inner() {
  const driftAll = document.querySelectorAll('.tf-image-zoom-inner');
  const pane = document.querySelector('.tf-product-zoom-inner');
  driftAll.forEach(el => {
    new Drift(el, {
      paneContainer: pane,
      zoomFactor: 2,
      inlinePane: false,
      containInline: false,
    });
  });
}

function lightboxswiper() {
  const main = window.mainSwiperInstance || null;
  const lightbox = new PhotoSwipeLightbox({
    gallery: '#gallery-swiper-started',
    children: 'a',
    pswpModule: PhotoSwipe,
    bgOpacity: 1,
    secondaryZoomLevel: 2,
    maxZoomLevel: 3,
  });
  lightbox.init();
  if (main) {
    lightbox.on('change', () => {
      const { pswp } = lightbox;
      main.slideTo(pswp.currIndex, 0, false);
    });
    lightbox.on('afterInit', () => {
      if (main.params.autoplay.enabled) {
        main.autoplay.stop();
      }
    });
    lightbox.on('closingAnimationStart', () => {
      const { pswp } = lightbox;
      main.slideTo(pswp.currIndex, 0, false);
      if (main.params.autoplay.enabled) {
        main.autoplay.start();
      }
    });
  }
}

function lightbox() {
  const lightbox = new PhotoSwipeLightbox({
    gallery: '#gallery-started',
    children: 'a',
    pswpModule: PhotoSwipe,
    bgOpacity: 1,
    secondaryZoomLevel: 2,
    maxZoomLevel: 3,
  });
  lightbox.init();
}

function model_viewer() {
  const viewers = document.querySelectorAll('.tf-model-viewer');
  if (viewers.length) {
    addEventToAll('.tf-model-viewer-ui-button', 'click', function (e) {
      const parent = this.closest('.tf-model-viewer');
      if (!parent) return;
      parent.querySelectorAll('model-viewer').forEach(mv => mv.classList.remove('disabled'));
      parent.classList.toggle('active');
    });
    addEventToAll('.tf-model-viewer-ui', 'dblclick', function (e) {
      const parent = this.closest('.tf-model-viewer');
      if (!parent) return;
      const modelViewer = parent.querySelector('model-viewer');
      parent.querySelectorAll('model-viewer').forEach(mv => mv.classList.add('disabled'));
      parent.classList.toggle('active');
      if (modelViewer) {
        modelViewer.cameraOrbit = '0deg 90deg auto';
        if (typeof modelViewer.updateFraming === 'function') {
          modelViewer.updateFraming();
        }
      }
    });
  }
}

// DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  // Uncomment if you want to enable these features:
  // section_zoom();
  // cus_zoom();
  // image_zoom_magnifier();
  // image_zoom_inner();
  lightboxswiper();
  lightbox();
  model_viewer();
});



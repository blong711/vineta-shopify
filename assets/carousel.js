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

// tf-sw-slideshow initialization
if (document.querySelector(".tf-sw-slideshow")) {
  const tfSwSlideshow = document.querySelector(".tf-sw-slideshow");
  const preview = getData(tfSwSlideshow, "preview");
  const tablet = getData(tfSwSlideshow, "tablet");
  const mobile = getData(tfSwSlideshow, "mobile");
  const spacing = getData(tfSwSlideshow, "space");
  const spacingMb = getData(tfSwSlideshow, "space-mb");
  const loop = getData(tfSwSlideshow, "loop");
  const play = getData(tfSwSlideshow, "auto-play");
  const centered = getData(tfSwSlideshow, "centered");
  const effect = getData(tfSwSlideshow, "effect");
  const speed = getData(tfSwSlideshow, "speed") !== undefined ? getData(tfSwSlideshow, "speed") : 1000;
  
  const swiperSlider = {
    autoplay: play
      ? {
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }
      : false,
    slidesPerView: mobile,
    loop: loop,
    spaceBetween: spacingMb,
    speed: speed,
    observer: true,
    observeParents: true,
    pagination: {
      el: ".sw-pagination-slider",
      clickable: true,
    },
    navigation: {
      clickable: true,
      nextEl: ".navigation-next-slider",
      prevEl: ".navigation-prev-slider",
    },
    centeredSlides: false,
    breakpoints: {
      [window.themeConstants.BREAKPOINTS.md]: {
        slidesPerView: tablet,
        spaceBetween: spacing,
        centeredSlides: false,
      },
      [window.themeConstants.BREAKPOINTS.xl]: {
        slidesPerView: preview,
        spaceBetween: spacing,
        centeredSlides: centered,
      },
    },
  };
  
  if (effect === "fade") {
    swiperSlider.effect = "fade";
    swiperSlider.fadeEffect = {
      crossFade: true,
    };
  }
  
  const swiper = new Swiper(".tf-sw-slideshow", swiperSlider);
}

// tf-single-slide initialization
if (document.querySelector(".tf-single-slide")) {
  const main = new Swiper(".tf-single-slide", {
    slidesPerView: 1,
    spaceBetween: 0,
    observer: true,
    observeParents: true,
    speed: 800,
    navigation: {
      nextEl: ".single-slide-next",
      prevEl: ".single-slide-prev",
    },
  });

  function updateActiveButton(type, activeIndex) {
    const btnClass = `.${type}-btn`;
    const dataAttr = `data-${type}`;
    const currentClass = `.value-current${capitalizeFirstLetter(type)}`;
    const selectClass = `.select-current${capitalizeFirstLetter(type)}`;
    removeClassFromAll(btnClass, "active");

    const slides = document.querySelectorAll(".tf-single-slide .swiper-slide");
    const currentSlide = slides[activeIndex];
    const currentValue = currentSlide ? currentSlide.getAttribute(dataAttr) : null;

    if (currentValue) {
      document.querySelectorAll(`${btnClass}[${dataAttr}='${currentValue}']`).forEach(el => el.classList.add("active"));
      setText(currentClass, currentValue);
      setText(selectClass, currentValue);
    }
  }

  function scrollTo(type, value, color) {
    if (!value || !color) return;
    const slides = Array.from(document.querySelectorAll(".tf-single-slide .swiper-slide"));
    let firstIndex = slides.findIndex(slide => 
      slide.getAttribute(`data-${type}`) === value && 
      slide.getAttribute("data-color") === color
    );

    if (firstIndex === -1) {
      firstIndex = slides.findIndex(slide => slide.getAttribute(`data-${type}`) === value);
    }

    if (firstIndex !== -1) {
      main.slideTo(firstIndex, 1000, false);
    }
  }

  function setupVariantButtons(type) {
    addEventToAll(`.${type}-btn`, "click", function () {
      const value = this.dataset[type];
      const color = getText(".value-currentColor");
      removeClassFromAll(`.${type}-btn`, "active");
      this.classList.add("active");
      scrollTo(type, value, color);
    });
  }

  ["color"].forEach((type) => {
    main.on("slideChange", function () {
      updateActiveButton(type, this.activeIndex);
    });
    setupVariantButtons(type);
    updateActiveButton(type, main.activeIndex);
  });
}

// flat-thumbs-tes initialization
if (document.querySelector(".flat-thumbs-tes")) {
  const tfThumbTes = document.querySelector(".tf-thumb-tes");
  const tfTesMain = document.querySelector(".tf-tes-main");
  const flatThumbsTes = document.querySelector(".flat-thumbs-tes");
  
  const spaceThumbLg = getData(tfThumbTes, "space-lg");
  const spaceThumb = getData(tfThumbTes, "space");
  const spaceTesLg = getData(tfTesMain, "space-lg");
  const spaceTes = getData(tfTesMain, "space");
  const effect = getData(flatThumbsTes, "effect") || "slide";
  
  const swThumb = new Swiper(".tf-thumb-tes", {
    speed: 800,
    spaceBetween: spaceThumb,
    effect: effect,
    fadeEffect: effect === "fade" ? { crossFade: true } : undefined,
    breakpoints: {
      [window.themeConstants.BREAKPOINTS.md]: {
        spaceBetween: spaceThumbLg,
      },
    },
  });
  
  const swTesMain = new Swiper(".tf-tes-main", {
    speed: 800,
    navigation: {
      nextEl: ".nav-next-tes",
      prevEl: ".nav-prev-tes",
    },
    effect: effect,
    fadeEffect: effect === "fade" ? { crossFade: true } : undefined,
    pagination: {
      el: ".sw-pagination-tes",
      clickable: true,
    },
    spaceBetween: spaceTes,
    breakpoints: {
      [window.themeConstants.BREAKPOINTS.md]: {
        spaceBetween: spaceTesLg,
      },
    },
  });

  swThumb.controller.control = swTesMain;
  swTesMain.controller.control = swThumb;
}

// slider-thumb-wrap initialization
if (document.querySelector(".slider-thumb-wrap")) {
  const contentThumbSlider = new Swiper(".slider-content-thumb", {
    slidesPerView: 1,
    loop: true,
    grabCursor: true,
    speed: 800,
    on: {
      slideChange: function () {
        const activeIndex = this.realIndex;
        removeClassFromAll(".btn-thumbs", "active");
        const buttons = document.querySelectorAll(".btn-thumbs");
        if (buttons[activeIndex]) {
          buttons[activeIndex].classList.add("active");
        }
      },
    },
  });

  addEventToAll(".btn-thumbs", "click", function () {
    const buttons = Array.from(document.querySelectorAll(".btn-thumbs"));
    const index = buttons.indexOf(this);
    removeClassFromAll(".btn-thumbs", "active");
    this.classList.add("active");
    contentThumbSlider.slideToLoop(index);
  });
}

// tf-sw-lb initialization
if (document.querySelector(".tf-sw-lb")) {
  const swiperLb = new Swiper(".tf-sw-lb", {
    slidesPerView: 1,
    spaceBetween: 12,
    speed: 800,
    pagination: {
      el: ".sw-pagination-lb",
      clickable: true,
    },
    navigation: {
      clickable: true,
      nextEl: ".nav-next-lb",
      prevEl: ".nav-prev-lb",
    },
    breakpoints: {
      [window.themeConstants.BREAKPOINTS.md]: {
        spaceBetween: 24,
      }
    },
  });

  addEventToAll(".sw-btn", "click", function () {
    const slideIndex = this.dataset.slide;
    removeClassFromAll(".sw-btn", "active");
    this.classList.add("active");
    swiperLb.slideTo(slideIndex, 800, false);
  });
  
  swiperLb.on('slideChange', function () {
    const currentIndex = swiperLb.realIndex;
    removeClassFromAll(".sw-btn", "active");
    document.querySelectorAll(`.sw-btn[data-slide='${currentIndex}']`).forEach(el => el.classList.add("active"));
  });
}
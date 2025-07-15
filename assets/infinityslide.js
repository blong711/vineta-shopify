// infiniteslide.js v2 - Vanilla JS rewrite
// Author: T.Morimoto (rewritten for vanilla JS)
// MIT License

function infiniteslide(element, options = {}) {
  // Default settings
  const settings = Object.assign({
    speed: 100, // px/sec
    direction: 'left', // up/down/left/right
    pauseonhover: true,
    responsive: false,
    clone: 1,
  }, options);

  // Helper functions
  function setCss(el, direction) {
    // Wrap in .infiniteslide_wrap
    let wrapper = document.createElement('div');
    wrapper.className = 'infiniteslide_wrap';
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
    wrapper.style.overflow = 'hidden';

    let flexDirection = (direction === 'up' || direction === 'down') ? 'column' : 'row';
    el.style.display = 'flex';
    el.style.flexWrap = 'nowrap';
    el.style.alignItems = 'center';
    el.style.flexDirection = flexDirection;
    // For IE11
    el.style.msFlexAlign = 'center';
    Array.from(el.children).forEach(child => {
      child.style.flex = 'none';
      child.style.display = 'block';
    });
  }

  function setClone(el, cloneCount) {
    let children = Array.from(el.children).filter(child => !child.classList.contains('infiniteslide_clone'));
    for (let i = 0; i < cloneCount; i++) {
      children.forEach(child => {
        let clone = child.cloneNode(true);
        clone.classList.add('infiniteslide_clone');
        el.appendChild(clone);
      });
    }
  }

  function getWidth(el) {
    let w = 0;
    Array.from(el.children).forEach(child => {
      if (!child.classList.contains('infiniteslide_clone')) {
        w += child.offsetWidth;
      }
    });
    return w;
  }
  function getHeight(el) {
    let h = 0;
    Array.from(el.children).forEach(child => {
      if (!child.classList.contains('infiniteslide_clone')) {
        h += child.offsetHeight;
      }
    });
    return h;
  }

  function getSpeed(length, speed) {
    return length / speed;
  }
  function getNum(el, direction) {
    return (direction === 'up' || direction === 'down') ? getHeight(el) : getWidth(el);
  }
  function getTranslate(num, direction) {
    if (direction === 'up' || direction === 'down') {
      return `0,-${num}px,0`;
    } else {
      return `-${num}px,0,0`;
    }
  }

  function setAnim(el, id, direction, speed) {
    const num = getNum(el, direction);
    if (direction === 'up' || direction === 'down') {
      el.parentNode.style.height = num + 'px';
    }
    const i = getTranslate(num, direction);
    el.setAttribute('data-style', 'infiniteslide' + id);
    // Create keyframes
    const styleId = 'infiniteslide' + id + '_style';
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = `@keyframes infiniteslide${id}{from {transform:translate3d(0,0,0);}to {transform:translate3d(${i});}}`;
    let reverse = (direction === 'right' || direction === 'down') ? ' reverse' : '';
    el.style.animation = `infiniteslide${id} ${getSpeed(num, speed)}s linear 0s infinite${reverse}`;
  }

  function setStop(el) {
    el.addEventListener('mouseenter', function () {
      el.style.animationPlayState = 'paused';
    });
    el.addEventListener('mouseleave', function () {
      el.style.animationPlayState = 'running';
    });
  }

  function setResponsive(el, direction) {
    const num = getNum(el, direction);
    return getTranslate(num, direction);
  }

  // Main logic
  const id = Date.now() + Math.floor(10000 * Math.random()).toString(16);
  if (settings.pauseonhover) {
    setStop(element);
  }
  function _onload() {
    setCss(element, settings.direction);
    setClone(element, settings.clone);
    setAnim(element, id, settings.direction, settings.speed);
    if (settings.responsive) {
      window.addEventListener('resize', function () {
        const i = setResponsive(element, settings.direction);
        const styleId = element.getAttribute('data-style');
        const style = document.getElementById(styleId + '_style');
        if (style) {
          style.textContent = style.textContent.replace(/to {transform:translate3d\((.*?)\)/, `to {transform:translate3d(${i})`);
        }
      });
    }
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    _onload();
  } else {
    window.addEventListener('load', _onload);
  }
}

// Usage example:
// infiniteslide(document.querySelector('.your-slider'), { speed: 100, direction: 'left' });

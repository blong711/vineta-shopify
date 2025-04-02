// Wishlist and Compare functionality
class WishlistCompare {
  constructor() {
    this.wishlistKey = 'theme4:wishlist:id';
    this.compareKey = 'theme4:compare:id';
    this.wishlistList = this.getWishlistList();
    this.compareList = this.getCompareList();
    this.wishlistLimit = 50;
    this.compareLimit = 6;
    
    this.init();
  }

  init() {
    // Initialize event listeners
    document.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Initialize buttons state
    this.updateButtonsState();
  }

  getWishlistList() {
    const stored = localStorage.getItem(this.wishlistKey);
    return stored ? stored.split(',') : [];
  }

  getCompareList() {
    const stored = localStorage.getItem(this.compareKey);
    return stored ? stored.split(',') : [];
  }

  saveWishlistList() {
    localStorage.setItem(this.wishlistKey, this.wishlistList.join(','));
  }

  saveCompareList() {
    localStorage.setItem(this.compareKey, this.compareList.join(','));
  }

  handleClick(event) {
    const target = event.target.closest('[data-wishlist], [data-compare]');
    if (!target) return;

    const isWishlist = target.hasAttribute('data-wishlist');
    const productId = target.getAttribute('data-id');
    const action = target.getAttribute('data-action');

    if (isWishlist) {
      this.handleWishlist(productId, action);
    } else if (action === 'clear') {
      this.clearCompareList();
    } else if (action === 'add') {
      this.addToCompare(productId);
    } else if (action === 'remove') {
      this.removeFromCompare(productId);
    }
  }

  handleKeydown(event) {
    if (event.key !== 'Enter') return;
    
    const target = event.target.closest('[data-wishlist], [data-compare]');
    if (!target) return;

    const isWishlist = target.hasAttribute('data-wishlist');
    const productId = target.getAttribute('data-id');
    const action = target.getAttribute('data-action');

    if (isWishlist) {
      this.handleWishlist(productId, action);
    } else if (action === 'clear') {
      this.clearCompareList();
    } else if (action === 'add') {
      this.addToCompare(productId);
    } else if (action === 'remove') {
      this.removeFromCompare(productId);
    }
  }

  handleWishlist(productId, action) {
    if (action === 'add') {
      this.addToWishlist(productId);
    } else if (action === 'remove') {
      this.removeFromWishlist(productId);
    }
  }

  addToWishlist(productId) {
    if (this.wishlistList.includes(productId)) return;
    
    this.wishlistList.unshift(productId);
    if (this.wishlistList.length > this.wishlistLimit) {
      this.wishlistList.pop();
    }
    
    this.saveWishlistList();
    this.updateButtonsState();
    this.showNotification('Added to wishlist');
  }

  removeFromWishlist(productId) {
    const index = this.wishlistList.indexOf(productId);
    if (index === -1) return;
    
    this.wishlistList.splice(index, 1);
    this.saveWishlistList();
    this.updateButtonsState();
    this.showNotification('Removed from wishlist');
  }

  addToCompare(productId) {
    if (this.compareList.includes(productId)) return;
    
    this.compareList.unshift(productId);
    if (this.compareList.length > this.compareLimit) {
      this.compareList.pop();
    }
    
    this.saveCompareList();
    this.updateButtonsState();
    this.showCompareDrawer();
    this.showNotification('Added to compare');
  }

  removeFromCompare(productId) {
    const index = this.compareList.indexOf(productId);
    if (index === -1) return;
    
    this.compareList.splice(index, 1);
    this.saveCompareList();
    this.updateButtonsState();
    this.updateCompareDrawer();
    this.showNotification('Removed from compare');
  }

  updateButtonsState() {
    // Update wishlist buttons
    document.querySelectorAll('[data-wishlist]').forEach(button => {
      const productId = button.getAttribute('data-id');
      const isInWishlist = this.wishlistList.includes(productId);
      button.setAttribute('data-action', isInWishlist ? 'remove' : 'add');
      this.updateButtonText(button, isInWishlist, 'wishlist');
    });

    // Update compare buttons
    document.querySelectorAll('[data-compare]').forEach(button => {
      const productId = button.getAttribute('data-id');
      if (!productId) return; // Skip buttons without product ID (like Clear All)
      const isInCompare = this.compareList.includes(productId);
      button.setAttribute('data-action', isInCompare ? 'remove' : 'add');
      this.updateButtonText(button, isInCompare, 'compare');
    });
  }

  updateButtonText(button, isActive, type) {
    const tooltip = button.querySelector('.tooltip');
    if (tooltip) {
      tooltip.textContent = isActive ? `Remove from ${type}` : `Add to ${type}`;
    }
  }

  showCompareDrawer() {
    const drawer = document.getElementById('compare');
    if (!drawer) return;
    
    // Create and show Bootstrap modal
    const modal = new bootstrap.Modal(drawer);
    modal.show();
    
    this.updateCompareDrawer();
  }

  updateCompareDrawer() {
    const drawer = document.getElementById('compare');
    if (!drawer) return;

    const compareList = drawer.querySelector('.tf-compare-list');
    if (!compareList) return;

    // Clear existing items
    compareList.innerHTML = '';

    // Add current compare items
    this.compareList.forEach(productId => {
      const product = this.getProductData(productId);
      if (!product) return;

      const item = this.createCompareItem(product);
      compareList.appendChild(item);
    });

    // Hide modal if no items
    if (this.compareList.length === 0) {
      const modal = bootstrap.Modal.getInstance(drawer);
      if (modal) {
        modal.hide();
      }
    }
  }

  createCompareItem(product) {
    const div = document.createElement('div');
    div.className = 'tf-compare-item file-delete';
    div.innerHTML = `
      <span class="icon-close remove"></span>
      <a href="${product.url}" class="image">
        <img class="lazyload" 
          data-src="${product.image}"
          src="${product.image}" 
          alt="${product.title}">
      </a>
      <div class="content">
        <div class="text-title">
          <a class="link text-line-clamp-2" href="${product.url}">${product.title}</a>
        </div>
        <p class="price-wrap">
          <span class="new-price text-primary">${product.price}</span>
          ${product.compare_at_price ? `<span class="old-price text-decoration-line-through text-dark-1">${product.compare_at_price}</span>` : ''}
        </p>
      </div>
    `;
    return div;
  }

  getProductData(productId) {
    // This should be implemented to get product data from your theme
    // You might want to store product data in a data attribute or fetch it from an API
    const productElement = document.querySelector(`[data-product-id="${productId}"]`);
    if (!productElement) return null;

    return {
      id: productId,
      title: productElement.getAttribute('data-product-title'),
      url: productElement.getAttribute('data-product-url'),
      image: productElement.getAttribute('data-product-image'),
      price: productElement.getAttribute('data-product-price'),
      compare_at_price: productElement.getAttribute('data-product-compare-price')
    };
  }

  showNotification(message) {
    // Implement your notification system here
    console.log(message);
  }

  // Remove the addStyles method since we're using the theme's existing styles
  addStyles() {
    // No need to add styles as they're already in the theme
  }

  clearCompareList() {
    // Directly clear the compare list
    this.compareList = [];
    localStorage.removeItem(this.compareKey);
    
    // Update UI without showing notifications
    this.updateButtonsState();
    this.updateCompareDrawer();
    
    // Close the compare drawer
    const drawer = document.getElementById('compare');
    if (drawer) {
      const modal = bootstrap.Modal.getInstance(drawer);
      if (modal) {
        modal.hide();
      }
    }
    
    // Show only the clear notification
    this.showNotification('Compare list cleared');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.wishlistCompare = new WishlistCompare();
  window.wishlistCompare.addStyles();
}); 
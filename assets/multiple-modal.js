// Vanilla JS rewrite of multiple-modal.js
// MultiModal manager for Bootstrap modals

class MultiModal {
  constructor(element) {
    this.element = element;
    this.modalCount = 0;
  }

  static BASE_ZINDEX = 1050;

  show(target) {
    const modalIndex = this.modalCount++;
    target.style.zIndex = MultiModal.BASE_ZINDEX + (modalIndex * 20) + 10;
    // Timeout to allow Bootstrap to create the backdrop
    window.setTimeout(() => {
      // Hide all but the first backdrop
      const backdrops = Array.from(document.querySelectorAll('.modal-backdrop'));
      backdrops.forEach((bd, i) => {
        if (i > 0) bd.classList.add('hidden');
        else bd.classList.remove('hidden');
      });
      this.adjustBackdrop();
    });
  }

  hidden(target) {
    this.modalCount--;
    if (this.modalCount) {
      this.adjustBackdrop();
      // Bootstrap removes modal-open; add it back
      document.body.classList.add('modal-open');
    }
  }

  adjustBackdrop() {
    const modalIndex = this.modalCount - 1;
    const firstBackdrop = document.querySelector('.modal-backdrop');
    if (firstBackdrop) {
      firstBackdrop.style.zIndex = MultiModal.BASE_ZINDEX + (modalIndex * 20);
    }
  }
}

// Singleton instance for document
const multiModalInstance = new MultiModal(document);

// Listen for Bootstrap modal events
// (Assumes Bootstrap's events are available on document)
document.addEventListener('show.bs.modal', function(e) {
  multiModalInstance.show(e.target);
});
document.addEventListener('hidden.bs.modal', function(e) {
  multiModalInstance.hidden(e.target);
});

// Usage: Bootstrap modals will trigger these events automatically.
// No jQuery required.

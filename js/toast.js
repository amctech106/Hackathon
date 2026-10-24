/**
 * AMC Tech - Modern Toast Notifications & Modal Dialogs
 * Beautiful CSS-based alerts, toasts, and confirmation modals.
 * Replaces standard browser alert() and confirm() with modern UI.
 */

(function () {
  const Toast = {
    container: null,

    initContainer() {
      if (!this.container || !document.body.contains(this.container)) {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
      }
    },

    /**
     * Show a modern toast notification
     * @param {string} message
     * @param {'success'|'error'|'warning'|'info'} type
     * @param {number} duration in milliseconds
     * @param {string} title
     */
    show(message, type = 'info', duration = 3500, title = '') {
      this.initContainer();

      const toast = document.createElement('div');
      toast.className = `toast-item toast-${type}`;

      // Default icon and title based on type
      let iconClass = 'fa-solid fa-circle-info';
      let defaultTitle = 'Notification';

      if (type === 'success') {
        iconClass = 'fa-solid fa-circle-check';
        defaultTitle = 'Success';
      } else if (type === 'error') {
        iconClass = 'fa-solid fa-circle-exclamation';
        defaultTitle = 'Error';
      } else if (type === 'warning') {
        iconClass = 'fa-solid fa-triangle-exclamation';
        defaultTitle = 'Warning';
      } else if (type === 'info') {
        iconClass = 'fa-solid fa-circle-info';
        defaultTitle = 'Information';
      }

      const displayTitle = title || defaultTitle;

      toast.innerHTML = `
        <div class="toast-icon">
          <i class="${iconClass}"></i>
        </div>
        <div class="toast-content">
          <div class="toast-title">${displayTitle}</div>
          <div class="toast-message">${message}</div>
        </div>
        <button type="button" class="toast-close" aria-label="Close">&times;</button>
        <div class="toast-progress">
          <div class="toast-progress-bar" style="animation-duration: ${duration}ms;"></div>
        </div>
      `;

      // Close button handler
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => this.remove(toast));

      this.container.appendChild(toast);

      // Auto dismiss after duration
      const timer = setTimeout(() => {
        this.remove(toast);
      }, duration);

      toast.dataset.timer = timer;
    },

    remove(toast) {
      if (!toast || toast.classList.contains('toast-hiding')) return;
      clearTimeout(toast.dataset.timer);
      toast.classList.add('toast-hiding');
      toast.addEventListener('animationend', () => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, { once: true });
    },

    success(msg, title = 'Success', duration = 3500) {
      this.show(msg, 'success', duration, title);
    },

    error(msg, title = 'Error', duration = 4000) {
      this.show(msg, 'error', duration, title);
    },

    warning(msg, title = 'Warning', duration = 4000) {
      this.show(msg, 'warning', duration, title);
    },

    info(msg, title = 'Information', duration = 3500) {
      this.show(msg, 'info', duration, title);
    }
  };

  /**
   * Beautiful CSS Modal Dialog for Confirmations & Important Alerts
   */
  const AppModal = {
    /**
     * Shows a beautiful Confirmation Dialog
     * @param {string} message
     * @param {Object} options
     * @param {Function} options.onConfirm
     * @param {Function} [options.onCancel]
     * @param {string} [options.title='Confirm Action']
     * @param {'danger'|'warning'|'primary'|'info'} [options.type='danger']
     * @param {string} [options.confirmText='Confirm']
     * @param {string} [options.cancelText='Cancel']
     */
    confirm(message, options = {}) {
      const {
        onConfirm,
        onCancel,
        title = 'Are you sure?',
        type = 'danger',
        confirmText = 'Confirm',
        cancelText = 'Cancel'
      } = options;

      const backdrop = document.createElement('div');
      backdrop.className = 'custom-modal-backdrop';

      let iconClass = 'fa-solid fa-triangle-exclamation';
      if (type === 'danger') iconClass = 'fa-solid fa-trash-can';
      if (type === 'warning') iconClass = 'fa-solid fa-triangle-exclamation';
      if (type === 'info') iconClass = 'fa-solid fa-circle-question';

      const confirmBtnClass = type === 'danger' ? 'btn-danger' : (type === 'warning' ? 'btn-warning' : 'btn-primary');

      backdrop.innerHTML = `
        <div class="custom-modal-box">
          <div class="custom-modal-icon-wrap ${type}">
            <i class="${iconClass}"></i>
          </div>
          <h3 class="custom-modal-title">${title}</h3>
          <p class="custom-modal-message">${message}</p>
          <div class="custom-modal-actions">
            <button type="button" class="btn btn-outline js-modal-cancel">${cancelText}</button>
            <button type="button" class="btn ${confirmBtnClass} js-modal-confirm">${confirmText}</button>
          </div>
        </div>
      `;

      const closeModal = () => {
        backdrop.style.opacity = '0';
        backdrop.style.transition = 'opacity 0.2s ease';
        setTimeout(() => {
          if (backdrop.parentElement) {
            backdrop.parentElement.removeChild(backdrop);
          }
        }, 200);
      };

      backdrop.querySelector('.js-modal-cancel').addEventListener('click', () => {
        closeModal();
        if (typeof onCancel === 'function') onCancel();
      });

      backdrop.querySelector('.js-modal-confirm').addEventListener('click', () => {
        closeModal();
        if (typeof onConfirm === 'function') onConfirm();
      });

      // Close on clicking backdrop outside box
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          closeModal();
          if (typeof onCancel === 'function') onCancel();
        }
      });

      document.body.appendChild(backdrop);
    },

    /**
     * Shows a beautiful centered Alert Dialog
     */
    alert(message, options = {}) {
      const {
        title = 'Notice',
        type = 'info',
        buttonText = 'OK',
        onClose
      } = (typeof options === 'string' ? { title: options } : options);

      const backdrop = document.createElement('div');
      backdrop.className = 'custom-modal-backdrop';

      let iconClass = 'fa-solid fa-circle-info';
      if (type === 'success') iconClass = 'fa-solid fa-circle-check';
      if (type === 'error' || type === 'danger') iconClass = 'fa-solid fa-circle-xmark';
      if (type === 'warning') iconClass = 'fa-solid fa-triangle-exclamation';

      backdrop.innerHTML = `
        <div class="custom-modal-box">
          <div class="custom-modal-icon-wrap ${type}">
            <i class="${iconClass}"></i>
          </div>
          <h3 class="custom-modal-title">${title}</h3>
          <p class="custom-modal-message">${message}</p>
          <div class="custom-modal-actions">
            <button type="button" class="btn btn-primary js-modal-ok">${buttonText}</button>
          </div>
        </div>
      `;

      const closeModal = () => {
        backdrop.style.opacity = '0';
        backdrop.style.transition = 'opacity 0.2s ease';
        setTimeout(() => {
          if (backdrop.parentElement) {
            backdrop.parentElement.removeChild(backdrop);
          }
          if (typeof onClose === 'function') onClose();
        }, 200);
      };

      backdrop.querySelector('.js-modal-ok').addEventListener('click', closeModal);
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
      });

      document.body.appendChild(backdrop);
    }
  };

  // Replace default window.alert with modern CSS Toast
  window.alert = function (message) {
    if (!message) return;
    const str = String(message).toLowerCase();

    // Determine type automatically from message content
    if (str.includes('success') || str.includes('welcome') || str.includes('registered') || str.includes('approved') || str.includes('saved')) {
      Toast.success(message);
    } else if (str.includes('error') || str.includes('failed') || str.includes('invalid') || str.includes('cannot') || str.includes('insufficient') || str.includes('not found') || str.includes('already exists') || str.includes('already checked')) {
      Toast.error(message);
    } else if (str.includes('late') || str.includes('warning') || str.includes('note:') || str.includes('attention')) {
      Toast.warning(message);
    } else {
      Toast.info(message);
    }
  };

  // Expose utilities globally
  window.Toast = Toast;
  window.showToast = Toast.show.bind(Toast);
  window.AppModal = AppModal;
  window.showConfirm = AppModal.confirm.bind(AppModal);
  window.showAlertModal = AppModal.alert.bind(AppModal);
})();

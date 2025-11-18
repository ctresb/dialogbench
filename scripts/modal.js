/**
 * Confirmation Modal Module
 * Shows confirmation dialogs for destructive actions
 */

import { t } from './i18n.js';

let modalContainer = null;
let currentModal = null;
let resolveCallback = null;

export function initConfirmModal() {
    // Create modal container
    modalContainer = document.createElement('div');
    modalContainer.className = 'confirm-modal-overlay';
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            closeConfirmModal(false);
        }
    });
    document.body.appendChild(modalContainer);
}

/**
 * Show a confirmation modal
 * @param {Object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {string} options.confirmText - Confirm button text (default: 'Confirm')
 * @param {string} options.cancelText - Cancel button text (default: 'Cancel')
 * @param {string} options.type - Type: 'danger', 'warning', 'info' (default: 'danger')
 * @param {Object} options.checkbox - Optional checkbox configuration
 * @param {string} options.checkbox.label - Checkbox label text
 * @param {boolean} options.checkbox.defaultChecked - Default checked state
 * @returns {Promise<Object>} - Resolves to {confirmed: boolean, checkboxValue: boolean}
 */
export function showConfirmModal(options = {}) {
    if (!modalContainer) {
        initConfirmModal();
    }

    const {
        title = t('modal_confirm_action'),
        message = t('modal_confirm_message'),
        confirmText = t('modal_confirm_text'),
        cancelText = t('modal_cancel_text'),
        type = 'danger',
        checkbox = null
    } = options;

    return new Promise((resolve) => {
        resolveCallback = resolve;

        // Close any existing modal
        if (currentModal) {
            modalContainer.innerHTML = '';
        }

        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'confirm-modal-content';

        const header = document.createElement('div');
        header.className = 'confirm-modal-header';

        const icon = document.createElement('span');
        icon.className = 'material-symbols-rounded confirm-modal-icon';
        icon.textContent = getIconForType(type);

        const titleEl = document.createElement('h3');
        titleEl.textContent = title;

        header.appendChild(icon);
        header.appendChild(titleEl);

        const body = document.createElement('div');
        body.className = 'confirm-modal-body';
        body.textContent = message;
        
        // Add checkbox if provided
        let checkboxInput = null;
        if (checkbox) {
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'confirm-modal-checkbox';
            
            checkboxInput = document.createElement('input');
            checkboxInput.type = 'checkbox';
            checkboxInput.id = 'confirmModalCheckbox';
            checkboxInput.checked = checkbox.defaultChecked || false;
            
            const checkboxLabel = document.createElement('label');
            checkboxLabel.htmlFor = 'confirmModalCheckbox';
            checkboxLabel.textContent = checkbox.label;
            
            checkboxContainer.appendChild(checkboxInput);
            checkboxContainer.appendChild(checkboxLabel);
            body.appendChild(checkboxContainer);
        }

        const footer = document.createElement('div');
        footer.className = 'confirm-modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-modal-cancel';
        cancelBtn.textContent = cancelText;
        cancelBtn.addEventListener('click', () => closeConfirmModal(false));

        const confirmBtn = document.createElement('button');
        confirmBtn.className = `btn-modal-confirm btn-modal-${type}`;
        confirmBtn.textContent = confirmText;
        confirmBtn.addEventListener('click', () => {
            const checkboxValue = checkboxInput ? checkboxInput.checked : false;
            closeConfirmModal(true, checkboxValue);
        });

        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);

        modalContainer.appendChild(modal);
        currentModal = modal;

        // Show modal with animation
        modalContainer.classList.add('active');
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Focus confirm button for keyboard accessibility
        confirmBtn.focus();

        // Handle ESC key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeConfirmModal(false);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

function closeConfirmModal(confirmed, checkboxValue = false) {
    if (!currentModal) return;

    currentModal.classList.remove('show');
    
    setTimeout(() => {
        modalContainer.classList.remove('active');
        modalContainer.innerHTML = '';
        currentModal = null;
        
        if (resolveCallback) {
            resolveCallback({ confirmed, checkboxValue });
            resolveCallback = null;
        }
    }, 200);
}

function getIconForType(type) {
    switch (type) {
        case 'danger':
            return 'warning';
        case 'warning':
            return 'error_outline';
        case 'info':
        default:
            return 'help_outline';
    }
}

// Convenience methods
export const confirm = {
    danger: (title, message, confirmText = 'Delete') => 
        showConfirmModal({ title, message, confirmText, type: 'danger' }),
    warning: (title, message, confirmText = 'Proceed') => 
        showConfirmModal({ title, message, confirmText, type: 'warning' }),
    info: (title, message, confirmText = 'OK') => 
        showConfirmModal({ title, message, confirmText, type: 'info' })
};

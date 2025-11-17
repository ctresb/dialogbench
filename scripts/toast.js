/**
 * Toast Notification Module
 * Displays temporary notifications with aesthetic styling
 */

let toastContainer = null;
let activeToasts = [];

export function initToast() {
    // Create toast container
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type of toast: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
    if (!toastContainer) {
        initToast();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add icon based on type
    const icon = document.createElement('span');
    icon.className = 'material-icons toast-icon';
    icon.textContent = getIconForType(type);
    
    const text = document.createElement('span');
    text.className = 'toast-message';
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    
    toastContainer.appendChild(toast);
    activeToasts.push(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('toast-show');
    }, 10);
    
    // Auto dismiss
    setTimeout(() => {
        dismissToast(toast);
    }, duration);
    
    return toast;
}

function dismissToast(toast) {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
        activeToasts = activeToasts.filter(t => t !== toast);
    }, 300);
}

function getIconForType(type) {
    switch (type) {
        case 'success':
            return 'check_circle';
        case 'error':
            return 'error';
        case 'warning':
            return 'warning';
        case 'info':
        default:
            return 'info';
    }
}

// Convenience methods
export const toast = {
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    info: (message, duration) => showToast(message, 'info', duration),
    warning: (message, duration) => showToast(message, 'warning', duration)
};

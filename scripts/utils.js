/**
 * Utilities Module
 * Helper functions for colors, toasts, and other utilities
 */

import { elements } from './dom.js';

export function getRandomColor() {
    // Base color: HSL(46, 65%, 38%)
    // Vary only HUE (0-360)
    const hue = Math.floor(Math.random() * 360);
    const saturation = 65;
    const lightness = 38;
    
    return hslToHex(hue, saturation, lightness);
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export function showToast(message) {
    const indicator = elements.autoSaveIndicator;
    indicator.textContent = message;
    indicator.style.opacity = '1';
    indicator.style.display = 'flex';
    
    setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 300);
    }, 2000);
}

export function copyToClipboard(text, successMessage = '📋 Texto copiado!') {
    navigator.clipboard.writeText(text).then(() => {
        showToast(successMessage);
    });
}

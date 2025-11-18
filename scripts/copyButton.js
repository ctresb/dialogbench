/**
 * Copy Button Module
 * Modular copy button component for blocks
 */

import { t } from './i18n.js';

/**
 * Create a copy button HTML
 * @param {number} blockId - The ID of the block
 * @param {number} index - The index of the item
 * @param {string} type - The type of item ('response', 'custom', 'event-title', etc.)
 * @returns {string} HTML string for the copy button
 */
export function createCopyButton(blockId, index, type = 'response') {
    const dataAttr = type === 'event-title' 
        ? `data-block-id="${blockId}"` 
        : `data-block-id="${blockId}" data-${type}-index="${index}"`;
    
    return `
        <button class="copy-btn" ${dataAttr}>
            <span class="material-symbols-rounded">content_copy</span>
        </button>
    `;
}

/**
 * Set up copy button event listener
 * @param {HTMLElement} element - The element containing the copy button
 * @param {Function} onCopy - Callback function to execute when copy is clicked
 */
export function setupCopyButton(element, onCopy) {
    if (!element) return;
    
    const copyBtn = element.querySelector('.copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', onCopy);
    }
}

/**
 * Delete Block Button Module
 * Modular delete button component for blocks
 */

import { t } from './i18n.js';

/**
 * Create a delete button HTML for a block
 * @param {number} blockId - The ID of the block
 * @returns {string} HTML string for the delete button
 */
export function createDeleteButton(blockId) {
    return `
        <button class="delete-block-btn" data-block-id="${blockId}">
            <span class="material-symbols-rounded">delete</span> 
            <span data-i18n="delete_block">${t('delete_block')}</span>
        </button>
    `;
}

/**
 * Set up delete button event listener
 * @param {HTMLElement} element - The block element containing the delete button
 * @param {Function} onDelete - Callback function to execute when delete is clicked
 */
export function setupDeleteButton(element, onDelete) {
    if (!element) return;
    
    const deleteBtn = element.querySelector('.delete-block-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', onDelete);
    }
}

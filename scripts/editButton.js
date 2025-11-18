/**
 * Edit Button Module
 * Modular edit button component for blocks
 */

import { t } from './i18n.js';

/**
 * Create an edit button HTML
 * @param {number} blockId - The ID of the block
 * @param {number} index - The index of the item
 * @param {string} type - The type of item ('response', 'custom', 'event-title', etc.)
 * @returns {string} HTML string for the edit button
 */
export function createEditButton(blockId, index, type = 'response') {
    const dataAttr = type === 'event-title' 
        ? `data-block-id="${blockId}"` 
        : `data-block-id="${blockId}" data-${type}-index="${index}"`;
    
    return `
        <button class="edit-btn" ${dataAttr}>
            <span class="material-symbols-rounded">edit</span>
        </button>
    `;
}

/**
 * Set up edit button event listener
 * @param {HTMLElement} element - The element containing the edit button
 * @param {Function} onEdit - Callback function to execute when edit is clicked
 */
export function setupEditButton(element, onEdit) {
    if (!element) return;
    
    const editBtn = element.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', onEdit);
    }
}

/**
 * Block Header Module
 * Modular header component for blocks with ID and delete button
 */

import { createDeleteButton } from './deleteBlockButton.js';
import { t } from './i18n.js';

/**
 * Create a block header HTML
 * @param {number} blockId - The ID of the block
 * @param {string} type - The type of block ('dialog' or 'event')
 * @returns {string} HTML string for the block header
 */
export function createBlockHeader(blockId, type = 'dialog') {
    const formattedId = `#${String(blockId).padStart(4, '0')}`;
    
    return `
        <div class="dialog-header">
            <div class="dialog-id">${formattedId}</div>
            ${createDeleteButton(blockId)}
        </div>
    `;
}

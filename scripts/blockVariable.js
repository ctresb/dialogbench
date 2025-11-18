/**
 * Block Variable Module
 * Modular variable system for blocks (customValues/variables)
 */

import { t } from './i18n.js';
import { copyToClipboard } from './utils.js';
import { openAddCustomModal, editCustom } from './modals.js';
import { autoSave } from './storage.js';

/**
 * Create HTML for variable section
 * @param {Array} variables - Array of variable objects
 * @param {number} blockId - The ID of the block
 * @param {string} sectionClass - CSS class for the section (default: 'custom-section')
 * @returns {string} HTML string for variables
 */
export function createVariablesHTML(variables, blockId, sectionClass = 'custom-section') {
    return `
        <div class="${sectionClass}">
            ${variables.map((variable, index) => `
                <div class="custom-item">
                    <button class="custom-btn" style="background: ${variable.color}">
                        <span class="variable-name">${variable.name}</span>
                        <span class="variable-separator">=</span>
                        <span class="variable-value">${variable.value}</span>
                    </button>
                    <div class="item-actions">
                        <button class="edit-btn" data-block-id="${blockId}" data-custom-index="${index}">
                            <span class="material-symbols-rounded">edit</span>
                        </button>
                        <button class="copy-btn" data-block-id="${blockId}" data-custom-index="${index}">
                            <span class="material-symbols-rounded">content_copy</span>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="add-custom-btn" data-block-id="${blockId}">+</div>
    `;
}

/**
 * Set up event listeners for variable buttons
 * @param {HTMLElement} element - The block element
 * @param {Array} variables - Array of variable objects
 * @param {number} blockId - The ID of the block
 * @param {string} sectionSelector - CSS selector for the section (default: '.custom-section')
 */
export function setupVariableListeners(element, variables, blockId, sectionSelector = '.custom-section') {
    if (!element) return;

    // Edit buttons
    const customEditBtns = element.querySelectorAll(`${sectionSelector} .edit-btn`);
    customEditBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const customIndex = parseInt(btn.dataset.customIndex);
            editCustom(blockId, customIndex);
        });
    });

    // Copy buttons
    const customCopyBtns = element.querySelectorAll(`${sectionSelector} .copy-btn`);
    customCopyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const customIndex = parseInt(btn.dataset.customIndex);
            copyVariable(variables, customIndex);
        });
    });

    // Add variable button
    const addCustomBtn = element.querySelector('.add-custom-btn');
    if (addCustomBtn) {
        addCustomBtn.addEventListener('click', () => {
            openAddCustomModal(blockId);
        });
    }
}

/**
 * Copy variable to clipboard
 * @param {Array} variables - Array of variable objects
 * @param {number} index - Index of the variable to copy
 */
export function copyVariable(variables, index) {
    const variable = variables[index];
    if (variable) {
        const variableText = `${variable.name} = ${variable.value}`;
        copyToClipboard(variableText);
    }
}

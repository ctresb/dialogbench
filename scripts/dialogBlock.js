/**
 * DialogBlock Module - Dialog-specific Block Implementation
 * Extends Block class with dialog functionality: lines, responses, and custom values
 */

import { Block } from './block.js';
import { getBlock, removeBlock } from './state.js';
import { updateConnections } from './connections.js';
import { autoSave } from './storage.js';
import { copyToClipboard } from './utils.js';
import { openAddResponseModal, openAddCustomModal, editResponse, editCustom } from './modals.js';
import { t } from './i18n.js';

export class DialogBlock extends Block {
    constructor(data) {
        super(data);
        this.lines = data.lines || [];
        this.responses = data.responses || [];
        this.customValues = data.customValues || [];
    }

    /**
     * Get dialog block content HTML
     */
    getContent() {
        return `
            <div class="dialog-header">
                <div class="dialog-id">#${String(this.id).padStart(4, '0')}</div>
                <button class="delete-block-btn" data-block-id="${this.id}">
                    <span class="material-symbols-rounded">delete</span> <span data-i18n="delete_block">${t('delete_block')}</span>
                </button>
            </div>
            
            <div class="dialog-lines">
                ${this.lines.map((line, index) => `
                    <div class="dialog-line-wrapper">
                        <textarea class="dialog-line" 
                            data-block-id="${this.id}"
                            data-line-index="${index}"
                            rows="1">${line}</textarea>
                        <button class="copy-line-btn" data-block-id="${this.id}" data-line-index="${index}" data-i18n-title="copy_text" title="${t('copy_text')}">
                            <span class="material-symbols-rounded">content_copy</span>
                        </button>
                    </div>
                `).join('')}
            </div>
            
            <div class="add-line-btn" data-block-id="${this.id}">+</div>
            
            <div class="divider"></div>
            
            <div class="responses-section">
                ${this.responses.map((response, index) => `
                    <div class="response-item">
                        <button class="response-btn" style="background: ${response.color}">
                            ${response.text}
                        </button>
                        <div class="item-actions">
                            <button class="edit-btn" data-block-id="${this.id}" data-response-index="${index}">
                                <span class="material-symbols-rounded">edit</span>
                            </button>
                            <button class="copy-btn" data-block-id="${this.id}" data-response-index="${index}">
                                <span class="material-symbols-rounded">content_copy</span>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="add-response-btn" data-block-id="${this.id}">+</div>
            
            <div class="divider"></div>
            
            <div class="custom-section">
                ${this.customValues.map((variable, index) => `
                    <div class="custom-item">
                        <button class="custom-btn" style="background: ${variable.color}">
                            <span class="variable-name">${variable.name}</span>
                            <span class="variable-separator">=</span>
                            <span class="variable-value">${variable.value}</span>
                        </button>
                        <div class="item-actions">
                            <button class="edit-btn" data-block-id="${this.id}" data-custom-index="${index}">
                                <span class="material-symbols-rounded">edit</span>
                            </button>
                            <button class="copy-btn" data-block-id="${this.id}" data-custom-index="${index}">
                                <span class="material-symbols-rounded">content_copy</span>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="add-custom-btn" data-block-id="${this.id}">+</div>
        `;
    }

    /**
     * Set up dialog-specific event listeners
     */
    setupListeners() {
        if (!this.element) return;

        // Delete block button
        const deleteBtn = this.element.querySelector('.delete-block-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.delete());
        }

        // Dialog lines
        this.setupLineListeners();

        // Copy line buttons
        const copyLineBtns = this.element.querySelectorAll('.copy-line-btn');
        copyLineBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const lineIndex = parseInt(btn.dataset.lineIndex);
                this.copyLine(lineIndex);
            });
        });

        // Add line button
        const addLineBtn = this.element.querySelector('.add-line-btn');
        if (addLineBtn) {
            addLineBtn.addEventListener('click', () => this.addLine());
        }

        // Response buttons
        this.setupResponseListeners();

        // Custom value buttons
        this.setupCustomListeners();
    }

    /**
     * Set up listeners for dialog lines
     */
    setupLineListeners() {
        const lineInputs = this.element.querySelectorAll('.dialog-line');
        lineInputs.forEach((textarea, index) => {
            // Auto-resize textarea
            const handleInput = function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            };
            textarea.addEventListener('input', handleInput);
            
            // Trigger resize on load
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight) + 'px';
            
            // Update line value
            textarea.addEventListener('change', () => {
                this.updateLine(index, textarea.value);
            });
            
            // Keyboard shortcuts
            textarea.addEventListener('keydown', (e) => {
                // Shift + Enter: save and create new line
                if (e.shiftKey && e.key === 'Enter') {
                    e.preventDefault();
                    this.lines[index] = textarea.value;
                    this.addLineAndFocus(index + 1);
                }
                // Backspace on empty line: delete line and focus previous
                else if (e.key === 'Backspace' && textarea.value === '' && this.lines.length > 1) {
                    e.preventDefault();
                    this.deleteLineAndFocusPrevious(index);
                }
            });
        });
    }

    /**
     * Set up listeners for response buttons
     */
    setupResponseListeners() {
        // Response edit buttons
        const responseEditBtns = this.element.querySelectorAll('.responses-section .edit-btn');
        responseEditBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const responseIndex = parseInt(btn.dataset.responseIndex);
                editResponse(this.id, responseIndex);
            });
        });

        // Response copy buttons
        const responseCopyBtns = this.element.querySelectorAll('.responses-section .copy-btn');
        responseCopyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const responseIndex = parseInt(btn.dataset.responseIndex);
                this.copyResponse(responseIndex);
            });
        });

        // Add response button
        const addResponseBtn = this.element.querySelector('.add-response-btn');
        if (addResponseBtn) {
            addResponseBtn.addEventListener('click', () => {
                openAddResponseModal(this.id);
            });
        }
    }

    /**
     * Set up listeners for custom value buttons
     */
    setupCustomListeners() {
        // Custom edit buttons
        const customEditBtns = this.element.querySelectorAll('.custom-section .edit-btn');
        customEditBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const customIndex = parseInt(btn.dataset.customIndex);
                editCustom(this.id, customIndex);
            });
        });

        // Custom copy buttons
        const customCopyBtns = this.element.querySelectorAll('.custom-section .copy-btn');
        customCopyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const customIndex = parseInt(btn.dataset.customIndex);
                this.copyCustom(customIndex);
            });
        });

        // Add custom button
        const addCustomBtn = this.element.querySelector('.add-custom-btn');
        if (addCustomBtn) {
            addCustomBtn.addEventListener('click', () => {
                openAddCustomModal(this.id);
            });
        }
    }

    /**
     * Add a new line
     */
    addLine() {
        this.lines.push(t('new_dialogue_line'));
        this.render();
        autoSave();
    }

    /**
     * Add a line at specific index and focus it
     */
    addLineAndFocus(atIndex) {
        this.lines.splice(atIndex, 0, '');
        this.render();
        autoSave();
        
        // Focus on new line
        setTimeout(() => {
            const inputs = this.element.querySelectorAll('.dialog-line');
            if (inputs[atIndex]) {
                inputs[atIndex].focus();
            }
        }, 10);
    }

    /**
     * Delete a line and focus previous
     */
    deleteLineAndFocusPrevious(lineIndex) {
        if (this.lines.length > 1) {
            this.lines.splice(lineIndex, 1);
            this.render();
            autoSave();
            
            // Focus on previous line
            setTimeout(() => {
                const inputs = this.element.querySelectorAll('.dialog-line');
                const previousIndex = Math.max(0, lineIndex - 1);
                if (inputs[previousIndex]) {
                    inputs[previousIndex].focus();
                    // Move cursor to end
                    inputs[previousIndex].setSelectionRange(
                        inputs[previousIndex].value.length, 
                        inputs[previousIndex].value.length
                    );
                }
            }, 10);
        }
    }

    /**
     * Update line value
     */
    updateLine(lineIndex, value) {
        this.lines[lineIndex] = value;
        autoSave();
    }

    /**
     * Copy line to clipboard
     */
    copyLine(lineIndex) {
        if (this.lines[lineIndex]) {
            copyToClipboard(this.lines[lineIndex]);
        }
    }

    /**
     * Copy response to clipboard
     */
    copyResponse(responseIndex) {
        const response = this.responses[responseIndex];
        if (response) {
            copyToClipboard(response.text);
        }
    }

    /**
     * Copy custom value to clipboard
     */
    copyCustom(customIndex) {
        const variable = this.customValues[customIndex];
        if (variable) {
            const variableText = `${variable.name} = ${variable.value}`;
            copyToClipboard(variableText);
        }
    }

    /**
     * Delete this block
     */
    delete() {
        if (confirm(t('confirm_delete_block'))) {
            removeBlock(this.id);
            this.remove();
            updateConnections();
            autoSave();
        }
    }

    /**
     * Export dialog block data
     */
    toJSON() {
        return {
            ...super.toJSON(),
            lines: this.lines,
            responses: this.responses,
            customValues: this.customValues
        };
    }

    /**
     * Update from state data
     */
    updateFromState() {
        const stateBlock = getBlock(this.id);
        if (stateBlock) {
            this.x = stateBlock.x;
            this.y = stateBlock.y;
            this.lines = stateBlock.lines;
            this.responses = stateBlock.responses;
            this.customValues = stateBlock.customValues;
        }
    }
}

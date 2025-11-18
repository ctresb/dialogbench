/**
 * LogicBlock Module - Logic-specific Block Implementation
 * Extends Block class with conditional logic functionality
 */

import { Block } from './block.js';
import { getBlock, removeBlock, getGlobalVariable } from './state.js';
import { updateConnections } from './connections.js';
import { autoSave } from './storage.js';
import { copyToClipboard } from './utils.js';
import { createBlockHeader } from './blockHeader.js';
import { setupDeleteButton } from './deleteBlockButton.js';
import { createEditButton, setupEditButton } from './editButton.js';
import { createCopyButton, setupCopyButton } from './copyButton.js';
import { openEditLogicModal } from './modals.js';
import { showConfirmModal } from './modal.js';
import { t } from './i18n.js';

export class LogicBlock extends Block {
    constructor(data) {
        super(data);
        this.type = 'logic';
        this.variable = data.variable || '';
        this.operator = data.operator || 'equals';
        this.compareValue = data.compareValue || '';
        this.targetTrue = data.targetTrue || null;
        this.targetFalse = data.targetFalse || null;
        this.backgroundColor = data.backgroundColor || '#e67e22';
    }

    /**
     * Get logic block content HTML
     */
    getContent() {
        const variableDisplay = this.variable || t('no_variable');
        const operatorDisplay = this.getOperatorDisplay();
        const valueDisplay = this.compareValue || t('no_value');
        const targetTrueDisplay = this.targetTrue ? this.targetTrue : t('no_connection');
        const targetFalseDisplay = this.targetFalse ? this.targetFalse : t('no_connection');
        const hasTrueConnection = !!this.targetTrue;
        const hasFalseConnection = !!this.targetFalse;
        
        return `
            ${createBlockHeader(this.id, 'logic')}
            
            <div class="logic-block-inner" style="background: ${this.backgroundColor}">
                <div class="logic-condition-section">
                    <div class="logic-label">${t('logic_if')}</div>
                    <div class="logic-condition">
                        <div class="logic-variable">${variableDisplay}</div>
                        <div class="logic-operator">${operatorDisplay}</div>
                        <div class="logic-value">${valueDisplay}</div>
                    </div>
                    <div class="item-actions">
                        ${createEditButton(this.id, 0, 'logic-condition')}
                    </div>
                </div>
                
                <div class="divider"></div>
                
                <div class="logic-branch-section">
                    <div class="logic-branch logic-branch-true">
                        <div class="logic-branch-label">${t('logic_true')}</div>
                        <div class="logic-connection ${hasTrueConnection ? 'has-connection' : ''}">${targetTrueDisplay}</div>
                        ${hasTrueConnection ? `<div class="item-actions">${createCopyButton(this.id, 0, 'logic-true')}</div>` : ''}
                    </div>
                    
                    <div class="logic-branch logic-branch-false">
                        <div class="logic-branch-label">${t('logic_false')}</div>
                        <div class="logic-connection ${hasFalseConnection ? 'has-connection' : ''}">${targetFalseDisplay}</div>
                        ${hasFalseConnection ? `<div class="item-actions">${createCopyButton(this.id, 0, 'logic-false')}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get operator display text
     */
    getOperatorDisplay() {
        switch (this.operator) {
            case 'equals':
                return '==';
            case 'not_equals':
                return '!=';
            case 'greater':
                return '>';
            case 'less':
                return '<';
            case 'greater_equals':
                return '>=';
            case 'less_equals':
                return '<=';
            default:
                return '==';
        }
    }

    /**
     * Set up logic-specific event listeners
     */
    setupListeners() {
        if (!this.element) return;

        // Delete block button
        setupDeleteButton(this.element, () => this.delete());

        // Edit button (opens modal)
        const conditionSection = this.element.querySelector('.logic-condition-section');
        if (conditionSection) {
            setupEditButton(conditionSection, () => {
                openEditLogicModal(this.id);
            });
        }

        // Make condition clickable to edit
        const conditionDiv = this.element.querySelector('.logic-condition');
        if (conditionDiv) {
            conditionDiv.addEventListener('click', () => {
                openEditLogicModal(this.id);
            });
        }

        // Make branch connections clickable to edit
        const trueBranch = this.element.querySelector('.logic-branch-true .logic-connection');
        const falseBranch = this.element.querySelector('.logic-branch-false .logic-connection');
        
        if (trueBranch) {
            trueBranch.addEventListener('click', () => {
                openEditLogicModal(this.id);
            });
        }
        
        if (falseBranch) {
            falseBranch.addEventListener('click', () => {
                openEditLogicModal(this.id);
            });
        }

        // Copy buttons
        const trueCopySection = this.element.querySelector('.logic-branch-true');
        if (trueCopySection && this.targetTrue) {
            setupCopyButton(trueCopySection, () => {
                copyToClipboard(this.targetTrue);
            });
        }
        
        const falseCopySection = this.element.querySelector('.logic-branch-false');
        if (falseCopySection && this.targetFalse) {
            setupCopyButton(falseCopySection, () => {
                copyToClipboard(this.targetFalse);
            });
        }
    }

    /**
     * Override shouldStartDrag to prevent dragging from buttons
     */
    shouldStartDrag(e) {
        // Don't start drag if clicking on buttons or interactive elements
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            return false;
        }
        // Don't drag when clicking on connections (they open edit modal)
        if (e.target.classList.contains('logic-connection')) {
            return false;
        }
        if (e.target.classList.contains('logic-condition')) {
            return false;
        }
        return e.target === this.element || 
               e.target.classList.contains('dialog-header') ||
               e.target.classList.contains('dialog-id') ||
               e.target.classList.contains('logic-block-inner') ||
               e.target.classList.contains('logic-condition-section') ||
               e.target.classList.contains('logic-branch-section');
    }

    /**
     * Update logic condition
     */
    updateCondition(variable, operator, compareValue) {
        this.variable = variable;
        this.operator = operator;
        this.compareValue = compareValue;
        const block = getBlock(this.id);
        if (block) {
            block.variable = variable;
            block.operator = operator;
            block.compareValue = compareValue;
        }
        autoSave();
    }

    /**
     * Update target connections
     */
    updateTargets(targetTrue, targetFalse) {
        this.targetTrue = targetTrue;
        this.targetFalse = targetFalse;
        const block = getBlock(this.id);
        if (block) {
            block.targetTrue = targetTrue;
            block.targetFalse = targetFalse;
        }
        autoSave();
    }

    /**
     * Update background color
     */
    updateBackgroundColor(color) {
        this.backgroundColor = color;
        const block = getBlock(this.id);
        if (block) {
            block.backgroundColor = color;
        }
        
        // Update full block background immediately
        const inner = this.element.querySelector('.logic-block-inner');
        if (inner) {
            inner.style.background = color;
        }
        
        autoSave();
    }

    /**
     * Delete this block
     */
    async delete() {
        const result = await showConfirmModal({
            title: t('confirm_delete_logic_title'),
            message: t('confirm_delete_logic'),
            confirmText: t('confirm_delete_logic_confirm'),
            cancelText: t('confirm_delete_logic_cancel'),
            type: 'danger'
        });
        
        if (result.confirmed) {
            removeBlock(this.id);
            this.remove();
            updateConnections();
            autoSave();
        }
    }

    /**
     * Export logic block data
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            variable: this.variable,
            operator: this.operator,
            compareValue: this.compareValue,
            targetTrue: this.targetTrue,
            targetFalse: this.targetFalse,
            backgroundColor: this.backgroundColor
        };
    }

    /**
     * Update from state data
     */
    updateFromState() {
        const block = getBlock(this.id);
        if (block) {
            this.variable = block.variable;
            this.operator = block.operator;
            this.compareValue = block.compareValue;
            this.targetTrue = block.targetTrue;
            this.targetFalse = block.targetFalse;
            this.backgroundColor = block.backgroundColor;
        }
    }
}

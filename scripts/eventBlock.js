/**
 * EventBlock Module - Event-specific Block Implementation
 * Extends Block class with event functionality: title, background color, and variables
 */

import { Block } from './block.js';
import { getBlock, removeBlock } from './state.js';
import { updateConnections } from './connections.js';
import { autoSave } from './storage.js';
import { copyToClipboard } from './utils.js';
import { createBlockHeader } from './blockHeader.js';
import { setupDeleteButton } from './deleteBlockButton.js';
import { createEditButton, setupEditButton } from './editButton.js';
import { createCopyButton, setupCopyButton } from './copyButton.js';
import { createVariablesHTML, setupVariableListeners } from './blockVariable.js';
import { openEditEventModal } from './modals.js';
import { t } from './i18n.js';

export class EventBlock extends Block {
    constructor(data) {
        super(data);
        this.type = 'event';
        this.title = data.title || t('default_event_title');
        this.backgroundColor = data.backgroundColor || '#9b59b6';
        this.customValues = data.customValues || [];
        this.target = data.target || null;
    }

    /**
     * Get event block content HTML
     */
    getContent() {
        const targetDisplay = this.target ? this.target : t('no_connection');
        const hasConnection = !!this.target;
        
        return `
            ${createBlockHeader(this.id, 'event')}
            
            <div class="event-block-inner" style="background: ${this.backgroundColor}">
                <div class="event-title-section">
                    <div class="event-title">${this.title}</div>
                    <div class="item-actions">
                        ${createEditButton(this.id, 0, 'event-title')}
                        ${createCopyButton(this.id, 0, 'event-title')}
                    </div>
                </div>
                
                <div class="divider"></div>
                
                <div class="event-connection-section">
                    <div class="event-connection ${hasConnection ? 'has-connection' : ''}">${targetDisplay}</div>
                    ${hasConnection ? `<div class="item-actions">${createCopyButton(this.id, 0, 'event-connection')}</div>` : ''}
                </div>
                
                <div class="divider"></div>
                
                ${createVariablesHTML(this.customValues, this.id)}
            </div>
        `;
    }

    /**
     * Set up event-specific event listeners
     */
    setupListeners() {
        if (!this.element) return;

        // Delete block button
        setupDeleteButton(this.element, () => this.delete());

        // Edit button (opens modal)
        const titleSection = this.element.querySelector('.event-title-section');
        if (titleSection) {
            setupEditButton(titleSection, () => {
                openEditEventModal(this.id);
            });
        }

        // Copy button
        if (titleSection) {
            setupCopyButton(titleSection, () => {
                copyToClipboard(this.title);
            });
        }

        // Connection section - make clickable and setup copy button
        const connectionSection = this.element.querySelector('.event-connection-section');
        if (connectionSection) {
            // Make the connection div itself clickable to edit
            const connectionDiv = connectionSection.querySelector('.event-connection');
            if (connectionDiv) {
                connectionDiv.addEventListener('click', () => {
                    openEditEventModal(this.id);
                });
            }
            
            // Copy button (only if there's a connection)
            if (this.target) {
                setupCopyButton(connectionSection, () => {
                    copyToClipboard(this.target);
                });
            }
        }

        // Variable buttons
        setupVariableListeners(this.element, this.customValues, this.id);
    }

    /**
     * Override shouldStartDrag to prevent dragging from buttons
     */
    shouldStartDrag(e) {
        // Don't start drag if clicking on buttons or interactive elements
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            return false;
        }
        // Don't drag when clicking on event connection (it opens edit modal)
        if (e.target.classList.contains('event-connection')) {
            return false;
        }
        return e.target === this.element || 
               e.target.classList.contains('dialog-header') ||
               e.target.classList.contains('dialog-id') ||
               e.target.classList.contains('event-block-inner') ||
               e.target.classList.contains('event-title') ||
               e.target.classList.contains('event-title-section');
    }

    /**
     * Update event title
     */
    updateTitle(title) {
        this.title = title;
        const block = getBlock(this.id);
        if (block) {
            block.title = title;
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
        const inner = this.element.querySelector('.event-block-inner');
        if (inner) {
            inner.style.background = color;
        }
        
        autoSave();
    }

    /**
     * Delete this block
     */
    delete() {
        if (confirm(t('confirm_delete_event'))) {
            removeBlock(this.id);
            this.remove();
            updateConnections();
            autoSave();
        }
    }

    /**
     * Export event block data
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            title: this.title,
            backgroundColor: this.backgroundColor,
            customValues: this.customValues,
            target: this.target
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
            this.title = stateBlock.title;
            this.backgroundColor = stateBlock.backgroundColor;
            this.customValues = stateBlock.customValues;
            this.target = stateBlock.target;
        }
    }
}

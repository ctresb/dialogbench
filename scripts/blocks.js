/**
 * Blocks Module
 * Handles block creation, rendering, and manipulation using modular block system
 */

import { addBlock, getNextId, getDialogData } from './state.js';
import { DialogBlock } from './dialogBlock.js';
import { EventBlock } from './eventBlock.js';
import { updateConnections } from './connections.js';
import { autoSave } from './storage.js';
import { generateColor } from './utils.js';
import { t } from './i18n.js';

// Store block instances
const blockInstances = new Map();

/**
 * Get or create block instance
 */
function getBlockInstance(blockData) {
    if (!blockInstances.has(blockData.id)) {
        // Determine which class to instantiate based on block type
        const BlockClass = blockData.type === 'event' ? EventBlock : DialogBlock;
        const instance = new BlockClass(blockData);
        blockInstances.set(blockData.id, instance);
    }
    return blockInstances.get(blockData.id);
}

/**
 * Remove block instance
 */
export function removeBlockInstance(blockId) {
    blockInstances.delete(blockId);
}

export function createNewDialog() {
    const dialogData = getDialogData();
    
    // Find rightmost block
    let maxX = 0;
    if (dialogData.blocks.length > 0) {
        maxX = Math.max(...dialogData.blocks.map(b => b.x));
        maxX += 390; // 320px block width + 50px margin
    } else {
        maxX = 100;
    }
    
    const newBlockData = {
        id: getNextId(),
        type: 'dialog',
        x: maxX,
        y: 100,
        lines: [t('default_dialogue_line_1'), t('default_dialogue_line_2')],
        responses: [],
        customValues: []
    };
    
    addBlock(newBlockData);
    renderBlock(newBlockData);
    autoSave();
}

export function createNewEvent() {
    const dialogData = getDialogData();
    
    // Find rightmost block
    let maxX = 0;
    if (dialogData.blocks.length > 0) {
        maxX = Math.max(...dialogData.blocks.map(b => b.x));
        maxX += 390; // 320px block width + 50px margin
    } else {
        maxX = 100;
    }
    
    const newBlockData = {
        id: getNextId(),
        type: 'event',
        x: maxX,
        y: 100,
        title: t('default_event_title'),
        backgroundColor: generateColor(),
        customValues: []
    };
    
    addBlock(newBlockData);
    renderBlock(newBlockData);
    autoSave();
}

export function renderBlock(blockData) {
    const blockInstance = getBlockInstance(blockData);
    blockInstance.render();
}



export function renderAll() {
    const dialogData = getDialogData();
    
    // Clear canvas
    const existingBlocks = document.querySelectorAll('.dialog-block');
    existingBlocks.forEach(el => el.remove());
    
    // Clear instances
    blockInstances.clear();
    
    // Render all blocks
    dialogData.blocks.forEach(blockData => renderBlock(blockData));
    updateConnections();
}

/**
 * Get block instance by ID (for external use)
 */
export function getBlockInstanceById(blockId) {
    return blockInstances.get(blockId);
}

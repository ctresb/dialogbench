/**
 * State Management Module
 * Manages all global application state
 */

export const state = {
    dialogData: {
        blocks: [],
        nextId: 1,
        canvasOffset: { x: 0, y: 0 },
        zoom: 1
    },
    
    dragging: {
        isDraggingCanvas: false,
        isDraggingBlock: false,
        currentDragBlock: null,
        dragStartPos: { x: 0, y: 0 },
        blockDragOffset: { x: 0, y: 0 }
    },
    
    editing: {
        currentEditingItem: null,
        selectedTarget: null
    }
};

export function getDialogData() {
    return state.dialogData;
}

export function setDialogData(data) {
    state.dialogData = data;
}

export function getBlock(blockId) {
    return state.dialogData.blocks.find(b => b.id === blockId);
}

export function addBlock(block) {
    state.dialogData.blocks.push(block);
}

export function removeBlock(blockId) {
    state.dialogData.blocks = state.dialogData.blocks.filter(b => b.id !== blockId);
}

export function getNextId() {
    return state.dialogData.nextId++;
}

export function getDraggingState() {
    return state.dragging;
}

export function getEditingState() {
    return state.editing;
}

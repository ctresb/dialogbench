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
    
    selection: {
        isSelecting: false,
        selectedBlocks: [],
        selectionStart: { x: 0, y: 0 },
        selectionEnd: { x: 0, y: 0 },
        isDraggingSelection: false,
        dragOffset: { x: 0, y: 0 },
        initialPositions: {}
    },
    
    snapping: {
        enabled: true,
        gridSize: 20
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
    
    // Notify blocks module to clean up instance
    import('./blocks.js').then(module => {
        module.removeBlockInstance(blockId);
    });
}

export function getNextId() {
    return state.dialogData.nextId++;
}

export function getDraggingState() {
    return state.dragging;
}

export function getSnappingState() {
    return state.snapping;
}

export function toggleSnapping() {
    state.snapping.enabled = !state.snapping.enabled;
    return state.snapping.enabled;
}

export function getSelectionState() {
    return state.selection;
}

export function clearSelection() {
    state.selection.selectedBlocks = [];
    state.selection.isSelecting = false;
    state.selection.isDraggingSelection = false;
}

export function getEditingState() {
    return state.editing;
}

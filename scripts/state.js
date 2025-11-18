/**
 * State Management Module
 * Manages all global application state
 */

export const state = {
    dialogData: {
        blocks: [],
        nextId: 1,
        canvasOffset: { x: 0, y: 0 },
        zoom: 1,
        globalVariables: []
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

// Global Variables Management
export function getGlobalVariables() {
    return state.dialogData.globalVariables || [];
}

export function addGlobalVariable(variable) {
    if (!state.dialogData.globalVariables) {
        state.dialogData.globalVariables = [];
    }
    // Check if variable with same name already exists
    const existingIndex = state.dialogData.globalVariables.findIndex(v => v.name === variable.name);
    if (existingIndex !== -1) {
        // Update existing variable
        state.dialogData.globalVariables[existingIndex] = variable;
    } else {
        // Add new variable
        state.dialogData.globalVariables.push(variable);
    }
}

export function getGlobalVariable(name) {
    if (!state.dialogData.globalVariables) {
        return null;
    }
    return state.dialogData.globalVariables.find(v => v.name === name);
}

export function updateGlobalVariable(name, updates) {
    if (!state.dialogData.globalVariables) {
        return;
    }
    const variable = state.dialogData.globalVariables.find(v => v.name === name);
    if (variable) {
        Object.assign(variable, updates);
    }
}

export function deleteGlobalVariable(name) {
    if (!state.dialogData.globalVariables) {
        return;
    }
    state.dialogData.globalVariables = state.dialogData.globalVariables.filter(v => v.name !== name);
}

export function variableNameExists(name) {
    if (!state.dialogData.globalVariables) {
        return false;
    }
    return state.dialogData.globalVariables.some(v => v.name === name);
}

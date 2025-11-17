/**
 * DOM Elements Module
 * Centralized access to DOM elements
 */

export const elements = {
    // Canvas
    canvas: null,
    connectionsSvg: null,
    
    // Toolbar buttons
    saveBtn: null,
    loadBtn: null,
    fileInput: null,
    newDialogBtn: null,
    zoomInBtn: null,
    zoomOutBtn: null,
    resetZoomBtn: null,
    snappingBtn: null,
    zoomLevel: null,
    
    // Modals
    responseModal: null,
    customModal: null,
    editResponseModal: null,
    editCustomModal: null,
    
    // Auto-save indicator
    autoSaveIndicator: null
};

export function initDOMElements() {
    elements.canvas = document.getElementById('canvas');
    elements.connectionsSvg = document.getElementById('connectionsSvg');
    
    elements.saveBtn = document.getElementById('saveBtn');
    elements.loadBtn = document.getElementById('loadBtn');
    elements.fileInput = document.getElementById('fileInput');
    elements.newDialogBtn = document.getElementById('newDialogBtn');
    elements.zoomInBtn = document.getElementById('zoomInBtn');
    elements.zoomOutBtn = document.getElementById('zoomOutBtn');
    elements.resetZoomBtn = document.getElementById('resetZoomBtn');
    elements.snappingBtn = document.getElementById('snappingBtn');
    elements.zoomLevel = document.getElementById('zoomLevel');
    
    elements.responseModal = document.getElementById('responseModal');
    elements.customModal = document.getElementById('customModal');
    elements.editResponseModal = document.getElementById('editResponseModal');
    elements.editCustomModal = document.getElementById('editCustomModal');
    
    elements.autoSaveIndicator = document.getElementById('autoSaveIndicator');
}

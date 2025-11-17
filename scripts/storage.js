/**
 * Storage Module
 * Handles saving/loading data to/from localStorage and JSON files
 */

import { getDialogData, setDialogData } from './state.js';
import { elements } from './dom.js';
import { renderAll } from './blocks.js';
import { applyZoom } from './canvas.js';
import { showToast } from './utils.js';

export function initStorage() {
    const { saveBtn, loadBtn, fileInput } = elements;
    
    saveBtn.addEventListener('click', saveToJSON);
    loadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', loadFromJSON);
}

export function autoSave() {
    const dialogData = getDialogData();
    // Create a copy without zoom and canvasOffset
    const dataToSave = {
        blocks: dialogData.blocks,
        nextId: dialogData.nextId
    };
    localStorage.setItem('dialogData', JSON.stringify(dataToSave));
    showToast('💾 Alterações salvas');
}

export function loadFromLocalStorage() {
    const saved = localStorage.getItem('dialogData');
    
    if (saved) {
        const data = JSON.parse(saved);
        
        // Always initialize zoom and canvasOffset to defaults
        data.zoom = 1;
        data.canvasOffset = { x: 0, y: 0 };
        
        setDialogData(data);
    }
}

function saveToJSON() {
    const dialogData = getDialogData();
    // Export only blocks and nextId, not zoom/pan state
    const dataToExport = {
        blocks: dialogData.blocks,
        nextId: dialogData.nextId
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dialogos.json';
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('✓ JSON exportado!');
}

function loadFromJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            // Initialize zoom and canvasOffset to defaults
            data.zoom = 1;
            data.canvasOffset = { x: 0, y: 0 };
            setDialogData(data);
            renderAll();
            applyZoom();
            autoSave();
            showToast('✓ JSON carregado!');
        } catch (error) {
            alert('Erro ao carregar arquivo JSON: ' + error.message);
        }
    };
    reader.readAsText(file);
}

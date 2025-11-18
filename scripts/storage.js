/**
 * Storage Module
 * Handles saving/loading data to/from localStorage and JSON files
 */

import { getDialogData, setDialogData } from './state.js';
import { elements } from './dom.js';
import { renderAll } from './blocks.js';
import { applyZoom } from './canvas.js';
import { toast } from './toast.js';
import { t, getCurrentLocale } from './i18n.js';

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
        nextId: dialogData.nextId,
        globalVariables: dialogData.globalVariables || []
    };
    localStorage.setItem('dialogData', JSON.stringify(dataToSave));
}

export async function loadFromLocalStorage() {
    const saved = localStorage.getItem('dialogData');
    
    if (saved) {
        const data = JSON.parse(saved);
        
        // Always initialize zoom and canvasOffset to defaults
        data.zoom = 1;
        data.canvasOffset = { x: 0, y: 0 };
        
        // Migrate old format to new format with global variables
        migrateToGlobalVariables(data);
        
        setDialogData(data);
    } else {
        // No save found, load intro
        await loadIntroJSON();
    }
}

export async function loadIntroJSON() {
    try {
        const locale = getCurrentLocale();
        
        // Map locale to intro file
        const localeMap = {
            'pt_br': './intro/intro_pt.json',
            'es_es': './intro/intro_es.json',
            'en_us': './intro/intro_en.json',
            'ja_jp': './intro/intro_jp.json',
            'zh_cn': './intro/intro_cn.json'
        };
        
        const introFile = localeMap[locale] || 'intro_en.json';
        const response = await fetch(`./${introFile}`);
        const data = await response.json();
        
        // Initialize zoom and canvasOffset to defaults
        data.zoom = 1;
        data.canvasOffset = { x: 0, y: 0 };
        
        // Migrate old format to new format with global variables
        migrateToGlobalVariables(data);
        
        setDialogData(data);
    } catch (error) {
        console.log('No intro file found, starting with empty board');
    }
}

export function clearBoard() {
    // Clear the board completely
    const emptyData = {
        blocks: [],
        nextId: 1,
        zoom: 1,
        canvasOffset: { x: 0, y: 0 },
        globalVariables: []
    };
    
    setDialogData(emptyData);
    localStorage.removeItem('dialogData');
}

/**
 * Migrate old format (customValues in blocks) to new format (global variables)
 * Variables are extracted from all blocks, duplicates removed (keeping last one)
 */
function migrateToGlobalVariables(data) {
    // Initialize globalVariables if it doesn't exist
    if (!data.globalVariables) {
        data.globalVariables = [];
    }
    
    // If globalVariables already exists and has content, skip migration
    if (data.globalVariables.length > 0) {
        return;
    }
    
    // Collect all variables from all blocks
    const variableMap = new Map(); // Use map to keep last occurrence of each variable name
    
    if (data.blocks) {
        data.blocks.forEach(block => {
            if (block.customValues && Array.isArray(block.customValues)) {
                block.customValues.forEach(variable => {
                    // Store/overwrite with last occurrence
                    variableMap.set(variable.name, {
                        name: variable.name,
                        color: variable.color
                    });
                });
            }
        });
    }
    
    // Convert map to array
    data.globalVariables = Array.from(variableMap.values());
}

function saveToJSON() {
    const dialogData = getDialogData();
    // Export only blocks, nextId, and globalVariables, not zoom/pan state
    const dataToExport = {
        globalVariables: dialogData.globalVariables || [],
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
    toast.success(t('toast_json_saved'));
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
            
            // Migrate old format to new format with global variables
            migrateToGlobalVariables(data);
            
            setDialogData(data);
            renderAll();
            applyZoom();
            autoSave();
            toast.success(t('toast_json_loaded'));
        } catch (error) {
            toast.error(t('toast_json_error') + error.message);
        }
    };
    reader.readAsText(file);
}

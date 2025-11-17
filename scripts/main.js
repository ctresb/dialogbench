/**
 * Main Module
 * Initializes and coordinates all application modules
 */

import { getDialogData, toggleSnapping } from './state.js';
import { initDOMElements, elements } from './dom.js';
import { initCanvas, adjustZoom, resetZoom, applyZoom } from './canvas.js';
import { initModals } from './modals.js';
import { initAutocomplete } from './autocomplete.js';
import { initStorage, loadFromLocalStorage } from './storage.js';
import { createNewDialog, renderAll } from './blocks.js';
import { initToast } from './toast.js';
import { initConfirmModal } from './modal.js';
import { loadLocales, applyTranslations, setLocale } from './i18n.js';

export async function initApp() {
    // Load locales first
    await loadLocales();
    
    // Initialize DOM element references
    initDOMElements();
    
    // Apply translations to HTML elements
    applyTranslations();
    
    // Initialize toast notifications
    initToast();
    
    // Initialize confirmation modals
    initConfirmModal();
    
    // Initialize canvas (grid, dragging, zoom)
    initCanvas();
    
    // Initialize storage and load saved data
    loadFromLocalStorage();
    initStorage();
    
    // Initialize modals
    initModals();
    
    // Initialize autocomplete
    initAutocomplete();
    
    // Setup toolbar event listeners
    setupToolbar();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Render all blocks or create initial block if empty
    const dialogData = getDialogData();
    if (dialogData.blocks.length === 0) {
        createNewDialog();
    } else {
        renderAll();
    }
    
    // Apply initial zoom and pan state
    applyZoom();
}

function setupToolbar() {
    const { newDialogBtn, zoomInBtn, zoomOutBtn, resetZoomBtn, snappingBtn } = elements;
    
    // New dialog button
    newDialogBtn.addEventListener('click', createNewDialog);
    
    // Zoom controls
    zoomInBtn.addEventListener('click', () => adjustZoom(0.1));
    zoomOutBtn.addEventListener('click', () => adjustZoom(-0.1));
    resetZoomBtn.addEventListener('click', resetZoom);
    
    // Snapping toggle
    snappingBtn.addEventListener('click', () => {
        const enabled = toggleSnapping();
        snappingBtn.classList.toggle('active', enabled);
    });
    
    // Language selector
    const languageBtn = document.getElementById('languageBtn');
    const languageDropdown = document.getElementById('languageDropdown');
    const languageOptions = document.querySelectorAll('.language-option');
    
    languageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        languageDropdown.classList.toggle('active');
    });
    
    languageOptions.forEach(option => {
        option.addEventListener('click', () => {
            const locale = option.getAttribute('data-locale');
            setLocale(locale);
            renderAll();
            languageDropdown.classList.remove('active');
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!languageBtn.contains(e.target) && !languageDropdown.contains(e.target)) {
            languageDropdown.classList.remove('active');
        }
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Shift + N: New dialog
        if (e.shiftKey && e.key === 'N') {
            e.preventDefault();
            createNewDialog();
        }
    });
}

/**
 * Main Module
 * Initializes and coordinates all application modules
 */

import { getDialogData, toggleSnapping } from './state.js';
import { initDOMElements, elements } from './dom.js';
import { initCanvas, adjustZoom, resetZoom, applyZoom } from './canvas.js';
import { initModals } from './modals.js';
import { initAutocomplete } from './autocomplete.js';
import { initStorage, loadFromLocalStorage, clearBoard, loadIntroJSON } from './storage.js';
import { createNewDialog, createNewEvent, renderAll } from './blocks.js';
import { initToast } from './toast.js';
import { initConfirmModal, showConfirmModal } from './modal.js';
import { loadLocales, applyTranslations, setLocale, t } from './i18n.js';

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
    await loadFromLocalStorage();
    initStorage();
    
    // Initialize modals
    initModals();
    
    // Initialize autocomplete
    initAutocomplete();
    
    // Setup toolbar event listeners
    setupToolbar();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Render all blocks (intro or saved data already loaded)
    const dialogData = getDialogData();
    if (dialogData.blocks.length > 0) {
        renderAll();
    }
    
    // Apply initial zoom and pan state
    applyZoom();
}

function setupToolbar() {
    const { newDialogBtn, zoomInBtn, zoomOutBtn, resetZoomBtn, snappingBtn } = elements;
    
    // New dialog button
    newDialogBtn.addEventListener('click', createNewDialog);
    
    // New event button
    const newEventBtn = document.getElementById('newEventBtn');
    newEventBtn.addEventListener('click', createNewEvent);
    
    // Clear board button
    const clearBtn = document.getElementById('clearBtn');
    clearBtn.addEventListener('click', async () => {
        const confirmed = await showConfirmModal({
            title: t('confirm_clear_board_title'),
            message: t('confirm_clear_board_message'),
            confirmText: t('confirm_clear_board_confirm'),
            cancelText: t('confirm_clear_board_cancel'),
            type: 'danger'
        });
        
        if (confirmed) {
            clearBoard();
            renderAll();
            applyZoom();
        }
    });
    
    // Zoom controls
    zoomInBtn.addEventListener('click', () => adjustZoom(0.1));
    zoomOutBtn.addEventListener('click', () => adjustZoom(-0.1));
    resetZoomBtn.addEventListener('click', resetZoom);
    
    // Snapping toggle
    snappingBtn.addEventListener('click', () => {
        const enabled = toggleSnapping();
        snappingBtn.classList.toggle('active', enabled);
    });
    
    // Tutorial button
    const helpBtn = document.getElementById('helpBtn');
    const tutorialModal = document.getElementById('tutorialModal');
    const closeTutorial = document.getElementById('closeTutorial');
    
    helpBtn.addEventListener('click', () => {
        tutorialModal.classList.add('active');
    });
    
    closeTutorial.addEventListener('click', () => {
        tutorialModal.classList.remove('active');
    });
    
    // Close tutorial when clicking outside
    tutorialModal.addEventListener('click', (e) => {
        if (e.target === tutorialModal) {
            tutorialModal.classList.remove('active');
        }
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
        option.addEventListener('click', async () => {
            const locale = option.getAttribute('data-locale');
            setLocale(locale);
            
            // Check if there's saved data in localStorage
            const saved = localStorage.getItem('dialogData');
            if (!saved) {
                // No saved data, reload intro in new language
                await loadIntroJSON();
            }
            
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
        // Shift + E: New event
        if (e.shiftKey && e.key === 'E') {
            e.preventDefault();
            createNewEvent();
        }
    });
}

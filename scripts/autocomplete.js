/**
 * Autocomplete Module
 * Handles target selection autocomplete functionality and variable name autocomplete
 */

import { getDialogData, getEditingState, getGlobalVariables } from './state.js';

export function initAutocomplete() {
    // Response target autocomplete
    const responseTargetInput = document.getElementById('responseTarget');
    responseTargetInput.addEventListener('input', (e) => updateAutocomplete(e.target, 'responseTargetList'));
    responseTargetInput.addEventListener('focus', (e) => updateAutocomplete(e.target, 'responseTargetList'));
    
    // Edit response target autocomplete
    const editResponseTargetInput = document.getElementById('editResponseTarget');
    editResponseTargetInput.addEventListener('input', (e) => updateAutocomplete(e.target, 'editResponseTargetList'));
    editResponseTargetInput.addEventListener('focus', (e) => updateAutocomplete(e.target, 'editResponseTargetList'));
    
    // Edit event target autocomplete
    const editEventTargetInput = document.getElementById('editEventTarget');
    editEventTargetInput.addEventListener('input', (e) => updateAutocomplete(e.target, 'editEventTargetList'));
    editEventTargetInput.addEventListener('focus', (e) => updateAutocomplete(e.target, 'editEventTargetList'));
    
    // Edit logic target true autocomplete
    const editLogicTargetTrueInput = document.getElementById('editLogicTargetTrue');
    editLogicTargetTrueInput.addEventListener('input', (e) => updateAutocomplete(e.target, 'editLogicTargetTrueList'));
    editLogicTargetTrueInput.addEventListener('focus', (e) => updateAutocomplete(e.target, 'editLogicTargetTrueList'));
    
    // Edit logic target false autocomplete
    const editLogicTargetFalseInput = document.getElementById('editLogicTargetFalse');
    editLogicTargetFalseInput.addEventListener('input', (e) => updateAutocomplete(e.target, 'editLogicTargetFalseList'));
    editLogicTargetFalseInput.addEventListener('focus', (e) => updateAutocomplete(e.target, 'editLogicTargetFalseList'));
    
    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete-wrapper')) {
            document.querySelectorAll('.autocomplete-list').forEach(list => {
                list.classList.remove('active');
            });
        }
    });
}

function updateAutocomplete(input, listId) {
    const list = document.getElementById(listId);
    const searchValue = input.value.toLowerCase();
    const dialogData = getDialogData();
    const { selectedTarget } = getEditingState();
    
    list.innerHTML = '';
    
    const filteredBlocks = dialogData.blocks.filter(block => {
        const blockId = `#${String(block.id).padStart(4, '0')}`;
        return blockId.includes(searchValue) || searchValue === '';
    });
    
    if (filteredBlocks.length > 0) {
        filteredBlocks.forEach(block => {
            const blockId = `#${String(block.id).padStart(4, '0')}`;
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            
            if (selectedTarget === blockId) {
                item.classList.add('selected');
            }
            
            // Get preview based on block type
            let preview;
            let typeIndicator = '';
            if (block.type === 'event') {
                preview = block.title ? block.title.substring(0, 50) : 'Evento sem título';
                typeIndicator = '<span style="color: #9b59b6; font-weight: bold;">[EVENTO]</span> ';
            } else {
                preview = block.lines && block.lines[0] ? block.lines[0].substring(0, 50) : 'Sem texto';
            }
            
            item.innerHTML = `
                <div class="autocomplete-item-id">${blockId}</div>
                <div class="autocomplete-item-preview">${typeIndicator}${preview}...</div>
            `;
            
            item.addEventListener('click', () => {
                input.value = blockId;
                getEditingState().selectedTarget = blockId;
                list.classList.remove('active');
                
                // Update visual selection
                document.querySelectorAll(`#${listId} .autocomplete-item`).forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
            });
            
            list.appendChild(item);
        });
        
        list.classList.add('active');
    } else {
        list.classList.remove('active');
    }
}

/**
 * Update variable name autocomplete
 * Shows existing global variables and "create" option
 */
export function updateVariableAutocomplete(input, listId, onSelect) {
    const list = document.getElementById(listId);
    const searchValue = input.value.toLowerCase().trim();
    const globalVariables = getGlobalVariables();
    
    list.innerHTML = '';
    
    // Filter existing variables that match the search
    const filteredVariables = globalVariables.filter(variable => {
        return variable.name.toLowerCase().includes(searchValue);
    });
    
    // Show filtered variables
    if (filteredVariables.length > 0 || searchValue) {
        filteredVariables.forEach(variable => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '8px';
            
            const colorDot = document.createElement('div');
            colorDot.style.width = '12px';
            colorDot.style.height = '12px';
            colorDot.style.borderRadius = '50%';
            colorDot.style.backgroundColor = variable.color;
            colorDot.style.flexShrink = '0';
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = variable.name;
            
            item.appendChild(colorDot);
            item.appendChild(nameSpan);
            
            item.addEventListener('click', () => {
                input.value = variable.name;
                list.classList.remove('active');
                if (onSelect) {
                    onSelect(variable);
                }
            });
            
            list.appendChild(item);
        });
        
        // Add "Create new" option if search value is not empty and doesn't exactly match an existing variable
        if (searchValue && !globalVariables.some(v => v.name.toLowerCase() === searchValue)) {
            const createItem = document.createElement('div');
            createItem.className = 'autocomplete-item autocomplete-create-item';
            createItem.innerHTML = `
                <span class="material-symbols-rounded" style="font-size: 18px;">add</span>
                <span>Create "${searchValue}"</span>
            `;
            createItem.style.display = 'flex';
            createItem.style.alignItems = 'center';
            createItem.style.gap = '8px';
            createItem.style.color = '#1cba9b';
            createItem.style.fontWeight = 'bold';
            
            createItem.addEventListener('click', () => {
                input.value = searchValue;
                list.classList.remove('active');
                if (onSelect) {
                    onSelect({ name: searchValue, isNew: true });
                }
            });
            
            list.appendChild(createItem);
        }
        
        list.classList.add('active');
    } else {
        list.classList.remove('active');
    }
}

/**
 * Initialize variable name autocomplete for an input
 */
export function initVariableAutocomplete(inputId, listId, onSelect) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    input.addEventListener('input', () => updateVariableAutocomplete(input, listId, onSelect));
    input.addEventListener('focus', () => updateVariableAutocomplete(input, listId, onSelect));
}

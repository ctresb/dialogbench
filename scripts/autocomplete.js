/**
 * Autocomplete Module
 * Handles target selection autocomplete functionality
 */

import { getDialogData, getEditingState } from './state.js';

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

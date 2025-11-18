/**
 * Modals Module
 * Handles all modal operations and interactions
 */

import { getBlock, getEditingState } from './state.js';
import { elements } from './dom.js';
import { renderBlock } from './blocks.js';
import { updateConnections } from './connections.js';
import { autoSave } from './storage.js';
import { getRandomColor } from './utils.js';
import { t } from './i18n.js';

export function initModals() {
    const { responseModal, customModal, editResponseModal, editCustomModal } = elements;
    
    // Response modal
    document.getElementById('confirmResponse').addEventListener('click', confirmAddResponse);
    document.getElementById('cancelResponse').addEventListener('click', () => closeModal(responseModal));
    
    // Custom modal
    document.getElementById('confirmCustom').addEventListener('click', confirmAddCustom);
    document.getElementById('cancelCustom').addEventListener('click', () => closeModal(customModal));
    
    // Edit Response modal
    document.getElementById('confirmEditResponse').addEventListener('click', confirmEditResponse);
    document.getElementById('deleteResponse').addEventListener('click', deleteResponse);
    document.getElementById('cancelEditResponse').addEventListener('click', () => closeModal(editResponseModal));
    
    // Edit Custom modal
    document.getElementById('confirmEditCustom').addEventListener('click', confirmEditCustom);
    document.getElementById('deleteCustom').addEventListener('click', deleteCustomValue);
    document.getElementById('cancelEditCustom').addEventListener('click', () => closeModal(editCustomModal));
    
    // Edit Event modal
    const editEventModal = document.getElementById('editEventModal');
    document.getElementById('confirmEditEvent').addEventListener('click', confirmEditEvent);
    document.getElementById('cancelEditEvent').addEventListener('click', () => closeModal(editEventModal));
    
    // Variable type radio buttons for add modal
    const variableTypeRadios = document.querySelectorAll('input[name="variableType"]');
    variableTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleVariableInputs);
    });
    
    // Variable type radio buttons for edit modal
    const editVariableTypeRadios = document.querySelectorAll('input[name="editVariableType"]');
    editVariableTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleEditVariableInputs);
    });
}

function toggleVariableInputs() {
    const selectedType = document.querySelector('input[name="variableType"]:checked').value;
    const chaveInputs = document.getElementById('chaveInputs');
    const textoInputs = document.getElementById('textoInputs');
    
    if (selectedType === 'chave') {
        chaveInputs.style.display = 'block';
        textoInputs.style.display = 'none';
    } else {
        chaveInputs.style.display = 'none';
        textoInputs.style.display = 'block';
    }
}

function toggleEditVariableInputs() {
    const selectedType = document.querySelector('input[name="editVariableType"]:checked').value;
    const chaveInputs = document.getElementById('editChaveInputs');
    const textoInputs = document.getElementById('editTextoInputs');
    
    if (selectedType === 'chave') {
        chaveInputs.style.display = 'block';
        textoInputs.style.display = 'none';
    } else {
        chaveInputs.style.display = 'none';
        textoInputs.style.display = 'block';
    }
}

export function openAddResponseModal(blockId) {
    const { responseModal } = elements;
    const editing = getEditingState();
    
    editing.currentEditingItem = { blockId, type: 'response', action: 'add' };
    editing.selectedTarget = null;
    
    document.getElementById('responseText').value = '';
    document.getElementById('responseColor').value = getRandomColor();
    document.getElementById('responseTarget').value = '';
    
    const list = document.getElementById('responseTargetList');
    if (list) {
        list.classList.remove('active');
    }
    
    openModal(responseModal);
}

export function openAddCustomModal(blockId) {
    const { customModal } = elements;
    const editing = getEditingState();
    
    editing.currentEditingItem = { blockId, type: 'custom', action: 'add' };
    
    // Reset to default values
    document.querySelector('input[name="variableType"][value="chave"]').checked = true;
    document.getElementById('customVariableName').value = '';
    document.getElementById('customChaveValue').value = 'true';
    document.getElementById('customTextoValue').value = '';
    document.getElementById('customColor').value = getRandomColor();
    
    // Show appropriate inputs
    document.getElementById('chaveInputs').style.display = 'block';
    document.getElementById('textoInputs').style.display = 'none';
    
    openModal(customModal);
}

export function editResponse(blockId, responseIndex) {
    const { editResponseModal } = elements;
    const block = getBlock(blockId);
    
    if (block) {
        const response = block.responses[responseIndex];
        const editing = getEditingState();
        
        editing.currentEditingItem = { blockId, type: 'response', action: 'edit', index: responseIndex };
        editing.selectedTarget = response.target || null;
        
        document.getElementById('editResponseText').value = response.text;
        document.getElementById('editResponseColor').value = response.color;
        document.getElementById('editResponseTarget').value = response.target || '';
        
        const list = document.getElementById('editResponseTargetList');
        if (list) {
            list.classList.remove('active');
        }
        
        openModal(editResponseModal);
    }
}

export function editCustom(blockId, customIndex) {
    const { editCustomModal } = elements;
    const block = getBlock(blockId);
    
    if (block) {
        const variable = block.customValues[customIndex];
        const editing = getEditingState();
        
        editing.currentEditingItem = { blockId, type: 'custom', action: 'edit', index: customIndex };
        
        // Set variable type
        document.querySelector(`input[name="editVariableType"][value="${variable.type}"]`).checked = true;
        
        // Set variable name and color
        document.getElementById('editCustomVariableName').value = variable.name;
        document.getElementById('editCustomColor').value = variable.color;
        
        // Set value based on type
        if (variable.type === 'chave') {
            document.getElementById('editCustomChaveValue').value = variable.value;
            document.getElementById('editChaveInputs').style.display = 'block';
            document.getElementById('editTextoInputs').style.display = 'none';
        } else {
            document.getElementById('editCustomTextoValue').value = variable.value;
            document.getElementById('editChaveInputs').style.display = 'none';
            document.getElementById('editTextoInputs').style.display = 'block';
        }
        
        openModal(editCustomModal);
    }
}

function confirmAddResponse() {
    const { responseModal } = elements;
    const editing = getEditingState();
    
    const text = document.getElementById('responseText').value;
    const color = document.getElementById('responseColor').value;
    const target = document.getElementById('responseTarget').value;
    
    if (!text) {
        alert(t('alert_response_text_required'));
        return;
    }
    
    const block = getBlock(editing.currentEditingItem.blockId);
    if (block) {
        block.responses.push({ text, color, target });
        renderBlock(block);
        updateConnections();
        autoSave();
    }
    
    closeModal(responseModal);
}

function confirmAddCustom() {
    const { customModal } = elements;
    const editing = getEditingState();
    
    const type = document.querySelector('input[name="variableType"]:checked').value;
    const name = document.getElementById('customVariableName').value;
    const color = document.getElementById('customColor').value;
    
    if (!name) {
        alert(t('alert_variable_name_required'));
        return;
    }
    
    let value;
    if (type === 'chave') {
        value = document.getElementById('customChaveValue').value;
    } else {
        value = document.getElementById('customTextoValue').value;
        if (!value) {
            alert(t('alert_variable_value_required'));
            return;
        }
    }
    
    const block = getBlock(editing.currentEditingItem.blockId);
    if (block) {
        block.customValues.push({ type, name, value, color });
        renderBlock(block);
        autoSave();
    }
    
    closeModal(customModal);
}

function confirmEditResponse() {
    const { editResponseModal } = elements;
    const editing = getEditingState();
    
    const text = document.getElementById('editResponseText').value;
    const color = document.getElementById('editResponseColor').value;
    const target = document.getElementById('editResponseTarget').value;
    
    if (!text) {
        alert(t('alert_response_text_required'));
        return;
    }
    
    const block = getBlock(editing.currentEditingItem.blockId);
    if (block) {
        block.responses[editing.currentEditingItem.index] = { text, color, target };
        renderBlock(block);
        updateConnections();
        autoSave();
    }
    
    closeModal(editResponseModal);
}

function confirmEditCustom() {
    const { editCustomModal } = elements;
    const editing = getEditingState();
    
    const type = document.querySelector('input[name="editVariableType"]:checked').value;
    const name = document.getElementById('editCustomVariableName').value;
    const color = document.getElementById('editCustomColor').value;
    
    if (!name) {
        alert(t('alert_variable_name_required'));
        return;
    }
    
    let value;
    if (type === 'chave') {
        value = document.getElementById('editCustomChaveValue').value;
    } else {
        value = document.getElementById('editCustomTextoValue').value;
        if (!value) {
            alert(t('alert_variable_value_required'));
            return;
        }
    }
    
    const block = getBlock(editing.currentEditingItem.blockId);
    if (block) {
        block.customValues[editing.currentEditingItem.index] = { type, name, value, color };
        renderBlock(block);
        autoSave();
    }
    
    closeModal(editCustomModal);
}

function deleteResponse() {
    const { editResponseModal } = elements;
    const editing = getEditingState();
    
    if (confirm(t('confirm_delete_response'))) {
        const block = getBlock(editing.currentEditingItem.blockId);
        if (block) {
            block.responses.splice(editing.currentEditingItem.index, 1);
            renderBlock(block);
            updateConnections();
            autoSave();
        }
        closeModal(editResponseModal);
    }
}

function deleteCustomValue() {
    const { editCustomModal } = elements;
    const editing = getEditingState();
    
    if (confirm(t('confirm_delete_custom'))) {
        const block = getBlock(editing.currentEditingItem.blockId);
        if (block) {
            block.customValues.splice(editing.currentEditingItem.index, 1);
            renderBlock(block);
            autoSave();
        }
        closeModal(editCustomModal);
    }
}

function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

// Event editing functions
export function openEditEventModal(blockId) {
    const editEventModal = document.getElementById('editEventModal');
    const editing = getEditingState();
    
    editing.currentEditingItem = { blockId, type: 'event' };
    editing.selectedTarget = null;
    
    const block = getBlock(blockId);
    if (block) {
        document.getElementById('editEventTitle').value = block.title;
        document.getElementById('editEventColor').value = block.backgroundColor;
        document.getElementById('editEventTarget').value = block.target || '';
        
        if (block.target) {
            editing.selectedTarget = block.target;
        }
        
        const list = document.getElementById('editEventTargetList');
        if (list) {
            list.classList.remove('active');
        }
    }
    
    openModal(editEventModal);
}

function confirmEditEvent() {
    const editEventModal = document.getElementById('editEventModal');
    const editing = getEditingState();
    
    const title = document.getElementById('editEventTitle').value.trim();
    const color = document.getElementById('editEventColor').value;
    const target = editing.selectedTarget || document.getElementById('editEventTarget').value.trim();
    
    if (!title) {
        alert(t('alert_event_title_required'));
        return;
    }
    
    const block = getBlock(editing.currentEditingItem.blockId);
    if (block) {
        block.title = title;
        block.backgroundColor = color;
        block.target = target || null;
        autoSave();
        // Force re-render to update the UI immediately
        renderBlock(block);
        updateConnections();
    }
    
    closeModal(editEventModal);
}

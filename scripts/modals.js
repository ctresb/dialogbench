/**
 * Modals Module
 * Handles all modal operations and interactions
 */

import { getBlock, getEditingState, addGlobalVariable, getGlobalVariable, variableNameExists, deleteGlobalVariable, getDialogData } from './state.js';
import { elements } from './dom.js';
import { renderBlock, renderAll } from './blocks.js';
import { updateConnections } from './connections.js';
import { autoSave } from './storage.js';
import { getRandomColor } from './utils.js';
import { t } from './i18n.js';
import { initVariableAutocomplete } from './autocomplete.js';
import { showToast } from './toast.js';
import { showConfirmModal } from './modal.js';

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
    
    // Edit Logic modal
    const editLogicModal = document.getElementById('editLogicModal');
    document.getElementById('confirmEditLogic').addEventListener('click', confirmEditLogic);
    document.getElementById('cancelEditLogic').addEventListener('click', () => closeModal(editLogicModal));
    
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
    
    // Initialize variable name autocomplete for add modal
    initVariableAutocomplete('customVariableName', 'customVariableNameList', (variable) => {
        if (variable.isNew) {
            // New variable - keep the name, user will set color and value
            document.getElementById('customVariableName').value = variable.name;
        } else {
            // Existing variable - fill in the color
            document.getElementById('customVariableName').value = variable.name;
            document.getElementById('customColor').value = variable.color;
        }
    });
    
    // Initialize variable name autocomplete for edit modal
    initVariableAutocomplete('editCustomVariableName', 'editCustomVariableNameList', (variable) => {
        if (variable.isNew) {
            // New variable - keep the name, user will set color and value
            document.getElementById('editCustomVariableName').value = variable.name;
        } else {
            // Existing variable - fill in the color
            document.getElementById('editCustomVariableName').value = variable.name;
            document.getElementById('editCustomColor').value = variable.color;
        }
    });
    
    // Initialize variable name autocomplete for logic modal
    initVariableAutocomplete('editLogicVariable', 'editLogicVariableList', (variable) => {
        if (!variable.isNew) {
            // Existing variable - just set the name
            document.getElementById('editLogicVariable').value = variable.name;
        }
    });
    
    // Prevent wheel events from propagating to canvas on all modals
    const allModals = [responseModal, customModal, editResponseModal, editCustomModal, editEventModal, editLogicModal];
    allModals.forEach(modal => {
        if (modal) {
            modal.addEventListener('wheel', (e) => {
                e.stopPropagation();
            });
        }
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
    
    // Close the autocomplete list
    const list = document.getElementById('customVariableNameList');
    if (list) {
        list.classList.remove('active');
    }
    
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
        
        // Set variable name
        document.getElementById('editCustomVariableName').value = variable.name;
        
        // Try to get color from global variables, fallback to local color
        const globalVar = getGlobalVariable(variable.name);
        const colorToUse = globalVar ? globalVar.color : variable.color;
        document.getElementById('editCustomColor').value = colorToUse;
        
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
        showToast(t('alert_response_text_required'), 'warning');
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
    const name = document.getElementById('customVariableName').value.trim();
    const color = document.getElementById('customColor').value;
    
    if (!name) {
        showToast(t('alert_variable_name_required'), 'warning');
        return;
    }
    
    let value;
    if (type === 'chave') {
        value = document.getElementById('customChaveValue').value;
    } else {
        value = document.getElementById('customTextoValue').value;
        if (!value) {
            showToast(t('alert_variable_value_required'), 'warning');
            return;
        }
    }
    
    // Check if variable name already exists in other blocks
    const dialogData = getDialogData();
    const variableExistsElsewhere = dialogData.blocks.some(b => 
        b.customValues && 
        b.customValues.some(v => v.name === name)
    );
    
    // Add or update global variable (will update if name exists)
    addGlobalVariable({ name, color });
    
    const block = getBlock(editing.currentEditingItem.blockId);
    if (block) {
        block.customValues.push({ type, name, value, color });
        
        // If variable exists elsewhere, re-render all to update colors
        if (variableExistsElsewhere) {
            renderAll();
        } else {
            renderBlock(block);
        }
        
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
        showToast(t('alert_response_text_required'), 'warning');
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
    const name = document.getElementById('editCustomVariableName').value.trim();
    const color = document.getElementById('editCustomColor').value;
    
    if (!name) {
        showToast(t('alert_variable_name_required'), 'warning');
        return;
    }
    
    let value;
    if (type === 'chave') {
        value = document.getElementById('editCustomChaveValue').value;
    } else {
        value = document.getElementById('editCustomTextoValue').value;
        if (!value) {
            showToast(t('alert_variable_value_required'), 'warning');
            return;
        }
    }
    
    const block = getBlock(editing.currentEditingItem.blockId);
    if (block) {
        const oldVariable = block.customValues[editing.currentEditingItem.index];
        
        // Add or update global variable (will update if name exists)
        addGlobalVariable({ name, color });
        
        block.customValues[editing.currentEditingItem.index] = { type, name, value, color };
        
        // If the variable name exists in other blocks, re-render all blocks to update colors
        const dialogData = getDialogData();
        const hasMultipleOccurrences = dialogData.blocks.some(b => 
            b.id !== block.id && 
            b.customValues && 
            b.customValues.some(v => v.name === name)
        );
        
        if (hasMultipleOccurrences) {
            renderAll(); // Re-render all blocks to propagate color change
        } else {
            renderBlock(block); // Just re-render current block
        }
        
        autoSave();
    }
    
    closeModal(editCustomModal);
}

async function deleteResponse() {
    const { editResponseModal } = elements;
    const editing = getEditingState();
    
    const result = await showConfirmModal({
        title: t('edit_response'),
        message: t('confirm_delete_response'),
        confirmText: t('delete'),
        type: 'danger'
    });
    
    if (result.confirmed) {
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

async function deleteCustomValue() {
    const { editCustomModal } = elements;
    const editing = getEditingState();
    
    const block = getBlock(editing.currentEditingItem.blockId);
    if (!block) return;
    
    const variable = block.customValues[editing.currentEditingItem.index];
    if (!variable) return;
    
    const result = await showConfirmModal({
        title: t('edit_variable'),
        message: t('confirm_delete_custom'),
        confirmText: t('delete'),
        type: 'danger',
        checkbox: {
            label: t('delete_variable_globally'),
            defaultChecked: false
        }
    });
    
    if (result.confirmed) {
        // If checkbox is checked, delete globally from all blocks
        if (result.checkboxValue) {
            deleteVariableGlobally(variable.name);
        } else {
            // Only delete from current block
            block.customValues.splice(editing.currentEditingItem.index, 1);
            renderBlock(block);
        }
        autoSave();
        closeModal(editCustomModal);
    }
}

/**
 * Delete a variable globally from all blocks
 */
function deleteVariableGlobally(variableName) {
    const dialogData = getDialogData();
    
    // Remove from global variables
    deleteGlobalVariable(variableName);
    
    // Remove from all blocks
    dialogData.blocks.forEach(block => {
        if (block.customValues && Array.isArray(block.customValues)) {
            block.customValues = block.customValues.filter(v => v.name !== variableName);
        }
    });
    
    // Re-render all blocks to update UI
    renderAll();
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
        showToast(t('alert_event_title_required'), 'warning');
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

// Logic editing functions
export function openEditLogicModal(blockId) {
    const editLogicModal = document.getElementById('editLogicModal');
    const editing = getEditingState();
    
    editing.currentEditingItem = { blockId, type: 'logic' };
    editing.selectedTarget = null;
    
    const block = getBlock(blockId);
    if (block) {
        document.getElementById('editLogicVariable').value = block.variable || '';
        document.getElementById('editLogicOperator').value = block.operator || 'equals';
        document.getElementById('editLogicValue').value = block.compareValue || '';
        document.getElementById('editLogicColor').value = block.backgroundColor || '#e67e22';
        document.getElementById('editLogicTargetTrue').value = block.targetTrue || '';
        document.getElementById('editLogicTargetFalse').value = block.targetFalse || '';
        
        // Clear autocomplete lists
        const listTrue = document.getElementById('editLogicTargetTrueList');
        const listFalse = document.getElementById('editLogicTargetFalseList');
        const listVariable = document.getElementById('editLogicVariableList');
        
        if (listTrue) listTrue.classList.remove('active');
        if (listFalse) listFalse.classList.remove('active');
        if (listVariable) listVariable.classList.remove('active');
    }
    
    openModal(editLogicModal);
}

function confirmEditLogic() {
    const editLogicModal = document.getElementById('editLogicModal');
    const editing = getEditingState();
    
    const variable = document.getElementById('editLogicVariable').value.trim();
    const operator = document.getElementById('editLogicOperator').value;
    const compareValue = document.getElementById('editLogicValue').value.trim();
    const color = document.getElementById('editLogicColor').value;
    const targetTrue = document.getElementById('editLogicTargetTrue').value.trim();
    const targetFalse = document.getElementById('editLogicTargetFalse').value.trim();
    
    if (!variable) {
        showToast(t('alert_logic_variable_required'), 'warning');
        return;
    }
    
    if (!compareValue) {
        showToast(t('alert_logic_value_required'), 'warning');
        return;
    }
    
    const block = getBlock(editing.currentEditingItem.blockId);
    if (block) {
        block.variable = variable;
        block.operator = operator;
        block.compareValue = compareValue;
        block.backgroundColor = color;
        block.targetTrue = targetTrue || null;
        block.targetFalse = targetFalse || null;
        autoSave();
        // Force re-render to update the UI immediately
        renderBlock(block);
        updateConnections();
    }
    
    closeModal(editLogicModal);
}

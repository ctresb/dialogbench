/**
 * Blocks Module
 * Handles block creation, rendering, and manipulation
 */

import { getBlock, addBlock, removeBlock, getNextId, getDialogData } from './state.js';
import { elements } from './dom.js';
import { updateConnections } from './connections.js';
import { autoSave } from './storage.js';
import { copyToClipboard } from './utils.js';
import { startBlockDrag } from './canvas.js';
import { openAddResponseModal, openAddCustomModal, editResponse, editCustom } from './modals.js';

export function createNewDialog() {
    const dialogData = getDialogData();
    
    // Find rightmost block
    let maxX = 0;
    if (dialogData.blocks.length > 0) {
        maxX = Math.max(...dialogData.blocks.map(b => b.x));
        maxX += 390; // 320px block width + 50px margin
    } else {
        maxX = 100;
    }
    
    const newBlock = {
        id: getNextId(),
        x: maxX,
        y: 100,
        lines: ['Texto do diálogo, linha 1.', 'Texto do diálogo, linha 2.'],
        responses: [],
        customValues: []
    };
    
    addBlock(newBlock);
    renderBlock(newBlock);
    autoSave();
}

export function renderBlock(block) {
    const { canvas } = elements;
    let blockElement = document.getElementById(`block-${block.id}`);
    
    if (!blockElement) {
        blockElement = document.createElement('div');
        blockElement.id = `block-${block.id}`;
        blockElement.className = 'dialog-block';
        canvas.appendChild(blockElement);
    }
    
    blockElement.style.left = `${block.x}px`;
    blockElement.style.top = `${block.y}px`;
    
    blockElement.innerHTML = `
        <div class="dialog-header">
            <div class="dialog-id">#${String(block.id).padStart(4, '0')}</div>
            <button class="delete-block-btn" data-block-id="${block.id}">
                <span class="material-icons">delete</span> Deletar
            </button>
        </div>
        
        <div class="dialog-lines">
            ${block.lines.map((line, index) => `
                <div class="dialog-line-wrapper">
                    <textarea class="dialog-line" 
                        data-block-id="${block.id}"
                        data-line-index="${index}"
                        rows="1">${line}</textarea>
                    <button class="copy-line-btn" data-block-id="${block.id}" data-line-index="${index}" title="Copiar texto">
                        <span class="material-icons">content_copy</span>
                    </button>
                </div>
            `).join('')}
        </div>
        
        <div class="add-line-btn" data-block-id="${block.id}">+</div>
        
        <div class="divider"></div>
        
        <div class="responses-section">
            ${block.responses.map((response, index) => `
                <div class="response-item">
                    <button class="response-btn" style="background: ${response.color}">
                        ${response.text}
                    </button>
                    <div class="item-actions">
                        <button class="edit-btn" data-block-id="${block.id}" data-response-index="${index}">
                            <span class="material-icons">edit</span>
                        </button>
                        <button class="copy-btn" data-block-id="${block.id}" data-response-index="${index}">
                            <span class="material-icons">content_copy</span>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="add-response-btn" data-block-id="${block.id}">+</div>
        
        <div class="divider"></div>
        
        <div class="custom-section">
            ${block.customValues.map((variable, index) => `
                <div class="custom-item">
                    <button class="custom-btn" style="background: ${variable.color}">
                        <span class="variable-name">${variable.name}</span>
                        <span class="variable-separator">=</span>
                        <span class="variable-value">${variable.value}</span>
                    </button>
                    <div class="item-actions">
                        <button class="edit-btn" data-block-id="${block.id}" data-custom-index="${index}">
                            <span class="material-icons">edit</span>
                        </button>
                        <button class="copy-btn" data-block-id="${block.id}" data-custom-index="${index}">
                            <span class="material-icons">content_copy</span>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="add-custom-btn" data-block-id="${block.id}">+</div>
    `;
    
    // Attach event listeners
    setupBlockEventListeners(blockElement, block);
}

function setupBlockEventListeners(blockElement, block) {
    // Block dragging
    blockElement.onmousedown = (e) => {
        if (e.target === blockElement || e.target.classList.contains('dialog-header') || e.target.classList.contains('dialog-id')) {
            startBlockDrag(e, block.id);
        }
    };
    
    // Delete block button
    const deleteBtn = blockElement.querySelector('.delete-block-btn');
    deleteBtn.addEventListener('click', () => deleteBlock(block.id));
    
    // Dialog lines
    const lineInputs = blockElement.querySelectorAll('.dialog-line');
    lineInputs.forEach((textarea, index) => {
        // Auto-resize textarea
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
        
        // Trigger resize on load
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
        
        // Update line value
        textarea.addEventListener('change', function() {
            updateLine(block.id, index, this.value);
        });
        
        // Keyboard shortcuts
        textarea.addEventListener('keydown', (e) => {
            // Shift + Enter: save and create new line
            if (e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                block.lines[index] = textarea.value;
                addLineAndFocus(block.id, index + 1);
            }
            // Backspace on empty line: delete line and focus previous
            else if (e.key === 'Backspace' && textarea.value === '' && block.lines.length > 1) {
                e.preventDefault();
                deleteLineAndFocusPrevious(block.id, index);
            }
        });
    });
    
    // Copy line buttons
    const copyLineBtns = blockElement.querySelectorAll('.copy-line-btn');
    copyLineBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const blockId = parseInt(btn.dataset.blockId);
            const lineIndex = parseInt(btn.dataset.lineIndex);
            copyLine(blockId, lineIndex);
        });
    });
    
    // Add line button
    const addLineBtn = blockElement.querySelector('.add-line-btn');
    addLineBtn.addEventListener('click', () => {
        addLine(block.id);
    });
    
    // Response edit buttons
    const responseEditBtns = blockElement.querySelectorAll('.responses-section .edit-btn');
    responseEditBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const blockId = parseInt(btn.dataset.blockId);
            const responseIndex = parseInt(btn.dataset.responseIndex);
            editResponse(blockId, responseIndex);
        });
    });
    
    // Response copy buttons
    const responseCopyBtns = blockElement.querySelectorAll('.responses-section .copy-btn');
    responseCopyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const blockId = parseInt(btn.dataset.blockId);
            const responseIndex = parseInt(btn.dataset.responseIndex);
            copyResponse(blockId, responseIndex);
        });
    });
    
    // Add response button
    const addResponseBtn = blockElement.querySelector('.add-response-btn');
    addResponseBtn.addEventListener('click', () => {
        openAddResponseModal(block.id);
    });
    
    // Custom edit buttons
    const customEditBtns = blockElement.querySelectorAll('.custom-section .edit-btn');
    customEditBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const blockId = parseInt(btn.dataset.blockId);
            const customIndex = parseInt(btn.dataset.customIndex);
            editCustom(blockId, customIndex);
        });
    });
    
    // Custom copy buttons
    const customCopyBtns = blockElement.querySelectorAll('.custom-section .copy-btn');
    customCopyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const blockId = parseInt(btn.dataset.blockId);
            const customIndex = parseInt(btn.dataset.customIndex);
            copyCustom(blockId, customIndex);
        });
    });
    
    // Add custom button
    const addCustomBtn = blockElement.querySelector('.add-custom-btn');
    addCustomBtn.addEventListener('click', () => {
        openAddCustomModal(block.id);
    });
}

export function addLine(blockId) {
    const block = getBlock(blockId);
    if (block) {
        block.lines.push('Nova linha de diálogo.');
        renderBlock(block);
        autoSave();
    }
}

function addLineAndFocus(blockId, atIndex) {
    const block = getBlock(blockId);
    if (block) {
        block.lines.splice(atIndex, 0, '');
        renderBlock(block);
        autoSave();
        
        // Focus on new line
        setTimeout(() => {
            const blockElement = document.getElementById(`block-${blockId}`);
            const inputs = blockElement.querySelectorAll('.dialog-line');
            if (inputs[atIndex]) {
                inputs[atIndex].focus();
            }
        }, 10);
    }
}

function deleteLineAndFocusPrevious(blockId, lineIndex) {
    const block = getBlock(blockId);
    if (block && block.lines.length > 1) {
        block.lines.splice(lineIndex, 1);
        renderBlock(block);
        autoSave();
        
        // Focus on previous line
        setTimeout(() => {
            const blockElement = document.getElementById(`block-${blockId}`);
            const inputs = blockElement.querySelectorAll('.dialog-line');
            const previousIndex = Math.max(0, lineIndex - 1);
            if (inputs[previousIndex]) {
                inputs[previousIndex].focus();
                // Move cursor to end
                inputs[previousIndex].setSelectionRange(inputs[previousIndex].value.length, inputs[previousIndex].value.length);
            }
        }, 10);
    }
}

function updateLine(blockId, lineIndex, value) {
    const block = getBlock(blockId);
    if (block) {
        block.lines[lineIndex] = value;
        autoSave();
    }
}

function deleteBlock(blockId) {
    if (confirm('Tem certeza que deseja deletar este bloco?')) {
        removeBlock(blockId);
        const blockElement = document.getElementById(`block-${blockId}`);
        if (blockElement) {
            blockElement.remove();
        }
        updateConnections();
        autoSave();
    }
}

function copyLine(blockId, lineIndex) {
    const block = getBlock(blockId);
    if (block && block.lines[lineIndex]) {
        copyToClipboard(block.lines[lineIndex]);
    }
}

function copyResponse(blockId, responseIndex) {
    const block = getBlock(blockId);
    if (block) {
        const response = block.responses[responseIndex];
        copyToClipboard(response.text);
    }
}

function copyCustom(blockId, customIndex) {
    const block = getBlock(blockId);
    if (block) {
        const variable = block.customValues[customIndex];
        const variableText = `${variable.name} = ${variable.value}`;
        copyToClipboard(variableText);
    }
}

export function renderAll() {
    const { canvas } = elements;
    const dialogData = getDialogData();
    
    canvas.innerHTML = '';
    dialogData.blocks.forEach(block => renderBlock(block));
    updateConnections();
}

// Estado global da aplicação
let dialogData = {
    blocks: [],
    nextId: 1,
    canvasOffset: { x: 0, y: 0 },
    zoom: 1
};

let isDraggingCanvas = false;
let isDraggingBlock = false;
let currentDragBlock = null;
let dragStartPos = { x: 0, y: 0 };
let blockDragOffset = { x: 0, y: 0 };
let currentEditingItem = null;
let selectedTarget = null;

// Elementos DOM
const canvas = document.getElementById('canvas');
const connectionsSvg = document.getElementById('connectionsSvg');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const fileInput = document.getElementById('fileInput');
const newDialogBtn = document.getElementById('newDialogBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetZoomBtn = document.getElementById('resetZoomBtn');
const zoomLevel = document.getElementById('zoomLevel');

// Modals
const responseModal = document.getElementById('responseModal');
const customModal = document.getElementById('customModal');
const editResponseModal = document.getElementById('editResponseModal');
const editCustomModal = document.getElementById('editCustomModal');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Adicionar grid estática
    const gridBg = document.createElement('div');
    gridBg.className = 'canvas-background';
    document.body.insertBefore(gridBg, canvas);
    
    loadFromLocalStorage();
    setupEventListeners();
    renderAll();
});

// Setup de event listeners
function setupEventListeners() {
    // Canvas dragging
    canvas.addEventListener('mousedown', startCanvasDrag);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDrag);

    // Toolbar buttons
    saveBtn.addEventListener('click', saveToJSON);
    loadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', loadFromJSON);
    newDialogBtn.addEventListener('click', createNewDialog);
    
    // Zoom controls
    zoomInBtn.addEventListener('click', () => adjustZoom(0.1));
    zoomOutBtn.addEventListener('click', () => adjustZoom(-0.1));
    resetZoomBtn.addEventListener('click', resetZoom);
    
    // Mouse wheel zoom
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Shift + N: Novo diálogo
        if (e.shiftKey && e.key === 'N') {
            e.preventDefault();
            createNewDialog();
        }
    });

    // Response modal
    document.getElementById('confirmResponse').addEventListener('click', confirmAddResponse);
    document.getElementById('cancelResponse').addEventListener('click', () => closeModal(responseModal));
    
    // Setup autocomplete for response target
    const responseTargetInput = document.getElementById('responseTarget');
    responseTargetInput.addEventListener('input', (e) => updateAutocomplete(e.target, 'responseTargetList'));
    responseTargetInput.addEventListener('focus', (e) => updateAutocomplete(e.target, 'responseTargetList'));

    // Custom modal
    document.getElementById('confirmCustom').addEventListener('click', confirmAddCustom);
    document.getElementById('cancelCustom').addEventListener('click', () => closeModal(customModal));

    // Edit Response modal
    document.getElementById('confirmEditResponse').addEventListener('click', confirmEditResponse);
    document.getElementById('deleteResponse').addEventListener('click', deleteResponse);
    document.getElementById('cancelEditResponse').addEventListener('click', () => closeModal(editResponseModal));
    
    // Setup autocomplete for edit response target
    const editResponseTargetInput = document.getElementById('editResponseTarget');
    editResponseTargetInput.addEventListener('input', (e) => updateAutocomplete(e.target, 'editResponseTargetList'));
    editResponseTargetInput.addEventListener('focus', (e) => updateAutocomplete(e.target, 'editResponseTargetList'));

    // Edit Custom modal
    document.getElementById('confirmEditCustom').addEventListener('click', confirmEditCustom);
    document.getElementById('deleteCustom').addEventListener('click', deleteCustomValue);
    document.getElementById('cancelEditCustom').addEventListener('click', () => closeModal(editCustomModal));
    
    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete-wrapper')) {
            document.querySelectorAll('.autocomplete-list').forEach(list => {
                list.classList.remove('active');
            });
        }
    });
}

// Zoom functions
function adjustZoom(delta) {
    dialogData.zoom = Math.max(0.2, Math.min(2, dialogData.zoom + delta));
    applyZoom();
    autoSave();
}

function resetZoom() {
    dialogData.zoom = 1;
    applyZoom();
    autoSave();
}

function applyZoom() {
    canvas.style.transform = `translate(${dialogData.canvasOffset.x}px, ${dialogData.canvasOffset.y}px) scale(${dialogData.zoom})`;
    zoomLevel.textContent = `${Math.round(dialogData.zoom * 100)}%`;
    updateConnections();
}

function handleWheel(e) {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        // Salvar posição do mouse antes do zoom
        const mouseX = e.clientX;
        const mouseY = e.clientY - 60; // Compensar toolbar
        
        // Calcular posição do mouse no canvas antes do zoom
        const canvasMouseX = (mouseX - dialogData.canvasOffset.x) / dialogData.zoom;
        const canvasMouseY = (mouseY - dialogData.canvasOffset.y) / dialogData.zoom;
        
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        const oldZoom = dialogData.zoom;
        dialogData.zoom = Math.max(0.2, Math.min(2, dialogData.zoom + delta));
        
        // Ajustar offset para manter o mouse na mesma posição do canvas
        dialogData.canvasOffset.x = mouseX - (canvasMouseX * dialogData.zoom);
        dialogData.canvasOffset.y = mouseY - (canvasMouseY * dialogData.zoom);
        
        applyZoom();
        autoSave();
    }
}

// Autocomplete functions
function updateAutocomplete(input, listId) {
    const list = document.getElementById(listId);
    const searchValue = input.value.toLowerCase();
    
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
            
            const preview = block.lines[0] ? block.lines[0].substring(0, 50) : 'Sem texto';
            
            item.innerHTML = `
                <div class="autocomplete-item-id">${blockId}</div>
                <div class="autocomplete-item-preview">${preview}...</div>
            `;
            
            item.addEventListener('click', () => {
                input.value = blockId;
                selectedTarget = blockId;
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

// Canvas dragging
function startCanvasDrag(e) {
    if (e.target === canvas) {
        isDraggingCanvas = true;
        canvas.classList.add('grabbing');
        dragStartPos = { x: e.clientX, y: e.clientY };
    }
}

function handleMouseMove(e) {
    if (isDraggingCanvas) {
        const dx = e.clientX - dragStartPos.x;
        const dy = e.clientY - dragStartPos.y;
        
        dialogData.canvasOffset.x += dx;
        dialogData.canvasOffset.y += dy;
        
        canvas.style.transform = `translate(${dialogData.canvasOffset.x}px, ${dialogData.canvasOffset.y}px) scale(${dialogData.zoom})`;
        
        dragStartPos = { x: e.clientX, y: e.clientY };
        
        updateConnections();
    } else if (isDraggingBlock && currentDragBlock) {
        const block = dialogData.blocks.find(b => b.id === currentDragBlock);
        if (block) {
            block.x = (e.clientX - blockDragOffset.x - dialogData.canvasOffset.x) / dialogData.zoom;
            block.y = (e.clientY - blockDragOffset.y - dialogData.canvasOffset.y - 60) / dialogData.zoom;
            
            renderBlock(block);
            updateConnections();
            autoSave();
        }
    }
}

function stopDrag() {
    isDraggingCanvas = false;
    isDraggingBlock = false;
    currentDragBlock = null;
    canvas.classList.remove('grabbing');
}

// Block dragging
function startBlockDrag(e, blockId) {
    e.stopPropagation();
    isDraggingBlock = true;
    currentDragBlock = blockId;
    
    const block = dialogData.blocks.find(b => b.id === blockId);
    if (block) {
        blockDragOffset.x = e.clientX - (block.x * dialogData.zoom) - dialogData.canvasOffset.x;
        blockDragOffset.y = e.clientY - (block.y * dialogData.zoom) - dialogData.canvasOffset.y - 60;
    }
}

// Criar novo diálogo
function createNewDialog() {
    // Encontrar o bloco mais à direita
    let maxX = 0;
    if (dialogData.blocks.length > 0) {
        maxX = Math.max(...dialogData.blocks.map(b => b.x));
        maxX += 370; // 320px de largura do bloco + 50px de margem
    } else {
        maxX = 100;
    }
    
    const newBlock = {
        id: dialogData.nextId++,
        x: maxX,
        y: 100,
        lines: ['Texto do diálogo, linha 1.', 'Texto do diálogo, linha 2.'],
        responses: [],
        customValues: []
    };
    
    dialogData.blocks.push(newBlock);
    renderBlock(newBlock);
    autoSave();
}

// Renderizar bloco
function renderBlock(block) {
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
            <button class="delete-block-btn" onclick="deleteBlock(${block.id})">
                <span class="material-icons">delete</span> Deletar
            </button>
        </div>
        
        <div class="dialog-lines">
            ${block.lines.map((line, index) => `
                <div class="dialog-line-wrapper">
                    <textarea class="dialog-line" 
                        data-block-id="${block.id}"
                        data-line-index="${index}"
                        onchange="updateLine(${block.id}, ${index}, this.value)"
                        rows="1">${line}</textarea>
                    <button class="copy-line-btn" onclick="copyLine(${block.id}, ${index})" title="Copiar texto">
                        <span class="material-icons">content_copy</span>
                    </button>
                </div>
            `).join('')}
        </div>
        
        <div class="add-line-btn" onclick="addLine(${block.id})">+</div>
        
        <div class="divider"></div>
        
        <div class="responses-section">
            ${block.responses.map((response, index) => `
                <div class="response-item">
                    <button class="response-btn" style="background: ${response.color}">
                        ${response.text}
                    </button>
                    <div class="item-actions">
                        <button class="edit-btn" onclick="editResponse(${block.id}, ${index})">
                            <span class="material-icons">edit</span>
                        </button>
                        <button class="copy-btn" onclick="copyResponse(${block.id}, ${index})">
                            <span class="material-icons">content_copy</span>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="add-response-btn" onclick="openAddResponseModal(${block.id})">+</div>
        
        <div class="divider"></div>
        
        <div class="custom-section">
            ${block.customValues.map((custom, index) => `
                <div class="custom-item">
                    <button class="custom-btn" style="background: ${custom.color}">
                        ${custom.text}
                    </button>
                    <div class="item-actions">
                        <button class="edit-btn" onclick="editCustom(${block.id}, ${index})">
                            <span class="material-icons">edit</span>
                        </button>
                        <button class="copy-btn" onclick="copyCustom(${block.id}, ${index})">
                            <span class="material-icons">content_copy</span>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="add-custom-btn" onclick="openAddCustomModal(${block.id})">+</div>
    `;
    
    // Reattach drag listener
    blockElement.onmousedown = (e) => {
        if (e.target === blockElement || e.target.classList.contains('dialog-header') || e.target.classList.contains('dialog-id')) {
            startBlockDrag(e, block.id);
        }
    };
    
    // Add keyboard event listeners to dialog lines
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
        
        textarea.addEventListener('keydown', (e) => {
            const blockId = parseInt(textarea.dataset.blockId);
            const lineIndex = parseInt(textarea.dataset.lineIndex);
            
            // Shift + Enter: salvar valor atual e criar nova linha
            if (e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                // Salvar o valor atual primeiro
                const currentBlock = dialogData.blocks.find(b => b.id === blockId);
                if (currentBlock) {
                    currentBlock.lines[lineIndex] = textarea.value;
                }
                addLineAndFocus(blockId, lineIndex + 1);
            }
            // Backspace em linha vazia: deletar linha e focar na anterior
            else if (e.key === 'Backspace' && textarea.value === '' && block.lines.length > 1) {
                e.preventDefault();
                deleteLineAndFocusPrevious(blockId, lineIndex);
            }
        });
    });
}

// Funções de linha de diálogo
function addLine(blockId) {
    const block = dialogData.blocks.find(b => b.id === blockId);
    if (block) {
        block.lines.push('Nova linha de diálogo.');
        renderBlock(block);
        autoSave();
    }
}

function addLineAndFocus(blockId, atIndex) {
    const block = dialogData.blocks.find(b => b.id === blockId);
    if (block) {
        block.lines.splice(atIndex, 0, '');
        renderBlock(block);
        autoSave();
        
        // Focus na nova linha
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
    const block = dialogData.blocks.find(b => b.id === blockId);
    if (block && block.lines.length > 1) {
        block.lines.splice(lineIndex, 1);
        renderBlock(block);
        autoSave();
        
        // Focus na linha anterior
        setTimeout(() => {
            const blockElement = document.getElementById(`block-${blockId}`);
            const inputs = blockElement.querySelectorAll('.dialog-line');
            const previousIndex = Math.max(0, lineIndex - 1);
            if (inputs[previousIndex]) {
                inputs[previousIndex].focus();
                // Mover cursor para o final
                inputs[previousIndex].setSelectionRange(inputs[previousIndex].value.length, inputs[previousIndex].value.length);
            }
        }, 10);
    }
}

function updateLine(blockId, lineIndex, value) {
    const block = dialogData.blocks.find(b => b.id === blockId);
    if (block) {
        block.lines[lineIndex] = value;
        autoSave();
    }
}

// Deletar bloco
function deleteBlock(blockId) {
    if (confirm('Tem certeza que deseja deletar este bloco?')) {
        dialogData.blocks = dialogData.blocks.filter(b => b.id !== blockId);
        const blockElement = document.getElementById(`block-${blockId}`);
        if (blockElement) {
            blockElement.remove();
        }
        updateConnections();
        autoSave();
    }
}

// Gerar cor aleatória baseada em HSL
function getRandomColor() {
    // Cor base: HSL(46, 65%, 38%)
    // Varia apenas o HUE (0-360)
    const hue = Math.floor(Math.random() * 360);
    const saturation = 65;
    const lightness = 38;
    
    return hslToHex(hue, saturation, lightness);
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// Modal functions
function openAddResponseModal(blockId) {
    currentEditingItem = { blockId, type: 'response', action: 'add' };
    selectedTarget = null;
    document.getElementById('responseText').value = '';
    document.getElementById('responseColor').value = getRandomColor();
    document.getElementById('responseTarget').value = '';
    
    const list = document.getElementById('responseTargetList');
    if (list) {
        list.classList.remove('active');
    }
    
    openModal(responseModal);
}

function openAddCustomModal(blockId) {
    currentEditingItem = { blockId, type: 'custom', action: 'add' };
    document.getElementById('customText').value = '';
    document.getElementById('customColor').value = getRandomColor();
    openModal(customModal);
}

function editResponse(blockId, responseIndex) {
    const block = dialogData.blocks.find(b => b.id === blockId);
    if (block) {
        const response = block.responses[responseIndex];
        currentEditingItem = { blockId, type: 'response', action: 'edit', index: responseIndex };
        selectedTarget = response.target || null;
        
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

function editCustom(blockId, customIndex) {
    const block = dialogData.blocks.find(b => b.id === blockId);
    if (block) {
        const custom = block.customValues[customIndex];
        currentEditingItem = { blockId, type: 'custom', action: 'edit', index: customIndex };
        
        document.getElementById('editCustomText').value = custom.text;
        document.getElementById('editCustomColor').value = custom.color;
        openModal(editCustomModal);
    }
}

function confirmAddResponse() {
    const text = document.getElementById('responseText').value;
    const color = document.getElementById('responseColor').value;
    const target = document.getElementById('responseTarget').value;
    
    if (!text) {
        alert('Por favor, digite um texto para a resposta.');
        return;
    }
    
    const block = dialogData.blocks.find(b => b.id === currentEditingItem.blockId);
    if (block) {
        block.responses.push({ text, color, target });
        renderBlock(block);
        updateConnections();
        autoSave();
    }
    
    closeModal(responseModal);
}

function confirmAddCustom() {
    const text = document.getElementById('customText').value;
    const color = document.getElementById('customColor').value;
    
    if (!text) {
        alert('Por favor, digite um texto.');
        return;
    }
    
    const block = dialogData.blocks.find(b => b.id === currentEditingItem.blockId);
    if (block) {
        block.customValues.push({ text, color });
        renderBlock(block);
        autoSave();
    }
    
    closeModal(customModal);
}

function confirmEditResponse() {
    const text = document.getElementById('editResponseText').value;
    const color = document.getElementById('editResponseColor').value;
    const target = document.getElementById('editResponseTarget').value;
    
    if (!text) {
        alert('Por favor, digite um texto para a resposta.');
        return;
    }
    
    const block = dialogData.blocks.find(b => b.id === currentEditingItem.blockId);
    if (block) {
        block.responses[currentEditingItem.index] = { text, color, target };
        renderBlock(block);
        updateConnections();
        autoSave();
    }
    
    closeModal(editResponseModal);
}

function confirmEditCustom() {
    const text = document.getElementById('editCustomText').value;
    const color = document.getElementById('editCustomColor').value;
    
    if (!text) {
        alert('Por favor, digite um texto.');
        return;
    }
    
    const block = dialogData.blocks.find(b => b.id === currentEditingItem.blockId);
    if (block) {
        block.customValues[currentEditingItem.index] = { text, color };
        renderBlock(block);
        autoSave();
    }
    
    closeModal(editCustomModal);
}

function deleteResponse() {
    if (confirm('Tem certeza que deseja excluir esta resposta?')) {
        const block = dialogData.blocks.find(b => b.id === currentEditingItem.blockId);
        if (block) {
            block.responses.splice(currentEditingItem.index, 1);
            renderBlock(block);
            updateConnections();
            autoSave();
        }
        closeModal(editResponseModal);
    }
}

function deleteCustomValue() {
    if (confirm('Tem certeza que deseja excluir este valor customizado?')) {
        const block = dialogData.blocks.find(b => b.id === currentEditingItem.blockId);
        if (block) {
            block.customValues.splice(currentEditingItem.index, 1);
            renderBlock(block);
            autoSave();
        }
        closeModal(editCustomModal);
    }
}

function copyResponse(blockId, responseIndex) {
    const block = dialogData.blocks.find(b => b.id === blockId);
    if (block) {
        const response = block.responses[responseIndex];
        navigator.clipboard.writeText(response.text).then(() => {
            showToast('📋 Texto copiado!');
        });
    }
}

function copyLine(blockId, lineIndex) {
    const block = dialogData.blocks.find(b => b.id === blockId);
    if (block && block.lines[lineIndex]) {
        navigator.clipboard.writeText(block.lines[lineIndex]).then(() => {
            showToast('📋 Texto copiado!');
        });
    }
}

function copyCustom(blockId, customIndex) {
    const block = dialogData.blocks.find(b => b.id === blockId);
    if (block) {
        const custom = block.customValues[customIndex];
        navigator.clipboard.writeText(custom.text).then(() => {
            showToast('📋 Texto copiado!');
        });
    }
}

function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

// Toast notification
function showToast(message) {
    const indicator = document.getElementById('autoSaveIndicator');
    indicator.textContent = message;
    indicator.style.opacity = '1';
    indicator.style.display = 'flex';
    
    setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 300);
    }, 2000);
}

// Atualizar conexões
function updateConnections() {
    connectionsSvg.innerHTML = '';
    
    dialogData.blocks.forEach(block => {
        block.responses.forEach((response, responseIndex) => {
            if (response.target) {
                const targetId = parseInt(response.target.replace('#', ''));
                const targetBlock = dialogData.blocks.find(b => b.id === targetId);
                
                if (targetBlock) {
                    drawConnection(block, targetBlock, response.color, responseIndex);
                }
            }
        });
    });
}

function drawConnection(fromBlock, toBlock, color, responseIndex) {
    const fromEl = document.getElementById(`block-${fromBlock.id}`);
    const toEl = document.getElementById(`block-${toBlock.id}`);
    
    if (!fromEl || !toEl) return;
    
    // Pegar as posições reais dos elementos na tela
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    
    // Calcular posições considerando a toolbar de 60px
    const fromX = fromRect.right;
    const fromY = fromRect.top + (fromRect.height / 2) + (responseIndex * 50) - 60;
    
    const toX = toRect.left;
    const toY = toRect.top + (toRect.height / 2) - 60;
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    const midX = (fromX + toX) / 2;
    const d = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
    
    line.setAttribute('d', d);
    line.setAttribute('class', 'connection-line');
    line.setAttribute('stroke', color);
    
    connectionsSvg.appendChild(line);
}

// Renderizar tudo
function renderAll() {
    canvas.innerHTML = '';
    dialogData.blocks.forEach(block => renderBlock(block));
    updateConnections();
    applyZoom();
}

// Auto-save
function autoSave() {
    localStorage.setItem('dialogData', JSON.stringify(dialogData));
    showToast('💾 Alterações salvas');
}

// Load from localStorage
function loadFromLocalStorage() {
    const saved = localStorage.getItem('dialogData');
    if (saved) {
        dialogData = JSON.parse(saved);
        // Garantir que zoom existe
        if (!dialogData.zoom) {
            dialogData.zoom = 1;
        }
    } else {
        // Criar bloco inicial
        createNewDialog();
    }
}

// Save to JSON
function saveToJSON() {
    const dataStr = JSON.stringify(dialogData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dialogos.json';
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('✓ JSON exportado!');
}

// Load from JSON
function loadFromJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            dialogData = JSON.parse(event.target.result);
            renderAll();
            autoSave();
            showToast('✓ JSON carregado!');
        } catch (error) {
            alert('Erro ao carregar arquivo JSON: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Make functions global
window.addLine = addLine;
window.updateLine = updateLine;
window.deleteBlock = deleteBlock;
window.openAddResponseModal = openAddResponseModal;
window.openAddCustomModal = openAddCustomModal;
window.editResponse = editResponse;
window.editCustom = editCustom;
window.copyResponse = copyResponse;
window.copyCustom = copyCustom;
window.copyLine = copyLine;
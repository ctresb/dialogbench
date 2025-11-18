/**
 * Canvas Management Module
 * Handles canvas dragging, zooming, and panning
 */

import { state, getDialogData, getDraggingState, getSnappingState, getSelectionState, clearSelection } from './state.js';
import { elements } from './dom.js';
import { updateConnections } from './connections.js';
import { autoSave } from './storage.js';
import { renderBlock, getBlockInstanceById } from './blocks.js';

// Selection box element
let selectionBox = null;

export function initCanvas() {
    const { canvas } = elements;
    
    // Add static grid background
    const gridBg = document.createElement('div');
    gridBg.className = 'canvas-background';
    document.body.insertBefore(gridBg, canvas);
    
    // Create selection box
    selectionBox = document.createElement('div');
    selectionBox.className = 'selection-box';
    selectionBox.style.display = 'none';
    document.body.appendChild(selectionBox);
    
    // Setup event listeners - listen on document for canvas dragging to work everywhere
    document.addEventListener('mousedown', startCanvasDrag);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);
}

export function adjustZoom(delta) {
    const dialogData = getDialogData();
    dialogData.zoom = Math.max(0.2, Math.min(2, dialogData.zoom + delta));
    applyZoom();
    autoSave();
}

export function resetZoom() {
    const dialogData = getDialogData();
    
    // If no blocks, just reset to default
    if (dialogData.blocks.length === 0) {
        dialogData.zoom = 1;
        dialogData.canvasOffset = { x: 0, y: 0 };
        applyZoom();
        autoSave();
        return;
    }
    
    // Calculate bounding box of all blocks
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    dialogData.blocks.forEach(block => {
        const blockElement = document.getElementById(`block-${block.id}`);
        if (blockElement) {
            const width = blockElement.offsetWidth;
            const height = blockElement.offsetHeight;
            
            minX = Math.min(minX, block.x);
            minY = Math.min(minY, block.y);
            maxX = Math.max(maxX, block.x + width);
            maxY = Math.max(maxY, block.y + height);
        }
    });
    
    // If no valid blocks found, reset to default
    if (minX === Infinity) {
        dialogData.zoom = 1;
        dialogData.canvasOffset = { x: 0, y: 0 };
        applyZoom();
        autoSave();
        return;
    }
    
    // Add padding
    const padding = 100;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // Viewport size (without toolbar)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 60;
    
    // Calculate zoom to fit
    const zoomX = viewportWidth / contentWidth;
    const zoomY = viewportHeight / contentHeight;
    dialogData.zoom = Math.max(0.2, Math.min(1, Math.min(zoomX, zoomY)));
    
    // Calculate offsets to center content
    // Content center in canvas space
    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;
    
    // Viewport center
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;
    
    // Set offset so content center aligns with viewport center
    dialogData.canvasOffset.x = viewportCenterX - (contentCenterX * dialogData.zoom);
    dialogData.canvasOffset.y = viewportCenterY - (contentCenterY * dialogData.zoom);
    
    applyZoom();
    autoSave();
}

export function applyZoom() {
    const { canvas, zoomLevel } = elements;
    const dialogData = getDialogData();
    
    canvas.style.transform = `translate(${dialogData.canvasOffset.x}px, ${dialogData.canvasOffset.y}px) scale(${dialogData.zoom})`;
    zoomLevel.textContent = `${Math.round(dialogData.zoom * 100)}%`;
    updateConnections();
}

function handleWheel(e) {
    e.preventDefault();
    
    const dialogData = getDialogData();
    
    // Mouse position relative to the page
    const mouseX = e.pageX;
    const mouseY = e.pageY - 60; // Account for toolbar
    
    // Store old zoom
    const oldZoom = dialogData.zoom;
    
    // Calculate zoom delta
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newZoom = Math.max(0.2, Math.min(2, oldZoom + delta));
    const zoomRatio = newZoom / oldZoom;
    
    // Calculate what point on the canvas is under the cursor before zoom
    const canvasPointX = (mouseX - dialogData.canvasOffset.x) / oldZoom;
    const canvasPointY = (mouseY - dialogData.canvasOffset.y) / oldZoom;
    
    // Update zoom
    dialogData.zoom = newZoom;
    
    // Recalculate offset so the same canvas point stays under cursor
    dialogData.canvasOffset.x = mouseX - (canvasPointX * newZoom);
    dialogData.canvasOffset.y = mouseY - (canvasPointY * newZoom);
    
    applyZoom();
    autoSave();
}

// Momentum tracking
let velocity = { x: 0, y: 0 };
let lastMoveTime = 0;
let momentumAnimationId = null;

function startCanvasDrag(e) {
    const { canvas } = elements;
    const dragging = getDraggingState();
    const selection = getSelectionState();
    const dialogData = getDialogData();
    
    // Don't start canvas drag if clicking on dialog blocks, toolbar, or modal elements
    if (e.target.closest('.toolbar') ||
        e.target.closest('.modal') ||
        e.target.closest('button') ||
        e.target.closest('input') ||
        e.target.closest('textarea') ||
        e.target.closest('select')) {
        return;
    }
    
    // Check if clicking on a selected block to drag selection
    const clickedBlock = e.target.closest('.dialog-block');
    if (clickedBlock && selection.selectedBlocks.length > 0) {
        const blockId = parseInt(clickedBlock.id.replace('block-', ''));
        if (selection.selectedBlocks.includes(blockId)) {
            selection.isDraggingSelection = true;
            selection.dragOffset = { x: e.clientX, y: e.clientY };
            return;
        }
    }
    
    // If clicking on a block that's not selected, let block drag handle it
    if (clickedBlock) {
        return;
    }
    
    // Start selection if Shift is held
    if (e.shiftKey && e.clientY > 60) {
        clearSelection();
        updateSelectedBlocksVisual();
        
        selection.isSelecting = true;
        selection.selectionStart = { x: e.clientX, y: e.clientY };
        selection.selectionEnd = { x: e.clientX, y: e.clientY };
        
        selectionBox.style.display = 'block';
        updateSelectionBox();
        e.preventDefault();
        return;
    }
    
    // Clear selection if clicking without shift
    if (selection.selectedBlocks.length > 0 && !e.shiftKey) {
        clearSelection();
        updateSelectedBlocksVisual();
    }
    
    // Start canvas drag for any click in the viewport area below toolbar
    if (e.clientY > 60) {
        // Stop any ongoing momentum
        if (momentumAnimationId) {
            cancelAnimationFrame(momentumAnimationId);
            momentumAnimationId = null;
        }
        
        dragging.isDraggingCanvas = true;
        canvas.classList.add('grabbing');
        document.body.style.cursor = 'grabbing';
        dragging.dragStartPos = { x: e.clientX, y: e.clientY };
        lastMoveTime = Date.now();
        velocity = { x: 0, y: 0 };
        
        e.preventDefault();
    }
}

function handleMouseMove(e) {
    const dragging = getDraggingState();
    const selection = getSelectionState();
    const dialogData = getDialogData();
    const { canvas } = elements;
    
    // Handle selection box dragging
    if (selection.isSelecting) {
        selection.selectionEnd = { x: e.clientX, y: e.clientY };
        updateSelectionBox();
        updateSelectedBlocks();
        return;
    }
    
    // Handle dragging multiple selected blocks
    if (selection.isDraggingSelection) {
        const totalDx = e.clientX - selection.dragOffset.x;
        const totalDy = e.clientY - selection.dragOffset.y;
        
        const snapping = getSnappingState();
        
        selection.selectedBlocks.forEach(blockId => {
            const block = state.dialogData.blocks.find(b => b.id === blockId);
            const blockInstance = getBlockInstanceById(blockId);
            if (block && blockInstance) {
                const initial = selection.initialPositions[blockId];
                if (initial) {
                    let newX = initial.x + (totalDx / dialogData.zoom);
                    let newY = initial.y + (totalDy / dialogData.zoom);
                    
                    // Apply snapping if enabled
                    if (snapping.enabled) {
                        newX = Math.round(newX / snapping.gridSize) * snapping.gridSize;
                        newY = Math.round(newY / snapping.gridSize) * snapping.gridSize;
                    }
                    
                    block.x = newX;
                    block.y = newY;
                    blockInstance.setPosition(newX, newY);
                }
            }
        });
        
        updateConnections();
        autoSave();
        return;
    }
    
    if (dragging.isDraggingCanvas) {
        const currentTime = Date.now();
        const timeDelta = Math.max(1, currentTime - lastMoveTime);
        
        const dx = e.clientX - dragging.dragStartPos.x;
        const dy = e.clientY - dragging.dragStartPos.y;
        
        // Calculate velocity for momentum
        velocity.x = dx / timeDelta * 16; // Normalize to 60fps
        velocity.y = dy / timeDelta * 16;
        
        dialogData.canvasOffset.x += dx;
        dialogData.canvasOffset.y += dy;
        
        applyZoom();
        
        dragging.dragStartPos = { x: e.clientX, y: e.clientY };
        lastMoveTime = currentTime;
    } else if (dragging.isDraggingBlock && dragging.currentDragBlock) {
        const block = state.dialogData.blocks.find(b => b.id === dragging.currentDragBlock);
        const blockInstance = getBlockInstanceById(dragging.currentDragBlock);
        if (block && blockInstance) {
            let x = (e.clientX - dragging.blockDragOffset.x - dialogData.canvasOffset.x) / dialogData.zoom;
            let y = (e.clientY - dragging.blockDragOffset.y - dialogData.canvasOffset.y - 60) / dialogData.zoom;
            
            // Apply snapping if enabled
            const snapping = getSnappingState();
            if (snapping.enabled) {
                x = Math.round(x / snapping.gridSize) * snapping.gridSize;
                y = Math.round(y / snapping.gridSize) * snapping.gridSize;
            }
            
            block.x = x;
            block.y = y;
            blockInstance.setPosition(x, y);
            
            updateConnections();
            autoSave();
        }
    }
}

function applyMomentum() {
    const dialogData = getDialogData();
    const friction = 0.92; // Deceleration factor
    const minVelocity = 0.1; // Stop threshold
    
    // Apply velocity to position
    dialogData.canvasOffset.x += velocity.x;
    dialogData.canvasOffset.y += velocity.y;
    
    // Apply friction
    velocity.x *= friction;
    velocity.y *= friction;
    
    applyZoom();
    
    // Continue animation if velocity is significant
    if (Math.abs(velocity.x) > minVelocity || Math.abs(velocity.y) > minVelocity) {
        momentumAnimationId = requestAnimationFrame(applyMomentum);
    } else {
        momentumAnimationId = null;
        autoSave();
    }
}

function stopDrag() {
    const { canvas } = elements;
    const dragging = getDraggingState();
    const selection = getSelectionState();
    
    // Handle selection box release
    if (selection.isSelecting) {
        selection.isSelecting = false;
        selectionBox.style.display = 'none';
        updateSelectedBlocksVisual();
    }
    
    // Handle selection drag release
    if (selection.isDraggingSelection) {
        selection.isDraggingSelection = false;
        autoSave();
    }
    
    // Apply momentum if canvas was being dragged
    if (dragging.isDraggingCanvas) {
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (speed > 1) {
            // Start momentum animation
            momentumAnimationId = requestAnimationFrame(applyMomentum);
        } else {
            autoSave();
        }
    }
    
    dragging.isDraggingCanvas = false;
    dragging.isDraggingBlock = false;
    dragging.currentDragBlock = null;
    canvas.classList.remove('grabbing');
    document.body.style.cursor = '';
}

function handleKeyDown(e) {
    const selection = getSelectionState();
    
    // Escape key clears selection
    if (e.key === 'Escape' && selection.selectedBlocks.length > 0) {
        clearSelection();
        updateSelectedBlocksVisual();
    }
}

function updateSelectionBox() {
    const selection = getSelectionState();
    
    const left = Math.min(selection.selectionStart.x, selection.selectionEnd.x);
    const top = Math.min(selection.selectionStart.y, selection.selectionEnd.y);
    const width = Math.abs(selection.selectionEnd.x - selection.selectionStart.x);
    const height = Math.abs(selection.selectionEnd.y - selection.selectionStart.y);
    
    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
}

function updateSelectedBlocks() {
    const selection = getSelectionState();
    const dialogData = getDialogData();
    
    const left = Math.min(selection.selectionStart.x, selection.selectionEnd.x);
    const top = Math.min(selection.selectionStart.y, selection.selectionEnd.y);
    const right = Math.max(selection.selectionStart.x, selection.selectionEnd.x);
    const bottom = Math.max(selection.selectionStart.y, selection.selectionEnd.y);
    
    selection.selectedBlocks = [];
    
    dialogData.blocks.forEach(block => {
        const blockEl = document.getElementById(`block-${block.id}`);
        if (!blockEl) return;
        
        const rect = blockEl.getBoundingClientRect();
        
        // Check if block intersects with selection box
        if (rect.left < right && rect.right > left &&
            rect.top < bottom && rect.bottom > top) {
            selection.selectedBlocks.push(block.id);
        }
    });
    
    updateSelectedBlocksVisual();
}

function updateSelectedBlocksVisual() {
    const selection = getSelectionState();
    const dialogData = getDialogData();
    
    dialogData.blocks.forEach(block => {
        const blockEl = document.getElementById(`block-${block.id}`);
        if (blockEl) {
            if (selection.selectedBlocks.includes(block.id)) {
                blockEl.classList.add('selected');
            } else {
                blockEl.classList.remove('selected');
            }
        }
    });
}

export function startBlockDrag(e, blockId) {
    e.stopPropagation();
    
    const dragging = getDraggingState();
    const selection = getSelectionState();
    const dialogData = getDialogData();
    
    // If this block is part of a selection, drag the entire selection
    if (selection.selectedBlocks.includes(blockId)) {
        selection.isDraggingSelection = true;
        selection.dragOffset = { x: e.clientX, y: e.clientY };
        
        // Store initial positions of all selected blocks
        selection.initialPositions = {};
        selection.selectedBlocks.forEach(id => {
            const block = state.dialogData.blocks.find(b => b.id === id);
            if (block) {
                selection.initialPositions[id] = { x: block.x, y: block.y };
            }
        });
        return;
    }
    
    // Otherwise, clear selection and drag single block
    if (selection.selectedBlocks.length > 0) {
        clearSelection();
        updateSelectedBlocksVisual();
    }
    
    dragging.isDraggingBlock = true;
    dragging.currentDragBlock = blockId;
    
    const block = state.dialogData.blocks.find(b => b.id === blockId);
    if (block) {
        dragging.blockDragOffset.x = e.clientX - (block.x * dialogData.zoom) - dialogData.canvasOffset.x;
        dragging.blockDragOffset.y = e.clientY - (block.y * dialogData.zoom) - dialogData.canvasOffset.y - 60;
    }
}

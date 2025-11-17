/**
 * Canvas Management Module
 * Handles canvas dragging, zooming, and panning
 */

import { state, getDialogData, getDraggingState, getSnappingState } from './state.js';
import { elements } from './dom.js';
import { updateConnections } from './connections.js';
import { autoSave } from './storage.js';
import { renderBlock } from './blocks.js';

export function initCanvas() {
    const { canvas } = elements;
    
    // Add static grid background
    const gridBg = document.createElement('div');
    gridBg.className = 'canvas-background';
    document.body.insertBefore(gridBg, canvas);
    
    // Setup event listeners - listen on document for canvas dragging to work everywhere
    document.addEventListener('mousedown', startCanvasDrag);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('wheel', handleWheel, { passive: false });
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
    if (e.ctrlKey || e.metaKey) {
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
}

// Momentum tracking
let velocity = { x: 0, y: 0 };
let lastMoveTime = 0;
let momentumAnimationId = null;

function startCanvasDrag(e) {
    const { canvas } = elements;
    const dragging = getDraggingState();
    
    // Don't start canvas drag if clicking on dialog blocks, toolbar, or modal elements
    if (e.target.closest('.dialog-block') || 
        e.target.closest('.toolbar') ||
        e.target.closest('.modal') ||
        e.target.closest('button') ||
        e.target.closest('input') ||
        e.target.closest('textarea') ||
        e.target.closest('select')) {
        return;
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
    const dialogData = getDialogData();
    const { canvas } = elements;
    
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
        if (block) {
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
            
            renderBlock(block);
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

export function startBlockDrag(e, blockId) {
    e.stopPropagation();
    
    const dragging = getDraggingState();
    const dialogData = getDialogData();
    
    dragging.isDraggingBlock = true;
    dragging.currentDragBlock = blockId;
    
    const block = state.dialogData.blocks.find(b => b.id === blockId);
    if (block) {
        dragging.blockDragOffset.x = e.clientX - (block.x * dialogData.zoom) - dialogData.canvasOffset.x;
        dragging.blockDragOffset.y = e.clientY - (block.y * dialogData.zoom) - dialogData.canvasOffset.y - 60;
    }
}

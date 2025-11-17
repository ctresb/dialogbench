/**
 * Canvas Management Module
 * Handles canvas dragging, zooming, and panning
 */

import { state, getDialogData, getDraggingState } from './state.js';
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
    
    // Setup event listeners
    canvas.addEventListener('mousedown', startCanvasDrag);
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

function startCanvasDrag(e) {
    const { canvas } = elements;
    const dragging = getDraggingState();
    
    if (e.target === canvas) {
        dragging.isDraggingCanvas = true;
        canvas.classList.add('grabbing');
        dragging.dragStartPos = { x: e.clientX, y: e.clientY };
    }
}

function handleMouseMove(e) {
    const dragging = getDraggingState();
    const dialogData = getDialogData();
    const { canvas } = elements;
    
    if (dragging.isDraggingCanvas) {
        const dx = e.clientX - dragging.dragStartPos.x;
        const dy = e.clientY - dragging.dragStartPos.y;
        
        dialogData.canvasOffset.x += dx;
        dialogData.canvasOffset.y += dy;
        
        applyZoom();
        
        dragging.dragStartPos = { x: e.clientX, y: e.clientY };
    } else if (dragging.isDraggingBlock && dragging.currentDragBlock) {
        const block = state.dialogData.blocks.find(b => b.id === dragging.currentDragBlock);
        if (block) {
            block.x = (e.clientX - dragging.blockDragOffset.x - dialogData.canvasOffset.x) / dialogData.zoom;
            block.y = (e.clientY - dragging.blockDragOffset.y - dialogData.canvasOffset.y - 60) / dialogData.zoom;
            
            renderBlock(block);
            updateConnections();
            autoSave();
        }
    }
}

function stopDrag() {
    const { canvas } = elements;
    const dragging = getDraggingState();
    
    dragging.isDraggingCanvas = false;
    dragging.isDraggingBlock = false;
    dragging.currentDragBlock = null;
    canvas.classList.remove('grabbing');
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

/**
 * Connections Module
 * Handles drawing SVG connections between blocks
 */

import { getDialogData } from './state.js';
import { elements } from './dom.js';

export function updateConnections() {
    const { connectionsSvg } = elements;
    const dialogData = getDialogData();
    
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
    const { connectionsSvg } = elements;
    const fromEl = document.getElementById(`block-${fromBlock.id}`);
    const toEl = document.getElementById(`block-${toBlock.id}`);
    
    if (!fromEl || !toEl) return;
    
    // Get actual positions on screen
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    
    // Calculate positions considering 60px toolbar
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

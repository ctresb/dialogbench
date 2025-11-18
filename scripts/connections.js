/**
 * Connections Module
 * Handles drawing SVG connections between blocks
 */

import { getDialogData } from './state.js';
import { elements } from './dom.js';

// Cache for color transformations
const colorCache = new Map();

// Debounce timer for updateConnections
let updateTimer = null;
let isUpdating = false;

export function updateConnections() {
    // Debounce rapid updates
    if (updateTimer) {
        cancelAnimationFrame(updateTimer);
    }
    
    updateTimer = requestAnimationFrame(() => {
        if (isUpdating) return;
        isUpdating = true;
        
        const { connectionsSvg } = elements;
        const dialogData = getDialogData();
        
        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        
        dialogData.blocks.forEach(block => {
            // Process dialog blocks with responses
            if (block.responses && block.responses.length > 0) {
                block.responses.forEach((response, responseIndex) => {
                    if (response.target) {
                        const targetId = parseInt(response.target.replace('#', ''));
                        const targetBlock = dialogData.blocks.find(b => b.id === targetId);
                        
                        if (targetBlock) {
                            const line = drawConnection(block, targetBlock, response.color, responseIndex);
                            if (line) tempSvg.appendChild(line);
                        }
                    }
                });
            }
            
            // Process event blocks with target
            if (block.type === 'event' && block.target) {
                const targetId = parseInt(block.target.replace('#', ''));
                const targetBlock = dialogData.blocks.find(b => b.id === targetId);
                
                if (targetBlock) {
                    const line = drawConnection(block, targetBlock, block.backgroundColor, 0);
                    if (line) tempSvg.appendChild(line);
                }
            }
        });
        
        // Batch DOM update
        connectionsSvg.innerHTML = '';
        connectionsSvg.appendChild(tempSvg);
        
        isUpdating = false;
    });
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    
    return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function createNeonColors(color) {
    // Check cache first
    if (colorCache.has(color)) {
        return colorCache.get(color);
    }
    
    const rgb = hexToRgb(color);
    if (!rgb) {
        const fallback = { wire: color, glow: color };
        colorCache.set(color, fallback);
        return fallback;
    }
    
    const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    // Wire: reduce saturation by 30%, increase lightness to near-max
    const wireS = Math.max(0, s - 2);
    const wireL = 80;
    const [wr, wg, wb] = hslToRgb(h, wireS, wireL);
    const wireColor = `rgb(${wr}, ${wg}, ${wb})`;
    
    // Glow: use original hue and saturation with higher lightness
    const glowL = 45;
    const [gr, gg, gb] = hslToRgb(h, s, glowL);
    const glowColor = `rgba(${gr}, ${gg}, ${gb}, 0.8)`;
    
    const result = { wire: wireColor, glow: glowColor };
    colorCache.set(color, result);
    return result;
}

function drawConnection(fromBlock, toBlock, color, responseIndex) {
    const fromEl = document.getElementById(`block-${fromBlock.id}`);
    const toEl = document.getElementById(`block-${toBlock.id}`);
    
    if (!fromEl || !toEl) return null;
    
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
    
    // Apply neon effect (cached)
    const { wire, glow } = createNeonColors(color);
    line.setAttribute('stroke', wire);
    
    // Use a more efficient filter (single declaration)
    line.style.filter = `drop-shadow(0 0 2px ${glow}) drop-shadow(0 0 2px ${glow})`;
    
    return line;
}

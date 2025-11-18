/**
 * Block Module - Base Block Class
 * Handles basic block functionality: positioning, movement, and rendering
 */

import { elements } from './dom.js';
import { startBlockDrag } from './canvas.js';

export class Block {
    constructor(data) {
        this.id = data.id;
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.element = null;
    }

    /**
     * Create the DOM element for this block
     */
    createElement() {
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.id = `block-${this.id}`;
            this.element.className = 'dialog-block';
            elements.canvas.appendChild(this.element);
        }
        return this.element;
    }

    /**
     * Update block position in DOM
     */
    updatePosition() {
        if (this.element) {
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
        }
    }

    /**
     * Set up base event listeners (dragging)
     */
    setupBaseListeners() {
        if (!this.element) return;

        this.element.onmousedown = (e) => {
            if (this.shouldStartDrag(e)) {
                startBlockDrag(e, this.id);
            }
        };
    }

    /**
     * Check if drag should start based on clicked element
     */
    shouldStartDrag(e) {
        return e.target === this.element || 
               e.target.classList.contains('dialog-header') || 
               e.target.classList.contains('dialog-id');
    }

    /**
     * Render the block (to be overridden by subclasses)
     */
    render() {
        this.createElement();
        this.updatePosition();
        this.element.innerHTML = this.getContent();
        this.setupBaseListeners();
        this.setupListeners();
    }

    /**
     * Get block content HTML (to be overridden by subclasses)
     */
    getContent() {
        return `<div>Block ${this.id}</div>`;
    }

    /**
     * Set up custom event listeners (to be overridden by subclasses)
     */
    setupListeners() {
        // Override in subclasses
    }

    /**
     * Remove block from DOM
     */
    remove() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    /**
     * Get the DOM element
     */
    getElement() {
        return this.element || document.getElementById(`block-${this.id}`);
    }

    /**
     * Update position coordinates
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updatePosition();
    }

    /**
     * Export block data
     */
    toJSON() {
        return {
            id: this.id,
            x: this.x,
            y: this.y
        };
    }
}

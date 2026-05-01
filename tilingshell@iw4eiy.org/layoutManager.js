// layoutManager.js - Layout management for Tiling Shell
// Provides built-in tiling layouts and utilities to calculate tile geometry.

// Built-in tiling layouts (tile coordinates are relative: 0.0 to 1.0)
const BUILTIN_LAYOUTS = {
    '2-columns': {
        name: '2 Columns',
        tiles: [
            { x: 0,   y: 0, width: 0.5,   height: 1.0 },
            { x: 0.5, y: 0, width: 0.5,   height: 1.0 }
        ]
    },
    '3-columns': {
        name: '3 Columns',
        tiles: [
            { x: 0,     y: 0, width: 0.333, height: 1.0 },
            { x: 0.333, y: 0, width: 0.334, height: 1.0 },
            { x: 0.667, y: 0, width: 0.333, height: 1.0 }
        ]
    },
    'grid-2x2': {
        name: '2x2 Grid',
        tiles: [
            { x: 0,   y: 0,   width: 0.5, height: 0.5 },
            { x: 0.5, y: 0,   width: 0.5, height: 0.5 },
            { x: 0,   y: 0.5, width: 0.5, height: 0.5 },
            { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
        ]
    },
    'left-main': {
        name: 'Main Left',
        tiles: [
            { x: 0,     y: 0,   width: 0.667, height: 1.0 },
            { x: 0.667, y: 0,   width: 0.333, height: 0.5 },
            { x: 0.667, y: 0.5, width: 0.333, height: 0.5 }
        ]
    },
    'right-main': {
        name: 'Main Right',
        tiles: [
            { x: 0.333, y: 0,   width: 0.667, height: 1.0 },
            { x: 0,     y: 0,   width: 0.333, height: 0.5 },
            { x: 0,     y: 0.5, width: 0.333, height: 0.5 }
        ]
    }
};

/**
 * LayoutManager - Manages tiling layouts.
 */
function LayoutManager() {
    this._init();
}

LayoutManager.prototype = {
    _init: function() {
        this._layouts = {};
        // Load built-in layouts
        for (let key in BUILTIN_LAYOUTS) {
            this._layouts[key] = BUILTIN_LAYOUTS[key];
        }
    },

    /**
     * Load (retrieve) a layout by name.
     * @param {string} layoutName - The layout identifier.
     * @returns {Object|null} The layout object or null if not found.
     */
    loadLayout: function(layoutName) {
        return this._layouts[layoutName] || null;
    },

    /**
     * Alias for loadLayout; returns the layout definition.
     * @param {string} layoutName - The layout identifier.
     * @returns {Object|null} The layout object or null if not found.
     */
    getLayout: function(layoutName) {
        return this.loadLayout(layoutName);
    },

    /**
     * Get all available layout names and their display names.
     * @returns {Array} Array of {id, name} objects.
     */
    getAvailableLayouts: function() {
        let result = [];
        for (let key in this._layouts) {
            result.push({ id: key, name: this._layouts[key].name });
        }
        return result;
    },

    /**
     * Convert a tile's relative coordinates to absolute pixel geometry.
     * @param {{x: number, y: number, width: number, height: number}} tile - Relative tile definition.
     * @param {{x: number, y: number, width: number, height: number}} workArea - Absolute work area in pixels.
     * @param {number} [gapsSize=0] - Gap size in pixels to apply on each side.
     * @returns {{x: number, y: number, width: number, height: number}} Absolute geometry.
     */
    calculateTileGeometry: function(tile, workArea, gapsSize) {
        let gap = gapsSize || 0;
        let x = Math.floor(workArea.x + tile.x * workArea.width + gap);
        let y = Math.floor(workArea.y + tile.y * workArea.height + gap);
        let width = Math.floor(tile.width * workArea.width - gap * 2);
        let height = Math.floor(tile.height * workArea.height - gap * 2);
        return { x: x, y: y, width: width, height: height };
    },

    /**
     * Add or replace a custom layout.
     * @param {string} id - Unique layout identifier.
     * @param {Object} layout - Layout definition with name and tiles array.
     */
    addLayout: function(id, layout) {
        this._layouts[id] = layout;
    },

    /**
     * Remove a custom layout (built-in layouts cannot be removed).
     * @param {string} id - Layout identifier to remove.
     */
    removeLayout: function(id) {
        if (BUILTIN_LAYOUTS[id]) return; // Do not remove built-ins
        delete this._layouts[id];
    }
};

// tilingManager.js - Core tiling system manager for Tiling Shell
// Manages tiling zones for one monitor, handles overlay display and window placement.

const St = imports.gi.St;
const Meta = imports.gi.Meta;
const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;
const Lang = imports.lang;
const Utils = imports.utils;

/**
 * TilingManager - Manages tiling for a single monitor.
 *
 * @param {number} monitorIndex - Index of the monitor this manager handles.
 * @param {Object} workArea - Work area rectangle {x, y, width, height}.
 * @param {Object} layoutManager - LayoutManager instance.
 * @param {Object} windowTracker - WindowTracker instance.
 * @param {Object} settings - SettingsManager instance.
 */
function TilingManager(monitorIndex, workArea, layoutManager, windowTracker, settings) {
    this._init(monitorIndex, workArea, layoutManager, windowTracker, settings);
}

TilingManager.prototype = {
    _init: function(monitorIndex, workArea, layoutManager, windowTracker, settings) {
        this.monitorIndex = monitorIndex;
        this.workArea = workArea;
        this._layoutManager = layoutManager;
        this._windowTracker = windowTracker;
        this._settings = settings;
        this._currentLayoutId = '2-columns';
        this._overlayActors = [];
        this._hoveredTileIndex = -1;
        this._signals = [];
        this._draggingWindow = null;
        this._originalGeometries = new Map(); // window -> {x,y,width,height}
    },

    /**
     * Enable the tiling manager: connect to grab-op signals.
     */
    enable: function() {
        this._connectSignals();
    },

    /**
     * Connect to Muffin/Mutter window manager signals for drag detection.
     */
    _connectSignals: function() {
        let grabBeginId = global.display.connect(
            'grab-op-begin',
            Lang.bind(this, this._onGrabOpBegin)
        );
        this._signals.push({ obj: global.display, id: grabBeginId });

        let grabEndId = global.display.connect(
            'grab-op-end',
            Lang.bind(this, this._onGrabOpEnd)
        );
        this._signals.push({ obj: global.display, id: grabEndId });
    },

    /**
     * Called when a grab operation begins (e.g. window drag starts).
     * Handles both Muffin signal signatures:
     *   Old (Cinnamon < 5.6): grab-op-begin(display, screen, window, op)
     *   New (Cinnamon >= 5.6): grab-op-begin(display, window, op)
     */
    _onGrabOpBegin: function(display, screenOrWindow, windowOrOp, opOrUndefined) {
        let window, op;
        if (opOrUndefined === undefined) {
            // New signature: (display, window, op)
            window = screenOrWindow;
            op = windowOrOp;
        } else {
            // Old signature: (display, screen, window, op)
            window = windowOrOp;
            op = opOrUndefined;
        }

        // Only react to window move operations
        if (op !== Meta.GrabOp.MOVING) return;
        if (!window) return;
        if (window.get_monitor() !== this.monitorIndex) return;

        this._draggingWindow = window;

        // Store original geometry for untile restoration
        if (!this._originalGeometries.has(window)) {
            let frame = window.get_frame_rect();
            this._originalGeometries.set(window, {
                x: frame.x,
                y: frame.y,
                width: frame.width,
                height: frame.height
            });
        }

        // Connect pointer-motion to track drag position
        this._motionId = global.stage.connect(
            'captured-event',
            Lang.bind(this, this._onCapturedEvent)
        );
    },

    /**
     * Called when a grab operation ends (window dropped).
     * Handles both Muffin signal signatures:
     *   Old (Cinnamon < 5.6): grab-op-end(display, screen, window, op)
     *   New (Cinnamon >= 5.6): grab-op-end(display, window, op)
     */
    _onGrabOpEnd: function(display, screenOrWindow, windowOrOp, opOrUndefined) {
        let window, op;
        if (opOrUndefined === undefined) {
            // New signature: (display, window, op)
            window = screenOrWindow;
            op = windowOrOp;
        } else {
            // Old signature: (display, screen, window, op)
            window = windowOrOp;
            op = opOrUndefined;
        }

        if (op !== Meta.GrabOp.MOVING) return;

        // Disconnect motion tracking
        if (this._motionId) {
            try { global.stage.disconnect(this._motionId); } catch (e) {}
            this._motionId = 0;
        }

        if (this._draggingWindow && this._settings.getValue('enable-tiling-system')) {
            // Check if modifier key is held
            let modifierKey = this._settings.getValue('tiling-modifier-key') || 'Control';
            if (this._isModifierPressed(modifierKey) && this._hoveredTileIndex >= 0) {
                let layout = this._layoutManager.loadLayout(this._currentLayoutId);
                if (layout && layout.tiles[this._hoveredTileIndex]) {
                    this._tileWindowToTile(
                        this._draggingWindow,
                        layout.tiles[this._hoveredTileIndex]
                    );
                }
            }
        }

        this._draggingWindow = null;
        this._hoveredTileIndex = -1;
        this.hideTilingOverlay();
    },

    /**
     * Track pointer movement during a window drag.
     */
    _onCapturedEvent: function(actor, event) {
        if (event.type() !== Clutter.EventType.MOTION) return Clutter.EVENT_PROPAGATE;
        if (!this._draggingWindow) return Clutter.EVENT_PROPAGATE;

        let modifierKey = this._settings.getValue('tiling-modifier-key') || 'Control';
        if (this._isModifierPressed(modifierKey)) {
            this.showTilingOverlay();
            let [x, y] = event.get_coords();
            this._updateHoveredTile(x, y);
        } else {
            this.hideTilingOverlay();
        }

        return Clutter.EVENT_PROPAGATE;
    },

    /**
     * Check if the configured modifier key is currently held.
     * Delegates to Utils.isModifierPressed for a single implementation.
     * @param {string} modifierName
     * @returns {boolean}
     */
    _isModifierPressed: function(modifierName) {
        return Utils.isModifierPressed(modifierName);
    },

    /**
     * Display tile zone overlay widgets on screen.
     */
    showTilingOverlay: function() {
        if (this._overlayActors.length > 0) return; // Already showing

        let layout = this._layoutManager.loadLayout(this._currentLayoutId);
        if (!layout) return;

        let gapsSize = this._settings.getValue('gaps-size') || 0;

        layout.tiles.forEach(Lang.bind(this, function(tile, index) {
            let geom = this._layoutManager.calculateTileGeometry(
                tile, this.workArea, gapsSize
            );

            let actor = new St.Widget({
                style_class: 'tiling-overlay',
                x: geom.x,
                y: geom.y,
                width: geom.width,
                height: geom.height,
                reactive: false
            });

            Main.uiGroup.add_actor(actor);
            this._overlayActors.push(actor);
        }));
    },

    /**
     * Remove all tile zone overlay widgets from screen.
     */
    hideTilingOverlay: function() {
        this._overlayActors.forEach(function(actor) {
            try {
                Main.uiGroup.remove_actor(actor);
                actor.destroy();
            } catch (e) {}
        });
        this._overlayActors = [];
        this._hoveredTileIndex = -1;
    },

    /**
     * Highlight the tile zone under the pointer and unhighlight others.
     * @param {number} x - Pointer X.
     * @param {number} y - Pointer Y.
     */
    _updateHoveredTile: function(x, y) {
        let newIndex = this._getHoveredTileIndex(x, y);
        if (newIndex === this._hoveredTileIndex) return;

        this._hoveredTileIndex = newIndex;
        this._overlayActors.forEach(function(actor, i) {
            if (i === newIndex) {
                actor.add_style_class_name('tiling-overlay-hover');
            } else {
                actor.remove_style_class_name('tiling-overlay-hover');
            }
        });
    },

    /**
     * Find which tile zone index contains the given pointer coordinates.
     * @param {number} x
     * @param {number} y
     * @returns {number} Index into the layout's tiles array, or -1.
     */
    _getHoveredTileIndex: function(x, y) {
        let layout = this._layoutManager.loadLayout(this._currentLayoutId);
        if (!layout) return -1;

        let gapsSize = this._settings.getValue('gaps-size') || 0;

        for (let i = 0; i < layout.tiles.length; i++) {
            let geom = this._layoutManager.calculateTileGeometry(
                layout.tiles[i], this.workArea, gapsSize
            );
            if (x >= geom.x && x <= geom.x + geom.width &&
                y >= geom.y && y <= geom.y + geom.height) {
                return i;
            }
        }
        return -1;
    },

    /**
     * Move and resize a window to fill a tile zone.
     * @param {Meta.Window} window
     * @param {{x, y, width, height}} tile - Relative tile definition.
     */
    _tileWindowToTile: function(window, tile) {
        try {
            let gapsSize = this._settings.getValue('gaps-size') || 0;
            let geom = this._layoutManager.calculateTileGeometry(
                tile, this.workArea, gapsSize
            );

            // Unmaximize if needed before moving
            if (window.get_maximized()) {
                window.unmaximize(Meta.MaximizeFlags.BOTH);
            }

            window.move_resize_frame(true, geom.x, geom.y, geom.width, geom.height);

            // Record tile assignment
            if (this._windowTracker) {
                this._windowTracker.setTiledWindow(window, tile);
            }
        } catch (e) {
            global.logError('TilingShell: Error tiling window: ' + e.message);
        }
    },

    /**
     * Tile a window by cardinal direction (used by keyboard shortcuts).
     * Maps direction to a layout tile slot.
     * @param {Meta.Window} window
     * @param {string} direction - 'left', 'right', 'up', or 'down'.
     */
    tileWindowToDirection: function(window, direction) {
        if (!window) return;

        let workArea = this.workArea;
        let gapsSize = this._settings.getValue('gaps-size') || 0;
        let geom;

        switch (direction) {
            case 'left':
                geom = {
                    x: workArea.x + gapsSize,
                    y: workArea.y + gapsSize,
                    width: Math.floor(workArea.width / 2) - gapsSize * 2,
                    height: workArea.height - gapsSize * 2
                };
                break;
            case 'right':
                geom = {
                    x: workArea.x + Math.floor(workArea.width / 2) + gapsSize,
                    y: workArea.y + gapsSize,
                    width: Math.floor(workArea.width / 2) - gapsSize * 2,
                    height: workArea.height - gapsSize * 2
                };
                break;
            case 'up':
                // Tile up = maximize
                if (window.get_maximized()) return;
                window.maximize(Meta.MaximizeFlags.BOTH);
                return;
            case 'down':
                geom = {
                    x: workArea.x + gapsSize,
                    y: workArea.y + Math.floor(workArea.height / 2) + gapsSize,
                    width: workArea.width - gapsSize * 2,
                    height: Math.floor(workArea.height / 2) - gapsSize * 2
                };
                break;
            default:
                return;
        }

        try {
            if (window.get_maximized()) {
                window.unmaximize(Meta.MaximizeFlags.BOTH);
            }
            window.move_resize_frame(true, geom.x, geom.y, geom.width, geom.height);

            if (this._windowTracker) {
                this._windowTracker.setTiledWindow(window, geom);
            }
        } catch (e) {
            global.logError('TilingShell: Error tiling window by direction: ' + e.message);
        }
    },

    /**
     * Restore a window to its pre-tiling geometry.
     * @param {Meta.Window} window
     */
    untileWindow: function(window) {
        if (!window) return;

        try {
            let original = this._originalGeometries.get(window);
            if (original) {
                if (window.get_maximized()) {
                    window.unmaximize(Meta.MaximizeFlags.BOTH);
                }
                window.move_resize_frame(
                    true,
                    original.x, original.y,
                    original.width, original.height
                );
                this._originalGeometries.delete(window);
            }

            if (this._windowTracker) {
                this._windowTracker.removeTiledWindow(window);
            }
        } catch (e) {
            global.logError('TilingShell: Error untiling window: ' + e.message);
        }
    },

    /**
     * Switch to the next available layout in the cycle.
     */
    cycleLayout: function() {
        let layouts = this._layoutManager.getAvailableLayouts();
        let ids = layouts.map(function(l) { return l.id; });
        let currentIndex = ids.indexOf(this._currentLayoutId);
        let nextIndex = (currentIndex + 1) % ids.length;
        this._currentLayoutId = ids[nextIndex];
    },

    /**
     * Set the active layout by ID.
     * @param {string} layoutId
     */
    setLayout: function(layoutId) {
        if (this._layoutManager.getLayout(layoutId)) {
            this._currentLayoutId = layoutId;
        }
    },

    /**
     * Update the work area (called on monitor geometry changes).
     * @param {{x, y, width, height}} workArea
     */
    updateWorkArea: function(workArea) {
        this.workArea = workArea;
    },

    /**
     * Disconnect all signals, remove overlay, clean up resources.
     */
    destroy: function() {
        // Disconnect motion signal if active
        if (this._motionId) {
            try { global.stage.disconnect(this._motionId); } catch (e) {}
            this._motionId = 0;
        }

        // Disconnect display signals
        this._signals.forEach(function(sig) {
            try { sig.obj.disconnect(sig.id); } catch (e) {}
        });
        this._signals = [];

        // Remove overlay
        this.hideTilingOverlay();

        this._draggingWindow = null;
        this._originalGeometries.clear();
    }
};

// windowTracker.js - Window tracking for Tiling Shell
// Monitors window lifecycle events and maintains tiling state per window.

const Meta = imports.gi.Meta;
const Lang = imports.lang;
const Utils = imports.utils;

/**
 * WindowTracker - Tracks windows and their tile assignments.
 */
function WindowTracker() {
    this._init();
}

WindowTracker.prototype = {
    _init: function() {
        // Map of Meta.Window -> tile assignment object
        this._windows = new Map();
        this._signals = [];
        this._windowSignals = new Map(); // Map of window -> [signal IDs]
    },

    /**
     * Enable tracking: connect to window-created and track existing windows.
     */
    enable: function() {
        // Track window creation
        let id = global.display.connect(
            'window-created',
            Lang.bind(this, this._onWindowCreated)
        );
        this._signals.push({ obj: global.display, id: id });

        // Track existing windows on enable
        this._trackExistingWindows();
    },

    /**
     * Track all windows already present when the extension is enabled.
     */
    _trackExistingWindows: function() {
        let workspace = global.workspace_manager.get_active_workspace();
        let windows = workspace.list_windows();
        windows.forEach(Lang.bind(this, function(win) {
            if (this._isWindowTileable(win)) {
                this._trackWindow(win);
            }
        }));
    },

    /**
     * Called when a new window is created.
     * @param {Meta.Display} display
     * @param {Meta.Window} window
     */
    _onWindowCreated: function(display, window) {
        if (!this._isWindowTileable(window)) return;
        this._trackWindow(window);
    },

    /**
     * Start tracking a specific window, listening for its destroy event.
     * @param {Meta.Window} window
     */
    _trackWindow: function(window) {
        if (this._windows.has(window)) return;

        // Initialize with no tile assignment
        this._windows.set(window, null);

        // Listen for window destruction to clean up
        let destroyId = window.connect(
            'unmanaged',
            Lang.bind(this, function(win) {
                this._onWindowDestroyed(win);
            })
        );
        this._windowSignals.set(window, [destroyId]);
    },

    /**
     * Called when a tracked window is destroyed/unmanaged.
     * @param {Meta.Window} window
     */
    _onWindowDestroyed: function(window) {
        this._cleanupWindow(window);
    },

    /**
     * Remove all tracking for a window.
     * @param {Meta.Window} window
     */
    _cleanupWindow: function(window) {
        // Disconnect window-level signals
        let sigs = this._windowSignals.get(window);
        if (sigs) {
            sigs.forEach(function(id) {
                try { window.disconnect(id); } catch (e) {}
            });
            this._windowSignals.delete(window);
        }
        this._windows.delete(window);
    },

    /**
     * Determine if a window is eligible for tiling.
     * Delegates to Utils.isWindowTileable for a single implementation.
     * @param {Meta.Window} window
     * @returns {boolean}
     */
    _isWindowTileable: function(window) {
        return Utils.isWindowTileable(window);
    },

    /**
     * Get the tile assignment for a window (null if not tiled).
     * @param {Meta.Window} window
     * @returns {Object|null}
     */
    getTiledWindow: function(window) {
        return this._windows.get(window) || null;
    },

    /**
     * Record that a window has been assigned to a tile.
     * @param {Meta.Window} window
     * @param {Object} tile - The tile object assigned to this window.
     */
    setTiledWindow: function(window, tile) {
        if (!this._windows.has(window)) {
            this._trackWindow(window);
        }
        this._windows.set(window, tile);
    },

    /**
     * Remove the tile assignment for a window (untile it).
     * @param {Meta.Window} window
     */
    removeTiledWindow: function(window) {
        if (this._windows.has(window)) {
            this._windows.set(window, null);
        }
    },

    /**
     * Check whether a window is currently tiled.
     * @param {Meta.Window} window
     * @returns {boolean}
     */
    isWindowTiled: function(window) {
        return this._windows.has(window) && this._windows.get(window) !== null;
    },

    /**
     * Get all currently tiled windows.
     * @returns {Meta.Window[]}
     */
    getTiledWindows: function() {
        let result = [];
        this._windows.forEach(function(tile, win) {
            if (tile !== null) result.push(win);
        });
        return result;
    },

    /**
     * Disable tracking: disconnect all signals and clear state.
     */
    destroy: function() {
        // Disconnect window-level signals
        this._windowSignals.forEach(function(sigs, win) {
            sigs.forEach(function(id) {
                try { win.disconnect(id); } catch (e) {}
            });
        });
        this._windowSignals.clear();

        // Disconnect display-level signals
        this._signals.forEach(function(sig) {
            try { sig.obj.disconnect(sig.id); } catch (e) {}
        });
        this._signals = [];

        this._windows.clear();
    }
};

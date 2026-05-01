// keybindings.js - Keyboard shortcuts handler for Tiling Shell
// Manages hotkey registration and dispatches tiling actions.

const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Lang = imports.lang;

/**
 * KeybindingsManager - Registers and removes keyboard shortcuts.
 * @param {Object} settings - SettingsManager instance.
 * @param {Object} tilingManager - TilingManager instance (for tiling actions).
 */
function KeybindingsManager(settings, tilingManager) {
    this._init(settings, tilingManager);
}

KeybindingsManager.prototype = {
    _init: function(settings, tilingManager) {
        this._settings = settings;
        this._tilingManager = tilingManager;
        this._keybindings = [];
    },

    /**
     * Register all keyboard shortcuts.
     *
     * Bindings are read from the extension settings so the user can customise
     * them via System Settings → Extensions → Tiling Shell → Configure.
     *
     * Default values use <Super><Alt>Arrow which do NOT conflict with
     * Cinnamon's built-in workspace-management shortcuts
     * (<Super><Shift>Arrow = move window to adjacent workspace).
     */
    enable: function() {
        // Helper: settings may store a keybinding as a plain string or as a
        // JSON array (Cinnamon 6.x wraps single keybindings in an array).
        // Normalise to a plain string in either case.
        let s = this._settings;
        function kb(key, fallback) {
            let v = s.getValue(key);
            if (!v) return fallback;
            if (Array.isArray(v)) return v[0] || fallback;
            return String(v) || fallback;
        }

        this._addKeybinding('tile-left',
            kb('keybinding-tile-left',   '<Super><Alt>Left'),
            Lang.bind(this, this._onTileLeft));

        this._addKeybinding('tile-right',
            kb('keybinding-tile-right',  '<Super><Alt>Right'),
            Lang.bind(this, this._onTileRight));

        this._addKeybinding('tile-up',
            kb('keybinding-tile-up',     '<Super><Alt>Up'),
            Lang.bind(this, this._onTileUp));

        this._addKeybinding('tile-down',
            kb('keybinding-tile-down',   '<Super><Alt>Down'),
            Lang.bind(this, this._onTileDown));

        this._addKeybinding('untile-window',
            kb('keybinding-untile',      '<Super>m'),
            Lang.bind(this, this._onUntile));

        this._addKeybinding('cycle-layout',
            kb('keybinding-cycle-layout','<Super><Alt>c'),
            Lang.bind(this, this._onCycleLayout));
    },

    /**
     * Register a single hotkey.
     * @param {string} name - Unique hotkey name.
     * @param {string} binding - Key combination string (e.g. '<Super>Left').
     * @param {Function} callback - Handler function.
     */
    _addKeybinding: function(name, binding, callback) {
        try {
            let ok = Main.keybindingManager.addHotKey(name, binding, callback);
            if (ok === false) {
                global.logError('TilingShell: Keybinding conflict – could not register "'
                    + name + '" (' + binding + '). Change it in the extension settings.');
                return;
            }
            this._keybindings.push(name);
        } catch (e) {
            global.logError('TilingShell: Failed to add keybinding ' + name + ': ' + e.message);
        }
    },

    /**
     * Tile the focused window to the left half.
     */
    _onTileLeft: function() {
        let window = global.display.focus_window;
        if (!window) return;
        if (this._tilingManager) {
            this._tilingManager.tileWindowToDirection(window, 'left');
        }
    },

    /**
     * Tile the focused window to the right half.
     */
    _onTileRight: function() {
        let window = global.display.focus_window;
        if (!window) return;
        if (this._tilingManager) {
            this._tilingManager.tileWindowToDirection(window, 'right');
        }
    },

    /**
     * Maximize (tile to full screen) the focused window.
     */
    _onTileUp: function() {
        let window = global.display.focus_window;
        if (!window) return;
        if (this._tilingManager) {
            this._tilingManager.tileWindowToDirection(window, 'up');
        }
    },

    /**
     * Tile the focused window to the bottom half.
     */
    _onTileDown: function() {
        let window = global.display.focus_window;
        if (!window) return;
        if (this._tilingManager) {
            this._tilingManager.tileWindowToDirection(window, 'down');
        }
    },

    /**
     * Untile (restore) the focused window.
     */
    _onUntile: function() {
        let window = global.display.focus_window;
        if (!window) return;
        if (this._tilingManager) {
            this._tilingManager.untileWindow(window);
        }
    },

    /**
     * Cycle to the next available layout.
     */
    _onCycleLayout: function() {
        if (this._tilingManager) {
            this._tilingManager.cycleLayout();
        }
    },

    /**
     * Remove all registered keyboard shortcuts.
     */
    destroy: function() {
        this._keybindings.forEach(function(name) {
            try {
                Main.keybindingManager.removeHotKey(name);
            } catch (e) {
                global.logError('TilingShell: Failed to remove keybinding ' + name + ': ' + e.message);
            }
        });
        this._keybindings = [];
    }
};

// utils.js - Utility functions for Tiling Shell
// Provides common helper functions used across all modules

const Meta = imports.gi.Meta;

/**
 * Get all monitors currently connected.
 * @returns {Array} Array of monitor objects with index and geometry.
 */
function getMonitors() {
    let monitors = [];
    for (let i = 0; i < global.display.get_n_monitors(); i++) {
        monitors.push({
            index: i,
            geometry: global.display.get_monitor_geometry(i)
        });
    }
    return monitors;
}

/**
 * Get primary monitor index.
 * @returns {number} Primary monitor index.
 */
function getPrimaryMonitor() {
    return global.display.get_primary_monitor();
}

/**
 * Get the work area (excluding panels) for a given monitor and workspace.
 * @param {number} monitorIndex - The monitor index.
 * @param {Meta.Workspace} workspace - The workspace.
 * @returns {Meta.Rectangle} Work area rectangle.
 */
function getWorkArea(monitorIndex, workspace) {
    if (!workspace) {
        let workspaceManager = global.workspace_manager || global.screen;
        workspace = workspaceManager.get_active_workspace();
    }
    return workspace.get_work_area_for_monitor(monitorIndex);
}

/**
 * Get all normal, tileable windows on the active workspace.
 * @returns {Meta.Window[]} Array of tileable windows.
 */
function getActiveWindows() {
    let workspaceManager = global.workspace_manager || global.screen;
    let workspace = workspaceManager.get_active_workspace();
    return workspace.list_windows().filter(function(w) {
        return isWindowTileable(w);
    });
}

/**
 * Determine if a window can be tiled (normal, non-dialog, non-skip).
 * @param {Meta.Window} window - The window to check.
 * @returns {boolean} True if the window is tileable.
 */
function isWindowTileable(window) {
    if (!window) return false;
    return window.get_window_type() === Meta.WindowType.NORMAL &&
           !window.is_skip_taskbar() &&
           !window.is_attached_dialog();
}

/**
 * Check whether a given keyboard modifier is currently pressed.
 * @param {string} modifierName - Modifier name: "Control", "Alt", or "Shift".
 * @returns {boolean} True if the modifier is held.
 */
function isModifierPressed(modifierName) {
    let [,, state] = global.get_pointer();
    switch (modifierName) {
        case 'Control':
            return (state & imports.gi.Clutter.ModifierType.CONTROL_MASK) !== 0;
        case 'Alt':
            return (state & imports.gi.Clutter.ModifierType.MOD1_MASK) !== 0;
        case 'Shift':
            return (state & imports.gi.Clutter.ModifierType.SHIFT_MASK) !== 0;
        default:
            return false;
    }
}

/**
 * Get the currently focused window, if any.
 * @returns {Meta.Window|null} The focused window.
 */
function getFocusedWindow() {
    return global.display.focus_window;
}

/**
 * Safely disconnect a signal, ignoring errors if the object is already destroyed.
 * @param {Object} obj - The GObject to disconnect from.
 * @param {number} id - The signal handler ID.
 */
function safeDisconnect(obj, id) {
    try {
        if (obj && id > 0) {
            obj.disconnect(id);
        }
    } catch (e) {
        // Ignore disconnect errors on destroyed objects
    }
}

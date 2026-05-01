// extension.js - Main entry point for Tiling Shell Cinnamon extension
// Coordinates all sub-components: settings, tiling manager, keybindings, etc.

const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Lang = imports.lang;

// Sub-module references – populated in init() once the search path is set up.
let SettingsManager      = null;
let LayoutManager        = null;
let WindowTracker        = null;
let TilingManager        = null;
let KeybindingsManager   = null;
let SnapAssistant        = null;

let settingsInstance      = null;
let layoutManagerInstance = null;
let windowTrackerInstance = null;
let tilingManagers        = [];     // One per monitor
let keybindingsInstance   = null;
let snapAssistantInstance = null;
let monitorSignalId       = 0;

/**
 * init() is called once when Cinnamon loads the extension.
 * Add the extension directory to the GJS import search path so that
 * sub-modules (settings.js, tilingManager.js, …) are importable.
 *
 * @param {Object} metadata - Extension metadata from metadata.json.
 */
function init(metadata) {
    // Make extension sub-files importable via e.g. imports.settings
    let extensionPath = metadata.path;
    if (imports.searchPath.indexOf(extensionPath) === -1) {
        imports.searchPath.unshift(extensionPath);
    }

    // Load sub-modules now that the path is set up.
    SettingsManager    = imports.settings.SettingsManager;
    LayoutManager      = imports.layoutManager.LayoutManager;
    WindowTracker      = imports.windowTracker.WindowTracker;
    TilingManager      = imports.tilingManager.TilingManager;
    KeybindingsManager = imports.keybindings.KeybindingsManager;
    SnapAssistant      = imports.snapAssistant.SnapAssistant;
}

/**
 * enable() is called when the user activates the extension.
 * Set up all components and connect signals.
 */
function enable() {
    try {
        // Settings
        settingsInstance = new SettingsManager('tilingshell@iw4eiy.org');
        settingsInstance.bindProperty('enable-tiling-system',  'enableTilingSystem',  _onSettingChanged);
        settingsInstance.bindProperty('tiling-modifier-key',   'tilingModifierKey',   _onSettingChanged);
        settingsInstance.bindProperty('enable-snap-assistant', 'enableSnapAssistant', _onSettingChanged);
        settingsInstance.bindProperty('selected-layout',       'selectedLayout',      _onLayoutChanged);
        settingsInstance.bindProperty('gaps-size',             'gapsSize',            _onSettingChanged);

        // Layout manager
        layoutManagerInstance = new LayoutManager();

        // Window tracker
        windowTrackerInstance = new WindowTracker();
        windowTrackerInstance.enable();

        // Snap assistant (Phase 2 stub)
        snapAssistantInstance = new SnapAssistant();
        if (settingsInstance.getValue('enable-snap-assistant')) {
            snapAssistantInstance.enable();
        }

        // Create a TilingManager for each monitor
        _createTilingManagers();

        // Keyboard shortcuts (pass first tiling manager for actions)
        keybindingsInstance = new KeybindingsManager(
            settingsInstance,
            tilingManagers[0] || null
        );
        keybindingsInstance.enable();

        // Watch for monitor configuration changes
        monitorSignalId = global.screen.connect(
            'monitors-changed',
            _onMonitorsChanged
        );

    } catch (e) {
        global.logError('TilingShell: Failed to enable: ' + e.message);
    }
}

/**
 * disable() is called when the user deactivates the extension or Cinnamon exits.
 * Clean up everything to avoid leaks.
 */
function disable() {
    try {
        // Disconnect monitor-change signal
        if (monitorSignalId && global.screen) {
            try { global.screen.disconnect(monitorSignalId); } catch (e) {}
            monitorSignalId = 0;
        }

        // Destroy keybindings
        if (keybindingsInstance) {
            keybindingsInstance.destroy();
            keybindingsInstance = null;
        }

        // Destroy snap assistant
        if (snapAssistantInstance) {
            snapAssistantInstance.destroy();
            snapAssistantInstance = null;
        }

        // Destroy tiling managers
        tilingManagers.forEach(function(tm) {
            try { tm.destroy(); } catch (e) {}
        });
        tilingManagers = [];

        // Destroy window tracker
        if (windowTrackerInstance) {
            windowTrackerInstance.destroy();
            windowTrackerInstance = null;
        }

        // Destroy layout manager
        layoutManagerInstance = null;

        // Finalize settings
        if (settingsInstance) {
            settingsInstance.destroy();
            settingsInstance = null;
        }

    } catch (e) {
        global.logError('TilingShell: Error during disable: ' + e.message);
    }
}

/**
 * Create (or recreate) a TilingManager for every connected monitor.
 */
function _createTilingManagers() {
    // Destroy any existing managers
    tilingManagers.forEach(function(tm) {
        try { tm.destroy(); } catch (e) {}
    });
    tilingManagers = [];

    // Support both modern (5.4+) and older Cinnamon APIs
    let workspaceManager = global.workspace_manager || global.screen;
    let workspace = workspaceManager.get_active_workspace();
    let nMonitors = global.display.get_n_monitors();

    for (let i = 0; i < nMonitors; i++) {
        let workArea = workspace.get_work_area_for_monitor(i);
        let tm = new TilingManager(
            i,
            { x: workArea.x, y: workArea.y, width: workArea.width, height: workArea.height },
            layoutManagerInstance,
            windowTrackerInstance,
            settingsInstance
        );

        // Apply the initially selected layout
        let selectedLayout = settingsInstance.getValue('selected-layout') || '2-columns';
        tm.setLayout(selectedLayout);

        tm.enable();
        tilingManagers.push(tm);
    }

    // Update keybindings with the primary tiling manager
    if (keybindingsInstance && tilingManagers[0]) {
        keybindingsInstance._tilingManager = tilingManagers[0];
    }
}

/**
 * Called when monitor configuration changes; rebuilds tiling managers.
 */
function _onMonitorsChanged() {
    _createTilingManagers();
}

/**
 * Called when a general setting changes; propagate to tiling managers.
 */
function _onSettingChanged() {
    // Snap assistant enable/disable
    if (snapAssistantInstance) {
        let enableSnap = settingsInstance.getValue('enable-snap-assistant');
        if (enableSnap) {
            snapAssistantInstance.enable();
        } else {
            snapAssistantInstance.hide();
        }
    }
}

/**
 * Called when the selected layout setting changes.
 */
function _onLayoutChanged() {
    let layoutId = settingsInstance.getValue('selected-layout') || '2-columns';
    tilingManagers.forEach(function(tm) {
        tm.setLayout(layoutId);
    });
}

// settings.js - Settings management wrapper for Tiling Shell
// Wraps Cinnamon's ExtensionSettings for easy property binding and access.

const CinnamonSettings = imports.ui.settings;

/**
 * SettingsManager - Thin wrapper around Cinnamon ExtensionSettings.
 * @param {string} uuid - The extension UUID.
 */
function SettingsManager(uuid) {
    this._init(uuid);
}

SettingsManager.prototype = {
    _init: function(uuid) {
        this._uuid = uuid;
        // ExtensionSettings requires an object to bind properties to.
        // We use this manager itself as the target object.
        this._settings = new CinnamonSettings.ExtensionSettings(this, uuid);
        this._boundProperties = {};
    },

    /**
     * Bind a settings key to a property on this object, with an optional
     * change callback. Uses one-way binding (settings → property).
     *
     * @param {string} key - Settings key as defined in settings-schema.json.
     * @param {string} property - Property name to set on this object.
     * @param {Function} [callback] - Optional function called when value changes.
     */
    bindProperty: function(key, property, callback) {
        this._settings.bindProperty(
            CinnamonSettings.BindingDirection.IN,
            key,
            property,
            callback || function() {},
            null
        );
        this._boundProperties[key] = property;
    },

    /**
     * Retrieve the current value of a settings key.
     * @param {string} key - Settings key.
     * @returns {*} The current value.
     */
    getValue: function(key) {
        return this._settings.getValue(key);
    },

    /**
     * Persist a new value for a settings key.
     * @param {string} key - Settings key.
     * @param {*} value - New value to store.
     */
    setValue: function(key, value) {
        this._settings.setValue(key, value);
    },

    /**
     * Release all settings bindings.
     */
    destroy: function() {
        try {
            this._settings.finalize();
        } catch (e) {
            // Ignore errors during finalize
        }
    }
};

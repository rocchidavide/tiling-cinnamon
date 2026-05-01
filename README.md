# Tiling Shell for Cinnamon

Advanced tiling window management for Cinnamon Desktop, ported from the GNOME Shell extension [TilingShell](https://github.com/domferr/tilingshell).

## Features (Planned)

- 🪟 **Advanced Tiling System**: Tile windows in customizable layouts (similar to Windows PowerToys FancyZones)
- 🎯 **Snap Assistant**: Windows 11-style snap assistant for quick window placement
- 🖥️ **Multi-monitor Support**: Independent layouts for each monitor
- ⌨️ **Keyboard Shortcuts**: Move and tile windows using keyboard
- 🎨 **Custom Layouts**: Create and save your own tiling layouts
- 🔄 **Layout Switching**: Quickly switch between different layouts
- ✨ **Window Border Highlighting**: Visual feedback for tiled windows

## Installation

```bash
# Clone the repository anywhere you like (e.g. your home directory)
git clone https://github.com/rocchidavide/tiling-cinnamon.git ~/tiling-cinnamon

# Symlink the extension subdirectory into Cinnamon's extensions folder
# (the symlink name MUST match the UUID exactly)
mkdir -p ~/.local/share/cinnamon/extensions/
ln -sf ~/tiling-cinnamon/tilingshell@iw4eiy.org \
       ~/.local/share/cinnamon/extensions/tilingshell@iw4eiy.org

# Restart Cinnamon  (press Alt+F2, type 'r', press Enter – or log out/in)
cinnamon --replace &

# Enable the extension
# System Settings → Extensions → Tiling Shell
```

> **Why a symlink?**  The repository root contains both the extension folder
> (`tilingshell@iw4eiy.org/`) and other files (README, .git, …).  Cinnamon
> requires that `extension.js` lives *directly* inside the UUID-named
> directory, so the symlink points at the inner folder, not the repo root.

## Development Status

🚧 **Work in Progress** - This extension is currently under active development.

### Roadmap

- [ ] Phase 1: Core tiling system
  - [ ] Basic window tracking
  - [ ] Tiling overlay display
  - [ ] Drag & drop tiling
  - [ ] Simple layouts (2-column, 3-column, grid)
  - [ ] Keyboard shortcuts
- [ ] Phase 2: Enhanced features
  - [ ] Snap Assistant UI
  - [ ] Panel indicator
  - [ ] Multi-monitor support
  - [ ] Window border highlighting
- [ ] Phase 3: Advanced features
  - [ ] Layout editor
  - [ ] Custom layout import/export
  - [ ] Per-workspace layouts

## Usage

### Tiling Windows

1. Hold `Ctrl` while dragging a window (configurable)
2. Tiling zones will appear
3. Drop the window in a zone to tile it

### Keyboard Shortcuts

Default shortcuts use `Super+Alt+Arrow` — these do **not** conflict with
Cinnamon's built-in workspace-management shortcuts (`Super+Shift+Arrow`).
All shortcuts can be changed in **System Settings → Extensions → Tiling Shell → Configure**.

| Shortcut | Action |
|----------|--------|
| `Super + Alt + ←` | Tile window to left half |
| `Super + Alt + →` | Tile window to right half |
| `Super + Alt + ↑` | Maximize window |
| `Super + Alt + ↓` | Tile window to bottom half |
| `Super + M` | Restore / untile window |
| `Super + Alt + C` | Cycle to next layout |

## Configuration

Access settings through:
- System Settings → Extensions → Tiling Shell → Configure

## Credits

- Original GNOME extension by [Domenico Ferraro](https://github.com/domferr/tilingshell)
- Ported to Cinnamon by the community

## License

GPL-3.0 (same as original project)

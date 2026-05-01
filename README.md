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
# Clone to Cinnamon extensions directory
cd ~/.local/share/cinnamon/extensions/
git clone https://github.com/rocchidavide/tiling-cinnamon.git tilingshell@iw4eiy.org

# Restart Cinnamon
cinnamon --replace &

# Enable the extension
# System Settings → Extensions → Tiling Shell
```

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

> **Nota**: `Super+Freccia` è riservato da Cinnamon per il suo snap nativo, quindi questa estensione usa `Super+Shift+Freccia`.

| Scorciatoia | Azione |
|-------------|--------|
| `Super + Shift + ←` | Finestra a sinistra (metà schermo) |
| `Super + Shift + →` | Finestra a destra (metà schermo) |
| `Super + Shift + ↑` | Massimizza finestra |
| `Super + Shift + ↓` | Finestra in basso (metà schermo) |
| `Super + M` | Ripristina / rimuovi tiling |
| `Super + Shift + Tab` | Cicla tra i layout |

## Configuration

Access settings through:
- System Settings → Extensions → Tiling Shell → Configure

## Credits

- Original GNOME extension by [Domenico Ferraro](https://github.com/domferr/tilingshell)
- Ported to Cinnamon by the community

## License

GPL-3.0 (same as original project)

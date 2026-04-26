# Navigate Headings in Files Explorer

A powerful Obsidian plugin that transforms your file explorer into an intelligent heading navigator. Expand any markdown file directly in the explorer to see and navigate its entire heading structure — no tab switching required.

## Why You Need This

Obsidian's native outline panel shows headings for the current file only. If you're browsing multiple documents or need to jump between files and their sections, you have to:

1. Click a file to open it
2. Check the outline panel
3. Click back to the file explorer
4. Repeat

**Navigate Headings in Files Explorer** eliminates this friction. Click any file in the explorer to instantly see all its headings arranged in a collapsible tree. Navigate to any section without leaving the explorer.

## Features

### 🌳 Heading Tree in the Explorer
Click any file to expand it and see a complete, hierarchical view of all its headings. The tree respects your heading structure (H1 → H2 → H3, etc.) and nests perfectly under parent headings.

### 🎯 One-Click Navigation  
Click any heading to jump directly to it in the editor. The document opens and scrolls to the exact section. Click the same heading again to collapse/expand its sub-headings.

### 🔍 Active Position Highlight
As you scroll through your document, the explorer automatically highlights which heading you're reading. The highlight updates in real-time as you scroll or navigate. Perfect for staying oriented in long documents.

### ⚙️ Full Control Over What You See
- **Show headings up to:** Choose whether to display all heading levels (H1–H6) or limit to a shallower depth (H1–H3, etc.)
- **Auto-expand down to:** When you open a file's heading panel, decide which levels expand automatically:
  - **Nothing** — Don't auto-open the panel; you click to expand manually
  - **H1** — Show only top-level headings; click H1s to reveal their children
  - **H2** — Show H1 and H2 headings by default; deeper levels require clicking
  - And so on...

### 💫 Smooth Animations
Headings expand and collapse with fluid CSS animations. No jarring jumps—everything feels responsive and polished.

### 📏 Indent Guides
Vertical lines connect parent headings to their children, making the hierarchy instantly clear at a glance (always enabled for clarity).

### 🎨 Matches Obsidian's Style
Uses Obsidian's native collapse icons and styling. The plugin integrates seamlessly into the explorer UI—it looks like it was always part of Obsidian. Compatible with icon plugins like Iconic.

## Installation

### From Obsidian Community Plugins (Recommended)
1. Open Obsidian → Settings → Community Plugins
2. Click "Browse" and search for **Navigate Headings in Files Explorer**
3. Click "Install" and then "Enable"

### Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/yourusername/navigate-headings-in-files-explorer/releases)
2. Extract the folder to `.obsidian/plugins/` in your vault
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

## How to Use

### Expanding a File
Click any markdown file in the file explorer to expand it and reveal its headings:

```
📁 My Vault
  📄 Project Notes ▾
    H1 Introduction
    H1 Requirements
      H2 Functional
      H2 Non-Functional
    H1 Timeline
      H2 Phase 1
      H2 Phase 2
```

### Navigating to a Heading
Click any heading in the tree to:
1. Open the file (if it's not already open)
2. Scroll directly to that heading
3. Highlight it in the explorer

### Collapsing Sub-Headings
Click a heading that has children to toggle its sub-headings:
- **First click** → Hides all deeper levels
- **Click again** → Shows them again

### Collapsing the Entire File Panel
Click the file name in the explorer to collapse the entire heading tree.

## Settings Explained

### Highlight Active Heading
**Default:** Enabled

When enabled, the heading you're currently reading (based on scroll position) is highlighted in the explorer. As you scroll through your document, the highlight follows your position.

### Show Headings Up to
**Default:** H3  
**Options:** H1, H2, H3, H4, H5, H6

Controls which heading levels appear in the explorer. Choose H3 to show H1, H2, and H3 while hiding deeper levels.

### Auto-Expand Down to
**Default:** H2  
**Options:** Nothing, H1, H2, H3, H4, H5, H6

Controls what happens when you switch to a file:

| Setting | Behavior |
|---------|----------|
| **Nothing** | Panel doesn't auto-open. Click the file to expand manually. |
| **H1** | Panel opens showing only H1 headings. Click H1 to see children. |
| **H2** | Panel opens showing H1 and H2. H3+ require clicking. |
| **H3** | Panel opens showing H1, H2, H3. H4+ require clicking. |

## Examples

### Research Notes
**Setting:** Auto-expand to H2, show up to H4

See major sections (H1, H2) instantly without being overwhelmed by deep sub-sections.

### Book Outline
**Setting:** Auto-expand to H1, show up to H6

Chapters (H1) open automatically. Click to explore sections and subsections.

### Tutorial with Many Details
**Setting:** Auto-expand to Nothing, show up to H6

Manual control—expand only when needed to reduce visual clutter.

## Troubleshooting

### Headings don't appear
- File has no headings? Add them with `#`, `##`, etc.
- Not a markdown file? This plugin works with `.md` files only.
- Auto-expand set to "Nothing"? Click the file to manually expand.

### Too many headings showing
- Go to Settings and lower "Show headings up to".

### Active heading highlight isn't working
- Enable "Highlight active heading" in Settings.
- File must be open in the editor.

## Compatibility

- **Obsidian Version:** 1.0.0+
- **Platform:** Desktop (Mac, Windows, Linux)
- **Other Plugins:** Compatible with Iconic and similar icon plugins

## License

MIT License — See LICENSE file for details.

---

**Happy navigating!** 🗺️

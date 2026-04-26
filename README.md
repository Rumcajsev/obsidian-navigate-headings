# Headings in Explorer

An Obsidian plugin that expands markdown files in the file explorer to show their headings as a navigable tree.

## Features

- **Heading Tree Navigation** — Click any file in the explorer to expand it and see all its headings organized by hierarchy
- **Click to Toggle** — Click a heading to navigate to it, or click again to collapse/expand its children
- **Customizable Depth** — Choose which heading levels appear and which auto-expand when a file opens
- **Active Heading Highlight** — Scroll through your document and watch the explorer highlight your current position
- **Smooth Animations** — Headings expand and collapse with fluid CSS grid transitions
- **Indent Guides** — Visual lines connect parent headings to their children, like the folder structure above

## Settings

- **Highlight active heading** — Highlight which heading matches your scroll position
- **Show headings up to** — Control the deepest heading level shown (H1–H6)
- **Auto-expand down to** — Set which heading levels open automatically (Nothing, H1–H6)

## Installation

1. Open Obsidian Settings → Community Plugins
2. Click "Browse" and search for "Headings in Explorer"
3. Click "Install" and then "Enable"

Or clone this repo and build it yourself:

```bash
npm install
npm run dev
```

The plugin builds to `.obsidian/plugins/headings-in-explorer/main.js`.

## Compatibility

- Requires Obsidian 1.0.0+
- Desktop only
- Compatible with Iconic and similar icon plugins

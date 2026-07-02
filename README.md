<table>
  <tr>
    <td width="50%">
      <img src="docs/demo.gif" alt="Navigate Headings Demo" width="100%">
    </td>
    <td width="50%" valign="top" style="padding-left: 20px;">
      <h1>Navigate Headings</h1>
      <p style="font-size: 16px; line-height: 1.6;">
        See and jump between all your file headings directly in the explorer. No more switching tabs to check your document structure.
      </p>
      <h3>Why Use It</h3>
      <ul style="font-size: 14px;">
        <li>Navigate documents without leaving the file explorer</li>
        <li>Jump to any section with one click</li>
        <li>See your current position as you scroll</li>
        <li>Works with your existing Obsidian setup</li>
      </ul>
    </td>
  </tr>
</table>

## How to Use

- **Click a file title** — expands its headings automatically, down to the level set in *Auto-expand down to*. If that setting is *Nothing*, clicking the title just opens the file with no expansion.
- **Click the arrow** next to a file — always toggles the headings panel regardless of the auto-expand setting. Expands either all levels or just the top level depending on the *Arrow expands* setting.
- **Click a heading** — jumps to that section in the editor. If the heading has children, it also toggles them open/closed.

## Settings

| Setting | Default | Description |
|---|---|---|
| **Show headings up to** | H3 | The maximum heading depth shown in the explorer. Headings deeper than this are never displayed. |
| **Auto-expand down to** | H2 | How deep the panel opens when you click a file title or switch to a file. *Nothing* disables automatic expansion entirely — only the arrow will open the panel. |
| **Arrow expands** | All levels | Controls what happens when you click the arrow next to a file. *All levels* opens every heading at once. *Next level only* shows just the top-level headings and lets you expand deeper sections manually. |
| **Highlight active heading** | On | Highlights the heading in the explorer that matches your current scroll position in the editor. |

## Installation

Just get it from [official Obsidian plugin page](https://community.obsidian.md/plugins/navigate-headings)!

If you want to install manually:, then:
1. Download the latest release from [GitHub](https://github.com/Rumcajsev/obsidian-navigate-headings/releases)
2. Extract the folder into `.obsidian/plugins/` in your vault
3. Reload Obsidian (Cmd+R or restart)
4. Enable the plugin in Settings → Community Plugins

That's it! Enjoy navigating your documents.

import { App, Plugin, PluginSettingTab, Setting, TFile, MarkdownView, setIcon } from 'obsidian';

interface Heading {
  level: number;
  text: string;
  line: number;
}

interface HeadingNode {
  heading: Heading;
  children: HeadingNode[];
}

interface HeadingsInExplorerSettings {
  maxLevel: number;
  defaultOpenLevel: number;
  highlightActive: boolean;
}

const DEFAULT_SETTINGS: HeadingsInExplorerSettings = {
  maxLevel: 3,
  defaultOpenLevel: 2,
  highlightActive: true,
};

export default class HeadingsInExplorerPlugin extends Plugin {
  settings: HeadingsInExplorerSettings;
  private observer: MutationObserver | null = null;
  private autoExpandedPath: string | null = null;
  private modifyTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private activeHighlight: HTMLElement | null = null;
  private trackingCleanup: (() => void) | null = null;
  private trackedFilePath: string | null = null;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new HeadingsInExplorerSettingTab(this.app, this));

    this.app.workspace.onLayoutReady(() => this.initExplorer());
    this.registerEvent(this.app.workspace.on('layout-change', () => this.initExplorer()));
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.onActiveLeafChange()));
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile && file.extension === 'md') this.onFileModified(file);
      })
    );
    this.registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        if (file.extension === 'md') this.refreshFileArrow(file);
      })
    );
  }

  private initExplorer() {
    const leaf = this.app.workspace.getLeavesOfType('file-explorer')[0];
    if (!leaf) return;

    const container = leaf.view.containerEl.querySelector<HTMLElement>('.nav-files-container');
    if (!container || container.hasAttribute('data-hie-init')) return;

    container.setAttribute('data-hie-init', 'true');
    this.register(() => container.removeAttribute('data-hie-init'));

    this.processFileItems(container);

    this.observer?.disconnect();
    this.observer = new MutationObserver((mutations) => {
      if (mutations.some(m => m.addedNodes.length > 0)) this.processFileItems(container);
    });
    this.observer.observe(container, { childList: true, subtree: true });
    this.register(() => this.observer?.disconnect());

    this.registerDomEvent(container, 'click', (e) => this.handleClick(e));
  }

  private processFileItems(container: HTMLElement) {
    container.querySelectorAll<HTMLElement>('.nav-file-title:not([data-hie])').forEach((titleEl) => {
      const path = titleEl.dataset.path;
      if (!path?.endsWith('.md')) return;
      titleEl.setAttribute('data-hie', 'true');

      const file = this.app.vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile)) return;
      const cached = this.app.metadataCache.getFileCache(file)?.headings ?? [];
      if (!cached.some(h => h.level <= this.settings.maxLevel)) return;

      // tree-item-icon: Obsidian's standard icon slot. Adding this class lets
      // Iconic (and similar plugins) find our element instead of creating a
      // duplicate absolutely-positioned icon that would overlap ours.
      const iconContainer = createEl('div', { cls: 'hie-file-arrow tree-item-icon' });
      const collapseIcon = iconContainer.createEl('div', { cls: 'collapse-icon is-collapsed' });
      setIcon(collapseIcon, 'right-triangle');
      titleEl.prepend(iconContainer);
    });
  }

  private handleClick(e: MouseEvent) {
    const target = e.target as HTMLElement;

    if (target.closest('.hie-file-arrow')) {
      e.preventDefault();
      e.stopPropagation();
      const titleEl = target.closest<HTMLElement>('.nav-file-title');
      const path = titleEl?.dataset.path;
      if (path && titleEl) this.toggleHeadings(path, titleEl);
      return;
    }

    const titleEl = target.closest<HTMLElement>('.nav-file-title');
    if (!titleEl) return;
    const path = titleEl.dataset.path;
    if (!path?.endsWith('.md')) return;
    this.toggleHeadings(path, titleEl);
  }

  private onActiveLeafChange() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const file = view?.file;
    if (file) this.setupEditorTracking(file);

    if (!file || file.path === this.autoExpandedPath) return;

    if (this.autoExpandedPath) {
      const prev = this.getExplorerTitleEl(this.autoExpandedPath);
      if (prev) this.collapseHeadings(prev);
    }

    this.autoExpandedPath = file.path;
    const titleEl = this.getExplorerTitleEl(file.path);
    if (this.settings.defaultOpenLevel > 0 && titleEl && !titleEl.closest('.nav-file')?.querySelector('.hie-wrapper')) {
      this.expandHeadings(file.path, titleEl);
    }
    this.setupEditorTracking(file);
  }

  private onFileModified(file: TFile) {
    clearTimeout(this.modifyTimers.get(file.path));
    this.modifyTimers.set(file.path, setTimeout(() => {
      this.modifyTimers.delete(file.path);
      const titleEl = this.getExplorerTitleEl(file.path);
      if (!titleEl) return;
      const navFile = titleEl.closest<HTMLElement>('.nav-file');
      if (!navFile?.querySelector('.hie-wrapper')) return;
      navFile.querySelector('.hie-wrapper')?.remove();
      this.setFileArrowCollapsed(titleEl, true);
      this.expandHeadings(file.path, titleEl, false);
      const activeFile = this.app.workspace.getActiveViewOfType(MarkdownView)?.file;
      if (activeFile?.path === file.path) this.setupEditorTracking(file);
    }, 600));
  }

  private setFileArrowCollapsed(titleEl: HTMLElement, collapsed: boolean) {
    titleEl.querySelector<HTMLElement>('.hie-file-arrow .collapse-icon')
      ?.classList.toggle('is-collapsed', collapsed);
  }

  private getExplorerTitleEl(path: string): HTMLElement | null {
    const leaf = this.app.workspace.getLeavesOfType('file-explorer')[0];
    if (!leaf) return null;
    return leaf.view.containerEl.querySelector<HTMLElement>(
      `.nav-file-title[data-path="${CSS.escape(path)}"]`
    );
  }

  private toggleHeadings(path: string, titleEl: HTMLElement) {
    const navFile = titleEl.closest<HTMLElement>('.nav-file');
    if (!navFile) return;
    if (navFile.querySelector('.hie-wrapper')) {
      this.collapseHeadings(titleEl);
    } else {
      this.expandHeadings(path, titleEl);
      const file = this.app.vault.getAbstractFileByPath(path);
      // Delay to let Obsidian open the file before we look for the editor view.
      if (file instanceof TFile) setTimeout(() => this.setupEditorTracking(file), 50);
    }
  }

  private expandHeadings(path: string, titleEl: HTMLElement, animate = true) {
    const navFile = titleEl.closest<HTMLElement>('.nav-file');
    if (!navFile) return;

    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return;

    const headings = this.getHeadings(file);
    if (!headings.length) return;

    const wrapper = navFile.createEl('div', { cls: 'hie-wrapper' });
    const childrenEl = wrapper.createEl('div', { cls: 'hie-children' });
    childrenEl.classList.add('hie-indent-guides');

    this.renderNodes(this.buildTree(headings), childrenEl, file);

    this.setFileArrowCollapsed(titleEl, false);

    if (animate) {
      requestAnimationFrame(() => wrapper.classList.add('hie-open'));
    } else {
      wrapper.classList.add('hie-open');
    }
  }

  private buildTree(headings: Heading[]): HeadingNode[] {
    const roots: HeadingNode[] = [];
    const stack: HeadingNode[] = [];

    for (const h of headings) {
      const node: HeadingNode = { heading: h, children: [] };
      while (stack.length && stack[stack.length - 1].heading.level >= h.level) stack.pop();
      if (stack.length === 0) {
        roots.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }
      stack.push(node);
    }

    return roots;
  }

  private renderNodes(nodes: HeadingNode[], container: HTMLElement, file: TFile) {
    for (const node of nodes) this.renderNode(node, container, file);
  }

  private renderNode(node: HeadingNode, container: HTMLElement, file: TFile) {
    const { heading, children } = node;
    const hasChildren = children.length > 0;
    const startExpanded = heading.level < this.settings.defaultOpenLevel && this.settings.defaultOpenLevel > 0;

    const group = container.createEl('div', { cls: 'hie-heading-group' });
    const item = group.createEl('div', { cls: `hie-item hie-h${heading.level}` });
    item.dataset.line = String(heading.line);

    // Heading arrow — absolute in the padding area (same as file arrow).
    // For leaf nodes the arrow container is empty so it's invisible.
    const arrowContainer = item.createEl('span', { cls: 'hie-heading-arrow' });
    item.createEl('span', { cls: 'hie-item-text', text: heading.text });

    if (hasChildren) {
      const collapseIcon = arrowContainer.createEl('div', {
        cls: startExpanded ? 'collapse-icon' : 'collapse-icon is-collapsed',
      });
      setIcon(collapseIcon, 'right-triangle');

      const subWrapper = group.createEl('div', { cls: 'hie-sub-wrapper' });
      if (startExpanded) subWrapper.classList.add('hie-open');
      const subInner = subWrapper.createEl('div', { cls: 'hie-sub-inner' });
      subInner.classList.add('hie-indent-guides');
      this.renderNodes(children, subInner, file);

      const toggle = () => {
        const open = subWrapper.classList.toggle('hie-open');
        collapseIcon.classList.toggle('is-collapsed', !open);
      };

      arrowContainer.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.settings.highlightActive) this.setActiveHighlight(item);
        toggle();
        void this.goToHeading(file, heading);
      });
    } else {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.settings.highlightActive) this.setActiveHighlight(item);
        void this.goToHeading(file, heading);
      });
    }
  }

  private collapseHeadings(titleEl: HTMLElement) {
    if (titleEl.dataset.path === this.trackedFilePath) this.clearEditorTracking();
    const wrapper = titleEl.closest('.nav-file')?.querySelector<HTMLElement>('.hie-wrapper');
    if (!wrapper) return;
    this.setFileArrowCollapsed(titleEl, true);
    wrapper.classList.remove('hie-open');
    wrapper.addEventListener('transitionend', () => wrapper.remove(), { once: true });
  }

  private getHeadings(file: TFile): Heading[] {
    return (this.app.metadataCache.getFileCache(file)?.headings ?? [])
      .filter(h => h.level <= this.settings.maxLevel)
      .map(h => ({ level: h.level, text: h.heading, line: h.position.start.line }));
  }

  private refreshFileArrow(file: TFile) {
    const titleEl = this.getExplorerTitleEl(file.path);
    if (!titleEl) return;

    const hasHeadings = (this.app.metadataCache.getFileCache(file)?.headings ?? [])
      .some(h => h.level <= this.settings.maxLevel);
    const existingArrow = titleEl.querySelector('.hie-file-arrow');

    if (hasHeadings && !existingArrow) {
      titleEl.setAttribute('data-hie', 'true');
      const iconContainer = createEl('div', { cls: 'hie-file-arrow tree-item-icon' });
      iconContainer.createEl('div', { cls: 'collapse-icon is-collapsed' });
      setIcon(iconContainer.lastElementChild as HTMLElement, 'right-triangle');
      titleEl.prepend(iconContainer);
    } else if (!hasHeadings && existingArrow) {
      existingArrow.remove();
      titleEl.closest('.nav-file')?.querySelector('.hie-wrapper')?.remove();
    }
  }

  refreshExpanded() {
    const leaf = this.app.workspace.getLeavesOfType('file-explorer')[0];
    if (!leaf) return;

    const openPaths: string[] = [];
    leaf.view.containerEl.querySelectorAll<HTMLElement>('.hie-wrapper').forEach((el) => {
      const path = el.closest('.nav-file')?.querySelector<HTMLElement>('.nav-file-title')?.dataset.path;
      if (path) openPaths.push(path);
    });

    leaf.view.containerEl.querySelectorAll('.hie-wrapper').forEach(el => el.remove());
    leaf.view.containerEl.querySelectorAll('.hie-file-arrow .collapse-icon')
      .forEach(el => el.classList.add('is-collapsed'));

    for (const path of openPaths) {
      const titleEl = this.getExplorerTitleEl(path);
      if (titleEl) this.expandHeadings(path, titleEl, false);
    }
  }

  private setActiveHighlight(item: HTMLElement | null) {
    if (item === this.activeHighlight) return;
    this.activeHighlight?.classList.remove('hie-active');
    item?.classList.add('hie-active');
    this.activeHighlight = item;
  }

  setupEditorTracking(file: TFile) {
    if (!this.settings.highlightActive) return;

    this.trackingCleanup?.();
    this.trackingCleanup = null;
    this.trackedFilePath = file.path;

    const view = this.app.workspace.getLeavesOfType('markdown')
      .find(l => (l.view as MarkdownView).file?.path === file.path)
      ?.view as MarkdownView | undefined;
    if (!view) return;

    const scroller = view.contentEl.querySelector<HTMLElement>('.cm-scroller');
    if (!scroller) return;

    let rafPending = false;
    const onScroll = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        this.updateActiveHeading(view, file);
      });
    };

    const onInteract = () => this.updateActiveHeading(view, file);

    scroller.addEventListener('scroll', onScroll, { passive: true });
    view.contentEl.addEventListener('click', onInteract);
    view.contentEl.addEventListener('keyup', onInteract);

    this.trackingCleanup = () => {
      scroller.removeEventListener('scroll', onScroll);
      view.contentEl.removeEventListener('click', onInteract);
      view.contentEl.removeEventListener('keyup', onInteract);
    };

    this.updateActiveHeading(view, file);
  }

  clearEditorTracking() {
    this.trackingCleanup?.();
    this.trackingCleanup = null;
    this.trackedFilePath = null;
    this.activeHighlight?.classList.remove('hie-active');
    this.activeHighlight = null;
  }

  private updateActiveHeading(view: MarkdownView, file: TFile) {
    if (!view.editor) return;

    let currentLine: number;
    const cm = (view.editor as Record<string, unknown>).cm;
    const scroller = view.contentEl.querySelector<HTMLElement>('.cm-scroller');

    if (cm?.posAtCoords && scroller) {
      const rect = scroller.getBoundingClientRect();
      const readingY = rect.top + rect.height * 0.3;
      const pos = cm.posAtCoords({ x: rect.left + 10, y: readingY });
      if (pos == null) return;
      currentLine = cm.state.doc.lineAt(pos).number - 1;
    } else {
      currentLine = view.editor.getCursor().line;
    }

    const navFile = this.getExplorerTitleEl(file.path)?.closest<HTMLElement>('.nav-file');
    if (!navFile) return;

    let bestItem: HTMLElement | null = null;
    let bestLine = -1;
    navFile.querySelectorAll<HTMLElement>('.hie-item[data-line]').forEach(item => {
      const line = parseInt(item.dataset.line ?? '-1');
      if (line <= currentLine && line > bestLine) { bestLine = line; bestItem = item; }
    });

    let displayItem = bestItem;
    while (displayItem) {
      const subWrapper = displayItem.closest<HTMLElement>('.hie-sub-wrapper');
      if (!subWrapper || subWrapper.classList.contains('hie-open')) break;
      displayItem = subWrapper.closest<HTMLElement>('.hie-heading-group')
        ?.querySelector<HTMLElement>(':scope > .hie-item') ?? null;
    }

    this.setActiveHighlight(displayItem);
  }

  private async goToHeading(file: TFile, heading: Heading) {
    await this.app.workspace.openLinkText(`${file.basename}#${heading.text}`, file.path, false);
    if (this.settings.highlightActive) {
      setTimeout(() => this.setupEditorTracking(file), 50);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {
    this.clearEditorTracking();
    for (const timer of this.modifyTimers.values()) clearTimeout(timer);
    document.querySelectorAll('.hie-wrapper').forEach(el => el.remove());
    document.querySelectorAll('.hie-file-arrow').forEach(el => el.remove());
    document.querySelectorAll('[data-hie]').forEach(el => el.removeAttribute('data-hie'));
    document.querySelectorAll('[data-hie-init]').forEach(el => el.removeAttribute('data-hie-init'));
  }
}

class HeadingsInExplorerSettingTab extends PluginSettingTab {
  plugin: HeadingsInExplorerPlugin;

  constructor(app: App, plugin: HeadingsInExplorerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Highlight active heading')
      .setDesc('Highlight the heading in the explorer that matches the current scroll position.')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.highlightActive)
          .onChange(async (value) => {
            this.plugin.settings.highlightActive = value;
            await this.plugin.saveSettings();
            if (!value) {
              this.plugin.clearEditorTracking();
            } else {
              const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
              if (view?.file) this.plugin.setupEditorTracking(view.file);
            }
          })
      );

    new Setting(containerEl)
      .setName('Show headings up to')
      .setDesc('Headings deeper than this level are hidden from the explorer.')
      .addDropdown(drop => {
        drop
          .addOption('1', 'H1')
          .addOption('2', 'H2')
          .addOption('3', 'H3')
          .addOption('4', 'H4')
          .addOption('5', 'H5')
          .addOption('6', 'H6')
          .setValue(String(this.plugin.settings.maxLevel))
          .onChange(async (value) => {
            this.plugin.settings.maxLevel = parseInt(value);
            await this.plugin.saveSettings();
            this.plugin.refreshExpanded();
          });
      });

    new Setting(containerEl)
      .setName('Auto-expand down to')
      .setDesc('Which headings are visible automatically when a file opens. Nothing means the panel stays closed until you click.')
      .addDropdown(drop => {
        drop
          .addOption('0', 'Nothing')
          .addOption('1', 'H1')
          .addOption('2', 'H2')
          .addOption('3', 'H3')
          .addOption('4', 'H4')
          .addOption('5', 'H5')
          .addOption('6', 'H6')
          .setValue(String(this.plugin.settings.defaultOpenLevel))
          .onChange(async (value) => {
            this.plugin.settings.defaultOpenLevel = parseInt(value);
            await this.plugin.saveSettings();
            this.plugin.refreshExpanded();
          });
      });
  }
}

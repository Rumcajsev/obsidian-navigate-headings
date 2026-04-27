var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => HeadingsInExplorerPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  maxLevel: 3,
  defaultOpenLevel: 2,
  highlightActive: true
};
var HeadingsInExplorerPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.observer = null;
    this.autoExpandedPath = null;
    this.modifyTimers = /* @__PURE__ */ new Map();
    this.activeHighlight = null;
    this.trackingCleanup = null;
    this.trackedFilePath = null;
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new HeadingsInExplorerSettingTab(this.app, this));
    this.app.workspace.onLayoutReady(() => this.initExplorer());
    this.registerEvent(this.app.workspace.on("layout-change", () => this.initExplorer()));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.onActiveLeafChange()));
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof import_obsidian.TFile && file.extension === "md") this.onFileModified(file);
      })
    );
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        if (file.extension === "md") this.refreshFileArrow(file);
      })
    );
  }
  initExplorer() {
    var _a;
    const leaf = this.app.workspace.getLeavesOfType("file-explorer")[0];
    if (!leaf) return;
    const container = leaf.view.containerEl.querySelector(".nav-files-container");
    if (!container || container.hasAttribute("data-hie-init")) return;
    container.setAttribute("data-hie-init", "true");
    this.register(() => container.removeAttribute("data-hie-init"));
    this.processFileItems(container);
    (_a = this.observer) == null ? void 0 : _a.disconnect();
    this.observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.addedNodes.length > 0)) this.processFileItems(container);
    });
    this.observer.observe(container, { childList: true, subtree: true });
    this.register(() => {
      var _a2;
      return (_a2 = this.observer) == null ? void 0 : _a2.disconnect();
    });
    this.registerDomEvent(container, "click", (e) => this.handleClick(e));
  }
  processFileItems(container) {
    container.querySelectorAll(".nav-file-title:not([data-hie])").forEach((titleEl) => {
      var _a, _b;
      const path = titleEl.dataset.path;
      if (!(path == null ? void 0 : path.endsWith(".md"))) return;
      titleEl.setAttribute("data-hie", "true");
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!(file instanceof import_obsidian.TFile)) return;
      const cached = (_b = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.headings) != null ? _b : [];
      if (!cached.some((h) => h.level <= this.settings.maxLevel)) return;
      const iconContainer = createEl("div", { cls: "hie-file-arrow tree-item-icon" });
      const collapseIcon = iconContainer.createEl("div", { cls: "collapse-icon is-collapsed" });
      (0, import_obsidian.setIcon)(collapseIcon, "right-triangle");
      titleEl.prepend(iconContainer);
    });
  }
  handleClick(e) {
    const target = e.target;
    if (target.closest(".hie-file-arrow")) {
      e.preventDefault();
      e.stopPropagation();
      const titleEl2 = target.closest(".nav-file-title");
      const path2 = titleEl2 == null ? void 0 : titleEl2.dataset.path;
      if (path2 && titleEl2) this.toggleHeadings(path2, titleEl2);
      return;
    }
    const titleEl = target.closest(".nav-file-title");
    if (!titleEl) return;
    const path = titleEl.dataset.path;
    if (!(path == null ? void 0 : path.endsWith(".md"))) return;
    this.toggleHeadings(path, titleEl);
  }
  onActiveLeafChange() {
    var _a;
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    const file = view == null ? void 0 : view.file;
    if (file) this.setupEditorTracking(file);
    if (!file || file.path === this.autoExpandedPath) return;
    if (this.autoExpandedPath) {
      const prev = this.getExplorerTitleEl(this.autoExpandedPath);
      if (prev) this.collapseHeadings(prev);
    }
    this.autoExpandedPath = file.path;
    const titleEl = this.getExplorerTitleEl(file.path);
    if (this.settings.defaultOpenLevel > 0 && titleEl && !((_a = titleEl.closest(".nav-file")) == null ? void 0 : _a.querySelector(".hie-wrapper"))) {
      this.expandHeadings(file.path, titleEl);
    }
    this.setupEditorTracking(file);
  }
  onFileModified(file) {
    activeWindow.clearTimeout(this.modifyTimers.get(file.path));
    this.modifyTimers.set(file.path, activeWindow.setTimeout(() => {
      var _a, _b;
      this.modifyTimers.delete(file.path);
      const titleEl = this.getExplorerTitleEl(file.path);
      if (!titleEl) return;
      const navFile = titleEl.closest(".nav-file");
      if (!(navFile == null ? void 0 : navFile.querySelector(".hie-wrapper"))) return;
      (_a = navFile.querySelector(".hie-wrapper")) == null ? void 0 : _a.remove();
      this.setFileArrowCollapsed(titleEl, true);
      this.expandHeadings(file.path, titleEl, false);
      const activeFile = (_b = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView)) == null ? void 0 : _b.file;
      if ((activeFile == null ? void 0 : activeFile.path) === file.path) this.setupEditorTracking(file);
    }, 600));
  }
  setFileArrowCollapsed(titleEl, collapsed) {
    var _a;
    (_a = titleEl.querySelector(".hie-file-arrow .collapse-icon")) == null ? void 0 : _a.classList.toggle("is-collapsed", collapsed);
  }
  getExplorerTitleEl(path) {
    const leaf = this.app.workspace.getLeavesOfType("file-explorer")[0];
    if (!leaf) return null;
    return leaf.view.containerEl.querySelector(
      `.nav-file-title[data-path="${CSS.escape(path)}"]`
    );
  }
  toggleHeadings(path, titleEl) {
    const navFile = titleEl.closest(".nav-file");
    if (!navFile) return;
    if (navFile.querySelector(".hie-wrapper")) {
      this.collapseHeadings(titleEl);
    } else {
      this.expandHeadings(path, titleEl);
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof import_obsidian.TFile) activeWindow.setTimeout(() => this.setupEditorTracking(file), 50);
    }
  }
  expandHeadings(path, titleEl, animate = true) {
    const navFile = titleEl.closest(".nav-file");
    if (!navFile) return;
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian.TFile)) return;
    const headings = this.getHeadings(file);
    if (!headings.length) return;
    const wrapper = navFile.createEl("div", { cls: "hie-wrapper" });
    const childrenEl = wrapper.createEl("div", { cls: "hie-children" });
    childrenEl.classList.add("hie-indent-guides");
    this.renderNodes(this.buildTree(headings), childrenEl, file);
    this.setFileArrowCollapsed(titleEl, false);
    if (animate) {
      requestAnimationFrame(() => wrapper.classList.add("hie-open"));
    } else {
      wrapper.classList.add("hie-open");
    }
  }
  buildTree(headings) {
    const roots = [];
    const stack = [];
    for (const h of headings) {
      const node = { heading: h, children: [] };
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
  renderNodes(nodes, container, file) {
    for (const node of nodes) this.renderNode(node, container, file);
  }
  renderNode(node, container, file) {
    const { heading, children } = node;
    const hasChildren = children.length > 0;
    const startExpanded = heading.level < this.settings.defaultOpenLevel && this.settings.defaultOpenLevel > 0;
    const group = container.createEl("div", { cls: "hie-heading-group" });
    const item = group.createEl("div", { cls: `hie-item hie-h${heading.level}` });
    item.dataset.line = String(heading.line);
    const arrowContainer = item.createEl("span", { cls: "hie-heading-arrow" });
    item.createEl("span", { cls: "hie-item-text", text: heading.text });
    if (hasChildren) {
      const collapseIcon = arrowContainer.createEl("div", {
        cls: startExpanded ? "collapse-icon" : "collapse-icon is-collapsed"
      });
      (0, import_obsidian.setIcon)(collapseIcon, "right-triangle");
      const subWrapper = group.createEl("div", { cls: "hie-sub-wrapper" });
      if (startExpanded) subWrapper.classList.add("hie-open");
      const subInner = subWrapper.createEl("div", { cls: "hie-sub-inner" });
      subInner.classList.add("hie-indent-guides");
      this.renderNodes(children, subInner, file);
      const toggle = () => {
        const open = subWrapper.classList.toggle("hie-open");
        collapseIcon.classList.toggle("is-collapsed", !open);
      };
      arrowContainer.addEventListener("click", (e) => {
        e.stopPropagation();
        toggle();
      });
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.settings.highlightActive) this.setActiveHighlight(item);
        toggle();
        void this.goToHeading(file, heading);
      });
    } else {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.settings.highlightActive) this.setActiveHighlight(item);
        void this.goToHeading(file, heading);
      });
    }
  }
  collapseHeadings(titleEl) {
    var _a;
    if (titleEl.dataset.path === this.trackedFilePath) this.clearEditorTracking();
    const wrapper = (_a = titleEl.closest(".nav-file")) == null ? void 0 : _a.querySelector(".hie-wrapper");
    if (!wrapper) return;
    this.setFileArrowCollapsed(titleEl, true);
    wrapper.classList.remove("hie-open");
    wrapper.addEventListener("transitionend", () => wrapper.remove(), { once: true });
  }
  getHeadings(file) {
    var _a, _b;
    return ((_b = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.headings) != null ? _b : []).filter((h) => h.level <= this.settings.maxLevel).map((h) => ({ level: h.level, text: h.heading, line: h.position.start.line }));
  }
  refreshFileArrow(file) {
    var _a, _b, _c, _d;
    const titleEl = this.getExplorerTitleEl(file.path);
    if (!titleEl) return;
    const hasHeadings = ((_b = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.headings) != null ? _b : []).some((h) => h.level <= this.settings.maxLevel);
    const existingArrow = titleEl.querySelector(".hie-file-arrow");
    if (hasHeadings && !existingArrow) {
      titleEl.setAttribute("data-hie", "true");
      const iconContainer = createEl("div", { cls: "hie-file-arrow tree-item-icon" });
      iconContainer.createEl("div", { cls: "collapse-icon is-collapsed" });
      (0, import_obsidian.setIcon)(iconContainer.lastElementChild, "right-triangle");
      titleEl.prepend(iconContainer);
    } else if (!hasHeadings && existingArrow) {
      existingArrow.remove();
      (_d = (_c = titleEl.closest(".nav-file")) == null ? void 0 : _c.querySelector(".hie-wrapper")) == null ? void 0 : _d.remove();
    }
  }
  refreshExpanded() {
    const leaf = this.app.workspace.getLeavesOfType("file-explorer")[0];
    if (!leaf) return;
    const openPaths = [];
    leaf.view.containerEl.querySelectorAll(".hie-wrapper").forEach((el) => {
      var _a, _b;
      const path = (_b = (_a = el.closest(".nav-file")) == null ? void 0 : _a.querySelector(".nav-file-title")) == null ? void 0 : _b.dataset.path;
      if (path) openPaths.push(path);
    });
    leaf.view.containerEl.querySelectorAll(".hie-wrapper").forEach((el) => el.remove());
    leaf.view.containerEl.querySelectorAll(".hie-file-arrow .collapse-icon").forEach((el) => el.classList.add("is-collapsed"));
    for (const path of openPaths) {
      const titleEl = this.getExplorerTitleEl(path);
      if (titleEl) this.expandHeadings(path, titleEl, false);
    }
  }
  setActiveHighlight(item) {
    var _a;
    if (item === this.activeHighlight) return;
    (_a = this.activeHighlight) == null ? void 0 : _a.classList.remove("hie-active");
    item == null ? void 0 : item.classList.add("hie-active");
    this.activeHighlight = item;
  }
  setupEditorTracking(file) {
    var _a, _b;
    if (!this.settings.highlightActive) return;
    (_a = this.trackingCleanup) == null ? void 0 : _a.call(this);
    this.trackingCleanup = null;
    this.trackedFilePath = file.path;
    const view = (_b = this.app.workspace.getLeavesOfType("markdown").find((l) => {
      var _a2;
      return ((_a2 = l.view.file) == null ? void 0 : _a2.path) === file.path;
    })) == null ? void 0 : _b.view;
    if (!view) return;
    const scroller = view.contentEl.querySelector(".cm-scroller");
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
    scroller.addEventListener("scroll", onScroll, { passive: true });
    view.contentEl.addEventListener("click", onInteract);
    view.contentEl.addEventListener("keyup", onInteract);
    this.trackingCleanup = () => {
      scroller.removeEventListener("scroll", onScroll);
      view.contentEl.removeEventListener("click", onInteract);
      view.contentEl.removeEventListener("keyup", onInteract);
    };
    this.updateActiveHeading(view, file);
  }
  clearEditorTracking() {
    var _a, _b;
    (_a = this.trackingCleanup) == null ? void 0 : _a.call(this);
    this.trackingCleanup = null;
    this.trackedFilePath = null;
    (_b = this.activeHighlight) == null ? void 0 : _b.classList.remove("hie-active");
    this.activeHighlight = null;
  }
  updateActiveHeading(view, file) {
    var _a, _b, _c;
    if (!view.editor) return;
    let currentLine;
    const cm = view.editor.cm;
    const scroller = view.contentEl.querySelector(".cm-scroller");
    if ((cm == null ? void 0 : cm.posAtCoords) && scroller) {
      const rect = scroller.getBoundingClientRect();
      const readingY = rect.top + rect.height * 0.3;
      const pos = cm.posAtCoords({ x: rect.left + 10, y: readingY });
      if (pos == null) return;
      currentLine = cm.state.doc.lineAt(pos).number - 1;
    } else {
      currentLine = view.editor.getCursor().line;
    }
    const navFile = (_a = this.getExplorerTitleEl(file.path)) == null ? void 0 : _a.closest(".nav-file");
    if (!navFile) return;
    let bestItem = null;
    let bestLine = -1;
    navFile.querySelectorAll(".hie-item[data-line]").forEach((item) => {
      var _a2;
      const line = parseInt((_a2 = item.dataset.line) != null ? _a2 : "-1");
      if (line <= currentLine && line > bestLine) {
        bestLine = line;
        bestItem = item;
      }
    });
    let displayItem = bestItem;
    while (displayItem) {
      const current = displayItem;
      const subWrapper = current.closest(".hie-sub-wrapper");
      if (!subWrapper || subWrapper.classList.contains("hie-open")) break;
      displayItem = (_c = (_b = subWrapper.closest(".hie-heading-group")) == null ? void 0 : _b.querySelector(":scope > .hie-item")) != null ? _c : null;
    }
    this.setActiveHighlight(displayItem);
  }
  async goToHeading(file, heading) {
    await this.app.workspace.openLinkText(`${file.basename}#${heading.text}`, file.path, false);
    if (this.settings.highlightActive) {
      activeWindow.setTimeout(() => this.setupEditorTracking(file), 50);
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
    for (const timer of this.modifyTimers.values()) activeWindow.clearTimeout(timer);
    activeDocument.querySelectorAll(".hie-wrapper").forEach((el) => el.remove());
    activeDocument.querySelectorAll(".hie-file-arrow").forEach((el) => el.remove());
    activeDocument.querySelectorAll("[data-hie]").forEach((el) => el.removeAttribute("data-hie"));
    activeDocument.querySelectorAll("[data-hie-init]").forEach((el) => el.removeAttribute("data-hie-init"));
  }
};
var HeadingsInExplorerSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Highlight active heading").setDesc("Highlight the heading in the explorer that matches the current scroll position.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.highlightActive).onChange(async (value) => {
        this.plugin.settings.highlightActive = value;
        await this.plugin.saveSettings();
        if (!value) {
          this.plugin.clearEditorTracking();
        } else {
          const view = this.plugin.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
          if (view == null ? void 0 : view.file) this.plugin.setupEditorTracking(view.file);
        }
      })
    );
    new import_obsidian.Setting(containerEl).setName("Show headings up to").setDesc("Headings deeper than this level are hidden from the explorer.").addDropdown((drop) => {
      drop.addOption("1", "H1").addOption("2", "H2").addOption("3", "H3").addOption("4", "H4").addOption("5", "H5").addOption("6", "H6").setValue(String(this.plugin.settings.maxLevel)).onChange(async (value) => {
        this.plugin.settings.maxLevel = parseInt(value);
        await this.plugin.saveSettings();
        this.plugin.refreshExpanded();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Auto-expand down to").setDesc("Which headings are visible automatically when a file opens. Nothing means the panel stays closed until you click.").addDropdown((drop) => {
      drop.addOption("0", "Nothing").addOption("1", "H1").addOption("2", "H2").addOption("3", "H3").addOption("4", "H4").addOption("5", "H5").addOption("6", "H6").setValue(String(this.plugin.settings.defaultOpenLevel)).onChange(async (value) => {
        this.plugin.settings.defaultOpenLevel = parseInt(value);
        await this.plugin.saveSettings();
        this.plugin.refreshExpanded();
      });
    });
  }
};

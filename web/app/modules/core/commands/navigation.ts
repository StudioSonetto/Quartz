const TABS: AtelierTab[] = ["editor", "assets", "exports"];

const openPalette: Command = {
  id: "core.view.palette",
  keys: ["mod+k"],
  title: "Command Palette",
  category: "View",
  icon: "i-carbon-search",
  undoable: false,
  run: (ctx) => ctx.atelier.togglePalette(),
};

const addNode: Command = {
  id: "core.view.addNode",
  keys: ["n"],
  title: "Add Node…",
  category: "View",
  icon: "i-carbon-add",
  undoable: false,
  run: (ctx) => ctx.atelier.togglePalette("Add "),
};

const tabCommands: Command[] = TABS.map((tab, i) => ({
  id: `core.view.tab.${i}`,
  title: `Go to ${tab[0]!.toUpperCase()}${tab.slice(1)}`,
  category: "View",
  icon: "i-carbon-open-panel-bottom",
  undoable: false,
  run: (ctx) => ctx.atelier.setActiveTab(tab),
}));

export default [openPalette, addNode, ...tabCommands];

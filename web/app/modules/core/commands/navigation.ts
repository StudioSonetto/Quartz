const TAB_NAMES = ["Editor", "Assets", "Exports"];

const openPalette: Command = {
  id: "core.view.palette",
  title: "Command Palette",
  category: "View",
  icon: "i-carbon-search",
  undoable: false,
  run: (ctx) => ctx.atelier.togglePalette(),
};

const tabCommands: Command[] = TAB_NAMES.map((name, i) => ({
  id: `core.view.tab.${i}`,
  title: `Go to ${name}`,
  category: "View",
  icon: "i-carbon-open-panel-bottom",
  undoable: false,
  run: (ctx) => ctx.atelier.setActiveTab(i),
}));

export default [openPalette, ...tabCommands];

import { ATELIER_TABS } from "~/stores/useAtelierStore";

const openPalette: Command = {
  id: "core.view.palette",
  keys: ["mod+k"],
  title: "Command Palette",
  category: "View",
  icon: "i-carbon-search",
  undoable: false,
  run: (ctx) => ctx.atelier.togglePalette(),
};

const tabCommands: Command[] = ATELIER_TABS.map(({ name }, i) => ({
  id: `core.view.tab.${i}`,
  title: `Go to ${name}`,
  category: "View",
  icon: "i-carbon-open-panel-bottom",
  undoable: false,
  run: (ctx) => ctx.atelier.setActiveTab(i),
}));

export default [openPalette, ...tabCommands];

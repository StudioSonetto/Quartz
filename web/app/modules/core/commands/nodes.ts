import { canContain } from "../../registry";
import { ROOT_PATH } from "~/utils/nodePath";
import type { Command, NodeTypeDef } from "#shared/types";

export function makeCreateCommands(defs: NodeTypeDef[]): Command[] {
  return defs.map((def) => ({
    id: `core.node.create.${def.type}`,
    title: `Add ${def.label}`,
    category: "Node",
    icon: def.icon,
    when: (ctx) => {
      const parentType = ctx.soleSelected?.type ?? "core.group";
      return canContain(parentType, def.type);
    },
    run: (ctx) => ctx.deck.createNode(def.label, def.type),
  }));
}

const deleteCommand: Command = {
  id: "core.node.delete",
  title: "Delete Node",
  category: "Node",
  icon: "i-carbon-trash-can",
  when: (ctx) => ctx.selectedNodes.some((n) => n.path !== ROOT_PATH),
  run: (ctx) => ctx.deck.deleteSelectedNodes(),
};

const selectAllCommand: Command = {
  id: "core.selection.selectAll",
  title: "Select All",
  category: "Selection",
  icon: "i-carbon-select-window",
  when: (ctx) => !!ctx.deckId,
  run: (ctx) => ctx.deck.selectAll(),
};

const clearSelectionCommand: Command = {
  id: "core.selection.clear",
  title: "Clear Selection",
  category: "Selection",
  icon: "i-carbon-close",
  when: (ctx) => ctx.selectedNodeIds.length > 0,
  run: () => useNodeSelection().clear(),
};

export default [deleteCommand, selectAllCommand, clearSelectionCommand];

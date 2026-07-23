import { canContain } from "../../registry";
import { ROOT_PATH } from "~/utils/nodePath";
import type { Command, NodeTypeDef } from "#shared/types";

export function makeCreateCommands(defs: NodeTypeDef[]): Command[] {
  return defs
    .filter((d) => d.creatable)
    .map((def) => ({
      id: `core.node.create.${def.type}`,
      title: `Add ${def.label}`,
      category: "Node",
      icon: def.icon,
      when: (ctx) => {
        const parentType = ctx.selectedNode?.type ?? "core.group";
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
  when: (ctx) => !!ctx.selectedNode && ctx.selectedNode.path !== ROOT_PATH,
  run: (ctx) => ctx.deck.deleteSelectedNode(),
};

export default [deleteCommand];

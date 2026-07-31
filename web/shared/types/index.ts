/// <reference lib="dom" />

import type { Component } from "vue";

import type { components, decks, nodes, slides } from "~~/server/db/schema";

export type DeckModel = typeof decks.$inferSelect;
export type SlidesModel = typeof slides.$inferSelect;
export type NodeModel = typeof nodes.$inferSelect;
export type ComponentModel = typeof components.$inferSelect;

export type NodeType = NodeModel["type"];
export type ComponentType = ComponentModel["type"];

export interface Tree extends NodeModel {
  type: NodeType;
  children: Tree[];
  parent?: Tree;
}

export const isEmptyTree = (tree: Tree) => {
  return (
    tree.slides === EMPTY_TREE.slides &&
    tree.name === EMPTY_TREE.name &&
    tree.path === EMPTY_TREE.path &&
    tree.type === EMPTY_TREE.type &&
    tree.reference === EMPTY_TREE.reference &&
    tree.children.length === EMPTY_TREE.children.length
  );
};

export const EMPTY_TREE: Tree = {
  id: "",
  slides: "",
  name: "",
  path: "",
  type: "core.group",
  reference: "",
  sort_order: 0,
  children: [],
};

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "offline";

export interface RenderResult {
  content?: string;
  style?: Record<string, string | number>;
  component?: Component;
}

export interface RenderContext {
  findComponent: (
    node: Tree,
    type: ComponentType,
  ) => ComponentModel | undefined;
  data: (node: Tree, type: ComponentType) => any;
  optional: (node: Tree, type: ComponentType) => any | undefined;
  scale: number;
  module: <T>(moduleId: string) => T;
}

export interface NodeRenderer {
  element: string;
  render: (node: Tree, ctx: RenderContext) => RenderResult;
}

export interface ComponentTypeDef {
  type: ComponentType;
  icon: string;
  inspector: Component;
  defaultData: () => Record<string, any>;
}

export type DefaultComponent =
  | ComponentType
  | { type: ComponentType; data: Record<string, any> };

export interface NodeTypeDef {
  type: NodeType;
  label: string;
  icon: string;
  accepts: NodeType[];
  defaultComponents: DefaultComponent[];
  renderer: NodeRenderer;
  creatable?: boolean;
}

export interface Command {
  id: string;
  title: string;
  category: string;
  icon?: string;
  when?: (ctx: CommandContext) => boolean;
  run: (ctx: CommandContext) => void | Promise<void>;
}

export type AtelierFocus =
  | "canvas"
  | "hierarchy"
  | "inspector"
  | "properties"
  | null;

export interface CommandContext {
  // `deck`/`atelier` are the Pinia stores at runtime. They are typed loosely
  // here on purpose: this file lives in `shared/` (auto-imported into both the
  // app AND the server/client-build graphs), so it must not reference app-only
  // composables like `useDeckStore` — doing so pulls the store module into a
  // build context without Nuxt's auto-import globals and breaks `nuxt build`.
  deck: any;
  atelier: any;
  soleSelected: Tree | null;
  selectedNodes: Tree[];
  selectedNodeIds: string[];
  activeTab: number;
  focus: AtelierFocus;
  deckId: string | null;
}

export interface ModuleDefinition {
  id: string;
  nodeTypes: NodeTypeDef[];
  componentTypes: ComponentTypeDef[];
  commands?: Command[];
  api?: unknown;
}

export interface ContextMenuItem {
  label: string;
  action: () => void;
  icon?: string;
  shortcut?: string;
  danger?: boolean;
}

export interface ContextMenuEvent extends CustomEvent {
  detail: {
    event: MouseEvent;
    menuItems: ContextMenuItem[];
  };
}

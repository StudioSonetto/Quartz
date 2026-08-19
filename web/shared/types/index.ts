/// <reference lib="dom" />

import type { Component } from "vue";

import type { components, decks, nodes, slides } from "~~/server/db/schema";

export type DeckModel = typeof decks.$inferSelect;
export type SlidesModel = typeof slides.$inferSelect;
export type NodeModel = typeof nodes.$inferSelect;
export type ComponentModel = typeof components.$inferSelect;

export type NodeType = NodeModel["type"];
export type ComponentType = ComponentModel["type"];

export type AssetKind = "image" | "font" | "model";

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
  unsynced: null,
  locked: false,
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
  assetUrl: (name: string) => string | undefined;
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
  optional?: boolean;
  migrate?: (data: Record<string, any>) => Record<string, any>;
}

export type DefaultComponent =
  | ComponentType
  | { type: ComponentType; data: Record<string, any> };

export interface AssetDropDef {
  kind: AssetKind;
  apply: (nodeId: string, name: string) => void | Promise<void>;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface HandleGesture<M = (dx: number, dy: number) => void> {
  move: M;
  end?: () => void;
}

export interface HandleDef {
  resize?: (
    node: Tree,
    direction: { x: number; y: number },
    box: Rect,
  ) => HandleGesture | undefined;
  rotate?: (node: Tree) => HandleGesture<(degrees: number) => void> | undefined;
}

export interface DragGesture extends HandleGesture {
  node: string;
}

export interface NodeTypeDef {
  type: NodeType;
  label: string;
  icon: string;
  accepts: NodeType[];
  defaultComponents: DefaultComponent[];
  renderer: NodeRenderer;
  creatable?: boolean;
  parents?: NodeType[];
  onMount?: (nodeId: string) => void;
  onCreate?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  pick?: (node: Tree, event: MouseEvent) => Tree | undefined;
  drag?: (node: Tree, event: PointerEvent) => DragGesture | undefined;
  handles?: HandleDef;
  hitTest?: "element" | "contents";
  asset?: AssetDropDef;
  sizing?: "free" | "fixed" | "derived";
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
  deck: any;
  atelier: any;
  soleSelected: Tree | null;
  selectedNodes: Tree[];
  unlockedNodes: Tree[];
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

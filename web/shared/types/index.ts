import {
  BufferGeometry,
  Group,
  Mesh,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

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
  type: "group",
  reference: "",
  sort_order: 0,
  children: [],
};

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "offline";

export interface RenderResult {
  content?: string;
  style?: Record<string, string | number>;
}

export interface RenderContext {
  findComponent: (node: Tree, type: ComponentType) => ComponentModel | undefined;
  scale: number;
  ensureCanvasContext: (node: Tree) => void; // create (+ lights) and apply size/clear/camera from components
  getCanvasContext: (id: string) => CanvasContext | undefined;
  syncObject: (context: CanvasContext, node: Tree) => void; // instantiate/update/recreate mesh
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

export interface NodeTypeDef {
  type: NodeType;
  label: string;
  icon: string;
  creatable: boolean;
  defaultComponents: ComponentType[];
  renderer: NodeRenderer;
}

export interface ModuleDefinition {
  id: string;
  nodeTypes: NodeTypeDef[];
  componentTypes: ComponentTypeDef[];
}

export interface CanvasContext {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  loaders: {
    fbx: FBXLoader;
    gltf: GLTFLoader;
    obj: OBJLoader;
  };
  objects: Map<string, Mesh | Group>;
  cache: Map<string, BufferGeometry | Group>;
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

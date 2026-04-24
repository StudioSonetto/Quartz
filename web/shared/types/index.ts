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
  children: [],
};

export interface PendingNode extends NodeModel {
  _pending?: true;
  _deleted?: boolean;
}

export type PendingChanges = {
  nodes: PendingNode[];
  components: ComponentModel[];
};

export interface RenderResult {
  content?: string;
  style?: Record<string, string | number>;
}

export interface NodeRenderer {
  element: string;
  render: (node: Tree) => RenderResult;
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

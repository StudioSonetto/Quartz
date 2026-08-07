import type {
  BufferGeometry,
  Group,
  Mesh,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import type { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import type { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

export interface CanvasContext {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  loaders: { fbx: FBXLoader; gltf: GLTFLoader; obj: OBJLoader };
  objects: Map<string, Mesh | Group>;
  cache: Map<string, BufferGeometry | Group>;
}

export interface WebglApi {
  ensureCanvasContext: (node: Tree) => void;
  getCanvasContext: (id: string) => CanvasContext | undefined;
  syncObject: (context: CanvasContext, node: Tree) => void;
  setupCanvas: (id: string) => void;
}

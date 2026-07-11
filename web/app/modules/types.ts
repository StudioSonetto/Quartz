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

export function defineModule(m: ModuleDefinition): ModuleDefinition {
  return m;
}

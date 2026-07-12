export function defineModule(m: ModuleDefinition): ModuleDefinition {
  return m;
}

const nodeTypes = new Map<NodeType, NodeTypeDef>();
const componentTypes = new Map<ComponentType, ComponentTypeDef>();

export function registerModule(m: ModuleDefinition) {
  for (const n of m.nodeTypes) {
    if (import.meta.dev && nodeTypes.has(n.type)) console.warn(`[registry] node type "${n.type}" re-registered`);
    nodeTypes.set(n.type, n);
  }
  for (const c of m.componentTypes) {
    if (import.meta.dev && componentTypes.has(c.type)) console.warn(`[registry] component type "${c.type}" re-registered`);
    componentTypes.set(c.type, c);
  }
}

export const getNodeType = (t: NodeType) => nodeTypes.get(t);
export const getComponentType = (t: ComponentType) => componentTypes.get(t);
export const creatableNodeTypes = () => [...nodeTypes.values()].filter((n) => n.creatable);

// Test-only helper.
export function __resetRegistry() {
  nodeTypes.clear();
  componentTypes.clear();
}

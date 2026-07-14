export function defineModule(m: ModuleDefinition): ModuleDefinition {
  return m;
}

const nodeTypes = new Map<NodeType, NodeTypeDef>();
const componentTypes = new Map<ComponentType, ComponentTypeDef>();

export function registerModule(m: ModuleDefinition) {
  for (const n of m.nodeTypes) nodeTypes.set(n.type, n);
  for (const c of m.componentTypes) componentTypes.set(c.type, c);
}

export const getNodeType = (t: NodeType) => nodeTypes.get(t);
export const getComponentType = (t: ComponentType) => componentTypes.get(t);
export const creatableNodeTypes = () =>
  [...nodeTypes.values()].filter((n) => n.creatable);
export const canContain = (
  parentType: NodeType,
  childType: NodeType,
): boolean => getNodeType(parentType)?.accepts.includes(childType) ?? false;

// Test-only: reset the singleton maps between cases.
export function __resetRegistry() {
  nodeTypes.clear();
  componentTypes.clear();
}

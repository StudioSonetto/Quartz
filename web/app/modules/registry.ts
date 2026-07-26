export function defineModule(m: ModuleDefinition): ModuleDefinition {
  return m;
}

const nodeTypes = new Map<NodeType, NodeTypeDef>();
const componentTypes = new Map<ComponentType, ComponentTypeDef>();
const commands = new Map<string, Command>();
const apis = new Map<string, unknown>();

export function registerModule(m: ModuleDefinition) {
  for (const n of m.nodeTypes) nodeTypes.set(n.type, n);
  for (const c of m.componentTypes) componentTypes.set(c.type, c);
  for (const cmd of m.commands ?? []) commands.set(cmd.id, cmd);
  if (m.api !== undefined) apis.set(m.id, m.api);
}

export const getNodeType = (t: NodeType) => nodeTypes.get(t);
export const getComponentType = (t: ComponentType) => componentTypes.get(t);
export const allNodeTypes = () => [...nodeTypes.values()];
export const canContain = (
  parentType: NodeType,
  childType: NodeType,
): boolean => getNodeType(parentType)?.accepts.includes(childType) ?? false;

export const getCommand = (id: string) => commands.get(id);
export const allCommands = (): Command[] => [...commands.values()];

export const getModuleApi = <T>(moduleId: string) =>
  apis.get(moduleId) as T | undefined;

// Test-only: reset the singleton maps between cases.
export function __resetRegistry() {
  nodeTypes.clear();
  componentTypes.clear();
  commands.clear();
  apis.clear();
}

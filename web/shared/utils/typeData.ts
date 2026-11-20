const nodes = new Map<NodeType, NodeTypeData>();
const components = new Map<ComponentType, ComponentTypeData>();

export function registerTypeData(m: {
  nodeTypes: NodeTypeData[];
  componentTypes: ComponentTypeData[];
}) {
  for (const n of m.nodeTypes) nodes.set(n.type, n);
  for (const c of m.componentTypes) components.set(c.type, c);
}

export const nodeData = (t: NodeType) => nodes.get(t);
export const componentData = (t: ComponentType) => components.get(t);
export const allNodeData = () => [...nodes.values()];

export function resetTypeData() {
  nodes.clear();
  components.clear();
}

export const canContain = (parent: NodeType, child: NodeType): boolean =>
  (nodeData(parent)?.accepts.includes(child) ?? false) ||
  (nodeData(child)?.parents?.includes(parent) ?? false);

export function isPlainObject(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function deepMerge(
  base: Record<string, any>,
  override: Record<string, any>,
): Record<string, any> {
  const out: Record<string, any> = { ...base };

  for (const key of Object.keys(override)) {
    const b = base[key];
    const o = override[key];

    out[key] = isPlainObject(b) && isPlainObject(o) ? deepMerge(b, o) : o;
  }

  return out;
}

export function entryType(e: DefaultComponent): ComponentType {
  return typeof e === "string" ? e : e.type;
}

export function effectiveDefaults(
  nodeType: NodeType,
  componentType: ComponentType,
): Record<string, any> {
  const base = componentData(componentType)?.defaultData() ?? {};
  const entry = nodeData(nodeType)?.defaultComponents.find(
    (e) => entryType(e) === componentType,
  );
  const override = typeof entry === "string" || !entry ? {} : entry.data;
  return deepMerge(base, override);
}

export function migrated(type: ComponentType, data: Record<string, any>) {
  return componentData(type)?.migrate?.(data) ?? data;
}

export interface SlideState {
  nodes: NodeModel[];
  components: ComponentModel[];
}

export type ComponentRef = DeleteComponent;

export interface NodeDeletion extends DeleteNode {
  id: string;
}

export interface OutboxOps {
  nodes: string[];
  deletes: NodeDeletion[];
  components: ComponentRef[];
  componentDeletes: ComponentRef[];
}

export function remapSlideState(
  state: SlideState,
  resolve: (id: string) => string,
): SlideState {
  const stale =
    state.nodes.some((n) => resolve(n.id) !== n.id) ||
    state.components.some((c) => resolve(c.node) !== c.node);

  if (!stale) return state;

  return {
    nodes: state.nodes.map((n) => {
      const id = resolve(n.id);

      return id === n.id ? n : { ...n, id };
    }),
    components: state.components.map((c) => {
      const node = resolve(c.node);

      return node === c.node ? c : { ...c, node };
    }),
  };
}

const sameNode = (a: NodeModel, b: NodeModel) =>
  a.name === b.name &&
  a.path === b.path &&
  a.type === b.type &&
  a.locked === b.locked &&
  a.sort_order === b.sort_order &&
  a.reference === b.reference &&
  JSON.stringify(a.unsynced) === JSON.stringify(b.unsynced);

export function diffSlideState(
  current: SlideState,
  target: SlideState,
): OutboxOps {
  const ops: OutboxOps = {
    nodes: [],
    deletes: [],
    components: [],
    componentDeletes: [],
  };

  const currentNodes = new Map(current.nodes.map((n) => [n.id, n]));

  for (const node of target.nodes) {
    const was = currentNodes.get(node.id);
    if (!was || !sameNode(was, node)) ops.nodes.push(node.id);
  }

  const targetIds = new Set(target.nodes.map((n) => n.id));

  for (const node of current.nodes) {
    if (node.path === ROOT_PATH) continue;

    if (!targetIds.has(node.id))
      ops.deletes.push({ path: node.path, slides: node.slides, id: node.id });
  }

  const key = (c: ComponentModel) => componentKey(c.node, c.type);
  const currentComponents = new Map(current.components.map((c) => [key(c), c]));

  for (const component of target.components) {
    const was = currentComponents.get(key(component));

    if (!was || JSON.stringify(was.data) !== JSON.stringify(component.data))
      ops.components.push({ node: component.node, type: component.type });
  }

  const targetKeys = new Set(target.components.map(key));

  for (const component of current.components) {
    if (!targetKeys.has(key(component)))
      ops.componentDeletes.push({
        node: component.node,
        type: component.type,
      });
  }

  return ops;
}

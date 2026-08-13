export type DeleteNode = { path: string; slides: string };
export type DeleteComponent = { node: string; type: ComponentType };
export type UpsertNode = Pick<
  NodeModel,
  "id" | "slides" | "name" | "path" | "reference" | "type" | "sort_order"
>;

export type SavePayload = {
  nodesToUpsert: UpsertNode[];
  nodesToDelete: DeleteNode[];
  componentsToUpsert: ComponentModel[];
  componentsToDelete: DeleteComponent[];
};

export type OutboxSnapshot = {
  dirtyNodes: string[];
  deletedNodes: DeleteNode[];
  dirtyComponents: string[];
  deletedComponents: string[];
};

export function componentKey(node: string, type: string): string {
  return `${node}:${type}`;
}

export function parseComponentKey(key: string): DeleteComponent {
  const [node, type] = key.split(":");

  return { node: node!, type: type as ComponentType };
}

export function isEmptyPayload(payload: SavePayload): boolean {
  return (
    !payload.nodesToUpsert.length &&
    !payload.nodesToDelete.length &&
    !payload.componentsToUpsert.length &&
    !payload.componentsToDelete.length
  );
}

export function buildSavePayload(
  snapshot: OutboxSnapshot,
  resolveNode: (id: string) => NodeModel | undefined,
  resolveComponent: (key: string) => ComponentModel | undefined,
): SavePayload {
  const nodesToUpsert: UpsertNode[] = [];
  for (const id of snapshot.dirtyNodes) {
    const n = resolveNode(id);
    if (!n) continue;
    nodesToUpsert.push({
      id: n.id,
      slides: n.slides,
      name: n.name,
      path: n.path,
      reference: n.reference,
      type: n.type,
      sort_order: n.sort_order,
    });
  }

  const componentsToUpsert: ComponentModel[] = [];
  for (const key of snapshot.dirtyComponents) {
    const c = resolveComponent(key);
    if (c) componentsToUpsert.push(c);
  }

  return {
    nodesToUpsert,
    nodesToDelete: snapshot.deletedNodes,
    componentsToUpsert,
    componentsToDelete: snapshot.deletedComponents.map(parseComponentKey),
  };
}

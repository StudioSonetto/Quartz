export function isGuaranteed(nodeType: NodeType, type: ComponentType): boolean {
  return (
    getNodeType(nodeType)?.defaultComponents.some(
      (entry) => entryType(entry) === type,
    ) ?? false
  );
}

export function optionalComponentsFor(nodeType: NodeType): ComponentTypeDef[] {
  const guaranteed = new Set(
    getNodeType(nodeType)?.defaultComponents.map(entryType) ?? [],
  );

  return allComponentTypes().filter(
    (c) => c.optional && !guaranteed.has(c.type),
  );
}

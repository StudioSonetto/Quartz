export function useNodeComponents() {
  const { currentComponents } = storeToRefs(useDeckStore());
  const { scopeFor } = useVariableScope();

  function getNodeComponent(node: string, type: ComponentType) {
    return currentComponents.value?.find(
      (component) => component.type === type && component.node === node,
    );
  }

  function resolvedData(node: Tree, type: ComponentType) {
    const data = getNodeComponent(node.id, type)?.data;

    return data && resolveData(data, () => scopeFor(node));
  }

  function getNodeComponents(node: string): ComponentModel[] {
    if (!currentComponents.value) return [];

    return currentComponents.value
      .filter((component) => component.node === node)
      .sort((a, b) => a.type.localeCompare(b.type));
  }

  function isGridChild(node: Tree) {
    const parent = node.parent;

    if (!parent) return false;

    return getNodeComponent(parent.id, "core.layout")?.data.mode === "grid";
  }

  return {
    getNodeComponent,
    getNodeComponents,
    resolvedData,
    isGridChild,
  };
}

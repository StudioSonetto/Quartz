export function useNodeComponents() {
  const { currentComponents } = storeToRefs(useDeckStore());

  function getNodeComponent(node: string, type: string) {
    return currentComponents.value?.find(
      (component) => component.type === type && component.node === node,
    );
  }

  function getNodeComponents(node: string): ComponentModel[] {
    if (!currentComponents.value) return [];

    return currentComponents.value
      .filter((component) => component.node === node)
      .sort((a, b) => a.type.localeCompare(b.type));
  }

  return {
    getNodeComponent,
    getNodeComponents,
  };
}

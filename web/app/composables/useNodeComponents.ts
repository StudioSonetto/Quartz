export function useNodeComponents() {
  const { currentComponents } = storeToRefs(useDeckStore());
  const { scopeFor } = useVariableScope();
  const { activeState, transition } = useAnimationState();

  function getStoredComponent(node: string, type: ComponentType) {
    return currentComponents.value?.find(
      (component) => component.type === type && component.node === node,
    );
  }

  function stateComponent(
    node: string,
    type: ComponentType,
    anim = getStoredComponent(node, "core.animation")?.data,
  ) {
    if (isStateless(type)) return undefined;

    const data = overridesFor(anim, activeState(node), type);

    return data ? ({ node, type, data } as ComponentModel) : undefined;
  }

  function getNodeComponent(node: string, type: ComponentType) {
    return stateComponent(node, type) ?? getStoredComponent(node, type);
  }

  function stagedData(node: Tree, type: ComponentType) {
    const raw =
      getStoredComponent(node.id, type)?.data ??
      effectiveDefaults(node.type, type);

    const state = activeState(node.id);
    const move = transition(node.id);

    if (!move && !state) return raw;

    const anim = getStoredComponent(node.id, "core.animation")?.data;
    const at = (name: string) =>
      applyState(raw, overridesFor(anim, name, type));

    if (!move) return at(state);

    const from = at(move.from);
    const to = at(move.to);

    return from === to ? from : blendData(from, to, move.t);
  }

  function renderData(node: Tree, type: ComponentType) {
    return resolveData(stagedData(node, type), () => scopeFor(node));
  }

  function getNodeComponents(node: string): ComponentModel[] {
    if (!currentComponents.value) return [];

    const anim = getStoredComponent(node, "core.animation")?.data;

    return currentComponents.value
      .filter((component) => component.node === node)
      .map(
        (component) => stateComponent(node, component.type, anim) ?? component,
      )
      .sort((a, b) => a.type.localeCompare(b.type));
  }

  function isGridChild(node: Tree) {
    const parent = node.parent;

    if (!parent) return false;

    return getNodeComponent(parent.id, "core.layout")?.data.mode === "grid";
  }

  return {
    getNodeComponent,
    getStoredComponent,
    stagedData,
    renderData,
    getNodeComponents,
    isGridChild,
  };
}

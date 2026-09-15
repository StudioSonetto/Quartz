export function useNodeComponents() {
  const { currentComponents, componentIndex } = storeToRefs(useDeckStore());
  const { scopeFor } = useVariableScope();
  const { activeState, transition } = useAnimationState();
  const { nodeTime } = usePlayhead();

  function getStoredComponent(node: string, type: ComponentType) {
    return componentIndex.value.get(componentKey(node, type));
  }

  function stateComponent(
    node: string,
    type: ComponentType,
    base = getStoredComponent(node, "core.base")?.data,
  ) {
    if (isStateless(type)) return undefined;

    const data = overridesFor(base, activeState(node), type);

    return data ? ({ node, type, data } as ComponentModel) : undefined;
  }

  function getNodeComponent(node: string, type: ComponentType) {
    return stateComponent(node, type) ?? getStoredComponent(node, type);
  }

  function stagedData(node: Tree, type: ComponentType) {
    const anim = getStoredComponent(node.id, "core.animation")?.data;
    const t = nodeTime(anim);

    const sampled = sampleTracks(
      anim?.tracks,
      t,
      type,
      getStoredComponent(node.id, type)?.data ??
        effectiveDefaults(node.type, type),
    );

    const state = activeState(node.id);
    const move = transition(node.id);

    if (!anim?.stateKeys?.length && !move && !state) return sampled;

    const base = getStoredComponent(node.id, "core.base")?.data;

    const raw = scheduledData(base, anim?.stateKeys, t, type, sampled);

    if (!move && !state) return raw;

    const at = (name: string) =>
      applyState(raw, overridesFor(base, name, type));

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

    const base = getStoredComponent(node, "core.base")?.data;

    return currentComponents.value
      .filter((component) => component.node === node)
      .map(
        (component) => stateComponent(node, component.type, base) ?? component,
      )
      .sort((a, b) => a.type.localeCompare(b.type));
  }

  function isGridChild(node: Tree) {
    const parent = node.parent;

    if (!parent) return false;

    return getNodeComponent(parent.id, "core.layout")?.data.mode === "grid";
  }

  function groupOffset(node: Tree) {
    let x = 0;
    let y = 0;

    for (let parent = node.parent; parent; parent = parent.parent) {
      if (parent.type !== "core.group" || parent.path === ROOT_PATH) continue;
      if (isGridChild(parent)) continue;
      if (renderData(parent, "core.layout").mode === "grid") continue;

      const { position } = renderData(parent, "core.transform");

      x += position.x;
      y += position.y;
    }

    return { x, y };
  }

  return {
    getNodeComponent,
    getStoredComponent,
    stagedData,
    renderData,
    getNodeComponents,
    isGridChild,
    groupOffset,
  };
}

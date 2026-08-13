export const renderScaleKey: InjectionKey<Ref<number>> = Symbol("renderScale");

export function useElementRenderer() {
  const { getStoredComponent, stagedData } = useNodeComponents();
  const { imageUrl } = useAssetsStore();

  function findComponent(node: Tree, type: ComponentType) {
    return getStoredComponent(node.id, type);
  }

  const scale = inject(
    renderScaleKey,
    computed(() => 1),
  );

  const { scopeFor } = useVariableScope();

  function resolveRender(node: Tree) {
    const def = getNodeType(node.type);

    if (!def) return undefined;

    let scopeId: string | undefined;
    let scope: Scope;

    function cachedScope(target: Tree) {
      if (scopeId !== target.id) {
        scope = scopeFor(target);
        scopeId = target.id;
      }

      return scope;
    }

    const ctx: RenderContext = {
      findComponent,
      data: (node: Tree, type: ComponentType) =>
        resolveData(stagedData(node, type), () => cachedScope(node)),
      optional: (node: Tree, type: ComponentType) =>
        findComponent(node, type)?.data,
      scale: scale.value,
      module: <T>(moduleId: string) => {
        const api = getModuleApi<T>(moduleId);

        if (!api) throw new Error(`Module "${moduleId}" is not registered`);

        return api;
      },
      assetUrl: imageUrl,
    };

    return { element: def.renderer.element, ...def.renderer.render(node, ctx) };
  }

  return {
    resolveRender,
  };
}

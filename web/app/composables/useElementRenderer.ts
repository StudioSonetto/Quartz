import { getNodeType, getModuleApi } from "~/modules/registry";
import { effectiveDefaults } from "~/utils/normaliseComponents";

export const renderScaleKey: InjectionKey<Ref<number>> = Symbol("renderScale");

export function useElementRenderer() {
  const { getNodeComponent } = useNodeComponents();
  const { imageUrl } = useAssetsStore();

  function findComponent(node: Tree, type: ComponentType) {
    return getNodeComponent(node.id, type);
  }

  const scale = inject(
    renderScaleKey,
    computed(() => 1),
  );

  const { scopeFor } = useVariableScope();

  function resolveRender(node: Tree) {
    const def = getNodeType(node.type);

    if (!def) return undefined;

    // Renderers read several components per node, and the scope cannot change
    // within one pass — build it at most once per node.
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
      data: (node: Tree, type: ComponentType) => {
        const raw =
          findComponent(node, type)?.data ?? effectiveDefaults(node.type, type);

        return resolveData(raw, () => cachedScope(node));
      },
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

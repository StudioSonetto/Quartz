import { getNodeType, getModuleApi } from "~/modules/registry";
import { effectiveDefaults } from "~/utils/normaliseComponents";

export const renderScaleKey: InjectionKey<Ref<number>> = Symbol("renderScale");

export function useElementRenderer() {
  const { getNodeComponent } = useNodeComponents();

  function findComponent(node: Tree, type: ComponentType) {
    return getNodeComponent(node.id, type);
  }

  const scale = inject(
    renderScaleKey,
    computed(() => 1),
  );

  function resolveRender(node: Tree) {
    const def = getNodeType(node.type);

    if (!def) return undefined;

    const ctx: RenderContext = {
      findComponent,
      data: (node: Tree, type: ComponentType) =>
        findComponent(node, type)?.data ?? effectiveDefaults(node.type, type),
      optional: (node: Tree, type: ComponentType) =>
        findComponent(node, type)?.data,
      scale: scale.value,
      module: <T>(moduleId: string) => {
        const api = getModuleApi<T>(moduleId);

        if (!api) throw new Error(`Module "${moduleId}" is not registered`);

        return api;
      },
    };

    return { element: def.renderer.element, ...def.renderer.render(node, ctx) };
  }

  return {
    resolveRender,
  };
}

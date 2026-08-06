import type { ShallowRef } from "vue";

export const renderRootKey: InjectionKey<
  Readonly<ShallowRef<HTMLElement | null>>
> = Symbol("renderRoot");

export function useCanvasScale() {
  const { canvasSize } = storeToRefs(useAtelierStore());

  const provided = getCurrentInstance() ? inject(renderRootKey, null) : null;
  const found = shallowRef<HTMLElement | null>(null);

  const renderRoot = provided ?? found;

  function findRenderEl() {
    if (import.meta.server) return null;

    if (provided) return provided.value;

    if (!found.value?.isConnected)
      found.value = document.querySelector<HTMLElement>(".render");

    return found.value;
  }

  function scale() {
    const el = findRenderEl();

    return {
      x: canvasSize.value.width / (el?.clientWidth || canvasSize.value.width),
      y:
        canvasSize.value.height / (el?.clientHeight || canvasSize.value.height),
    };
  }

  return { findRenderEl, renderRoot, scale };
}

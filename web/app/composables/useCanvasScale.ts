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

  function canvasRect(element: Element): Rect | null {
    const container = findRenderEl();

    if (!container) return null;

    const r = element.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    const s = scale();

    return {
      left: (r.left - c.left) * s.x,
      top: (r.top - c.top) * s.y,
      width: r.width * s.x,
      height: r.height * s.y,
    };
  }

  return { canvasRect, findRenderEl, renderRoot, scale };
}

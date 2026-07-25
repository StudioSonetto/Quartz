export function useCanvasScale() {
  const { canvasSize } = storeToRefs(useAtelierStore());

  let cached: HTMLElement | null = null;

  function renderEl() {
    if (!cached || !cached.isConnected) {
      cached = document.querySelector(".render");
    }

    return cached;
  }

  function scale() {
    const el = renderEl();

    return {
      x: canvasSize.value.width / (el?.clientWidth || canvasSize.value.width),
      y:
        canvasSize.value.height / (el?.clientHeight || canvasSize.value.height),
    };
  }

  return { renderEl, scale };
}

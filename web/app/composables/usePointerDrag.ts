export function usePointerDrag() {
  const history = useHistoryStore();

  let active: (() => void) | null = null;

  function start(
    label: string,
    onMove: (ev: PointerEvent) => void,
    onEnd?: () => void,
    onFrame?: () => void,
  ) {
    active?.();

    const end = history.begin(label);

    let raf = 0;
    let latest: PointerEvent | null = null;

    function flush() {
      raf = 0;

      if (latest) onMove(latest);
    }

    function move(ev: PointerEvent) {
      latest = ev;

      if (!raf) raf = requestAnimationFrame(flush);
    }

    let frameRaf = 0;

    if (onFrame) {
      frameRaf = requestAnimationFrame(function tick() {
        onFrame();
        frameRaf = requestAnimationFrame(tick);
      });
    }

    function up() {
      if (raf) cancelAnimationFrame(raf);
      if (frameRaf) cancelAnimationFrame(frameRaf);

      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);

      onEnd?.();
      end();

      const swallowClick = (ev: MouseEvent) => ev.stopPropagation();

      window.addEventListener("click", swallowClick, {
        capture: true,
        once: true,
      });
      setTimeout(
        () =>
          window.removeEventListener("click", swallowClick, {
            capture: true,
          }),
        0,
      );

      active = null;
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    active = up;
  }

  onScopeDispose(() => active?.());

  return { start };
}

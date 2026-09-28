const WHEEL_SCALE = [1, 16, 800];

function swallowContextMenu() {
  const swallow = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  window.addEventListener("contextmenu", swallow, {
    capture: true,
    once: true,
  });
  window.addEventListener(
    "pointerdown",
    () => window.removeEventListener("contextmenu", swallow, { capture: true }),
    { capture: true, once: true },
  );
}

export function useNavigateGesture(
  navigate: (node: Tree) => NavigateGesture | undefined,
  node: () => Tree,
  element: Readonly<Ref<HTMLElement | null>>,
  disabled: () => boolean,
) {
  const drag = usePointerDrag();
  const atelier = useAtelierStore();

  let wheel: NavigateGesture | undefined;
  let zoom = 0;
  let wheelFrame = 0;

  const open = () => navigate(node());

  useEventListener(element, "pointerdown", (event: PointerEvent) => {
    if ((event.button !== 1 && event.button !== 2) || disabled()) return;

    const gesture = open();

    if (!gesture) return;

    event.preventDefault();

    if (event.button === 2) swallowContextMenu();

    const pan = event.button === 1 || event.shiftKey;

    let last = { x: event.clientX, y: event.clientY };

    drag.start(null, (ev) => {
      const dx = ev.clientX - last.x;
      const dy = ev.clientY - last.y;

      if (pan) gesture.pan(dx, dy);
      else gesture.orbit(dx, dy);

      last = { x: ev.clientX, y: ev.clientY };
    });
  });

  useEventListener(
    element,
    "wheel",
    (event: WheelEvent) => {
      if (disabled() || isPointerDragging() || atelier.isDragging) return;

      wheel ??= open();

      if (!wheel) return;

      event.preventDefault();

      zoom +=
        event.deltaY *
        (WHEEL_SCALE[event.deltaMode] ?? 1) *
        (event.ctrlKey ? 10 : 1);

      wheelFrame ||= requestAnimationFrame(() => {
        wheelFrame = 0;

        wheel?.zoom(zoom);
        wheel = undefined;
        zoom = 0;
      });
    },
    { passive: false },
  );

  onScopeDispose(() => cancelAnimationFrame(wheelFrame));
}

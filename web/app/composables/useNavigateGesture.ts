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
  node: () => Tree,
  element: Readonly<Ref<HTMLElement | null>>,
  disabled: () => boolean,
) {
  const target = computed(() =>
    getNodeType(node().type)?.navigate ? element.value : null,
  );
  const drag = usePointerDrag();
  const history = useHistoryStore();
  const atelier = useAtelierStore();

  let dragging = false;
  let zoom = 0;
  let wheelFrame = 0;

  const open = (event: MouseEvent) =>
    getNodeType(node().type)?.navigate?.(node(), event);

  useEventListener(target, "pointerdown", (event: PointerEvent) => {
    if ((event.button !== 1 && event.button !== 2) || disabled()) return;

    const gesture = open(event);

    if (!gesture) return;

    event.preventDefault();

    if (event.button === 2) swallowContextMenu();

    const pan = event.button === 1 || event.shiftKey;

    let last = { x: event.clientX, y: event.clientY };

    drag.start(
      "Navigate",
      (ev) => {
        const dx = ev.clientX - last.x;
        const dy = ev.clientY - last.y;

        if (pan) gesture.pan(dx, dy);
        else gesture.orbit(dx, dy);

        last = { x: ev.clientX, y: ev.clientY };
      },
      () => (dragging = false),
    );

    dragging = true;
  });

  useEventListener(
    target,
    "wheel",
    (event: WheelEvent) => {
      if (disabled() || dragging || atelier.isDragging) return;

      event.preventDefault();

      zoom +=
        event.deltaY *
        (WHEEL_SCALE[event.deltaMode] ?? 1) *
        (event.ctrlKey ? 10 : 1);

      wheelFrame ||= requestAnimationFrame(() => {
        wheelFrame = 0;

        const gesture = open(event);

        if (gesture) {
          history.captureCurrent(`navigate:${node().id}`);
          gesture.zoom(zoom);
        }

        zoom = 0;
      });
    },
    { passive: false },
  );

  onScopeDispose(() => cancelAnimationFrame(wheelFrame));
}

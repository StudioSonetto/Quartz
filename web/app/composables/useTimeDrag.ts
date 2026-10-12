const EDGE_SPEED = 0.1;
const SNAP_PX = 6;

export const timeSnapping = ref(true);

export const SNAP_TARGETS: InjectionKey<() => number[]> = Symbol("snap");

export function useTimeDrag() {
  const { start } = usePointerDrag();
  const { view, pan } = usePlayhead();
  const targets = inject(SNAP_TARGETS, () => []);

  return function startTimeDrag(
    event: PointerEvent,
    box: DOMRect,
    onTime: (t: number) => void,
    {
      label,
      onEnd,
      skip,
    }: { label?: string; onEnd?: () => void; skip?: () => number } = {},
  ) {
    let x = event.clientX;

    const update = () => {
      const t = timeAtPointer(box, x, view);
      const near = targets().filter((target) => target !== skip?.());

      onTime(
        timeSnapping.value
          ? snapTime(t, near, (SNAP_PX / box.width) * view.span)
          : t,
      );
    };

    start(
      label ?? null,
      (e) => {
        x = e.clientX;
        update();
      },
      onEnd,
      () => {
        const over = Math.min(x - box.left, 0) + Math.max(x - box.right, 0);

        if (!over) return;

        pan(((over * view.span) / box.width) * EDGE_SPEED);
        update();
      },
    );

    return update;
  };
}

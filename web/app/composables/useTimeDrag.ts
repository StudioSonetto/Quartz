const EDGE_SPEED = 0.1;

export function useTimeDrag() {
  const { start } = usePointerDrag();
  const { view, pan } = usePlayhead();

  return function startTimeDrag(
    event: PointerEvent,
    box: DOMRect,
    label: string | null,
    onTime: (t: number) => void,
    onEnd?: () => void,
  ) {
    let x = event.clientX;

    const update = () => onTime(timeAtPointer(box, x, view));

    start(
      label,
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
  };
}

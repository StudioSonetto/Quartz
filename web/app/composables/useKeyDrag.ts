export function useKeyDrag(
  lane: () => HTMLElement | null,
  duration: () => number,
  emit: (event: "move", from: number, to: number) => void,
) {
  const { start } = usePointerDrag();

  return function startDrag(event: PointerEvent, key: { t: number }) {
    event.preventDefault();

    const box = lane()?.getBoundingClientRect();

    if (!box) return;

    let current = key.t;

    start("Move key", (e) => {
      const to = timeAtPointer(box, e.clientX, duration());

      if (to === current) return;

      emit("move", current, to);
      current = to;
    });
  };
}

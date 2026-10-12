export const draggedKeyTime = ref<number | null>(null);

export function useKeyDrag(
  lane: () => HTMLElement | null,
  keys: () => { t: number }[],
  emit: (event: "move", from: number, to: number) => void,
) {
  const startTimeDrag = useTimeDrag();
  const { seek } = usePlayhead();

  return function startDrag(event: PointerEvent, key: { t: number }) {
    if (event.button !== 0) return;

    event.preventDefault();

    const box = lane()?.getBoundingClientRect();

    if (!box) return;

    let current = key.t;

    draggedKeyTime.value = current;

    startTimeDrag(
      event,
      box,
      (to) => {
        if (to === current || keys().some((k) => k.t === to)) return;

        emit("move", current, to);
        current = draggedKeyTime.value = to;
      },
      {
        label: "Move key",
        skip: () => current,
        onEnd: () => {
          draggedKeyTime.value = null;

          if (current === key.t) seek(key.t);
        },
      },
    );
  };
}

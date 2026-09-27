export function usePresentationControls(
  enabled: () => boolean,
  onEscape?: () => void,
) {
  const deck = useDeckStore();
  const { currentTree } = storeToRefs(deck);
  const { fireTree } = useEventDispatch();

  useEventListener(window, "keydown", (event: KeyboardEvent) => {
    if (!enabled()) return;

    const combo = eventToCombo(event);

    if (fireTree(currentTree.value, "key", combo))
      return event.preventDefault();
    if (combo === "escape") return onEscape?.();
    if (combo === "arrowleft") return deck.prevSlides();
    if (["enter", " ", "arrowright"].includes(combo)) return deck.nextSlides();
  });

  watch(currentTree, (next) => enabled() && fireTree(next, "enter"), {
    flush: "post",
  });

  return {
    click: () => enabled() && deck.prevSlides(),
    contextmenu: (event: MouseEvent) => {
      event.preventDefault();

      if (enabled()) deck.nextSlides();
    },
  };
}

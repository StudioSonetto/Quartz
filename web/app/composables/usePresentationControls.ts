export function usePresentationControls(
  enabled: () => boolean,
  onEscape?: () => void,
) {
  const deck = useDeckStore();

  deck.slideTransitions = true;
  onScopeDispose(() => (deck.slideTransitions = false));

  const { currentTree, clockSpans } = storeToRefs(deck);
  const { fireTree, hasAction } = useEventDispatch();

  useEventListener(window, "keydown", (event: KeyboardEvent) => {
    if (!enabled()) return;

    const combo = eventToCombo(event);

    if (fireTree(currentTree.value, "key", combo))
      return event.preventDefault();
    if (combo === "escape") return onEscape?.();
    if (combo === "arrowleft") return deck.prevSlides();
    if (["enter", " ", "arrowright"].includes(combo)) return deck.nextSlides();
  });

  onScopeDispose(
    deck.onSlideEnter((tree) => {
      if (!enabled()) return;

      fireTree(tree, "enter");

      // A slide wired to start on a trigger is left to that trigger.
      if (clockSpans.value.length && !hasAction(tree, "animate"))
        usePlayhead().play();
    }),
  );

  return {
    click: () => enabled() && deck.prevSlides(),
    contextmenu: (event: MouseEvent) => {
      event.preventDefault();

      if (enabled()) deck.nextSlides();
    },
  };
}

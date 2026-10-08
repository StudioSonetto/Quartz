export const EVENT_TRIGGERS = ["click", "hover", "key", "enter"] as const;

export const EVENT_ACTIONS = [
  "setState",
  "toggleState",
  "animate",
  "seek",
  "nextSlide",
  "prevSlide",
  "goToSlide",
  "transition",
] as const;

export type EventTrigger = (typeof EVENT_TRIGGERS)[number];
export type EventAction = (typeof EVENT_ACTIONS)[number];

export type EventHandler = {
  on: EventTrigger;
  action: EventAction;
  key?: string;
  state?: string;
  duration?: number;
  time?: number;
  slide?: number;
  kind?: SlideTransitionKind;
  easing?: string;
};

export function useEventDispatch() {
  const interactive = inject(interactiveKey, ref(true));

  function handlersFor(node: Tree, on: EventTrigger, key?: string) {
    const stored = useNodeComponents().getStoredComponent(
      node.id,
      "core.event",
    );
    const all: EventHandler[] = stored?.data?.handlers ?? [];

    return all.filter((h) => h.on === on && (on !== "key" || h.key === key));
  }

  function fire(node: Tree, on: EventTrigger, key?: string): boolean {
    if (!interactive.value) return false;

    const handlers = handlersFor(node, on, key);

    if (!handlers.length) return false;

    const deck = useDeckStore();
    const { activeState, animateToState } = useAnimationState();

    let ran = false;

    for (const handler of handlers) {
      switch (handler.action) {
        case "setState":
        case "toggleState": {
          const target = handler.state ?? BASE_STATE;
          const current = activeState(node.id);
          const next =
            handler.action === "toggleState" && current === target
              ? BASE_STATE
              : target;

          if (next === current) break;

          animateToState(node.id, next, handler.duration);
          ran = true;
          break;
        }
        case "animate":
          usePlayhead().play();
          ran = true;
          break;
        case "seek":
          usePlayhead().seek(roundTime(Number(handler.time ?? 0)));
          ran = true;
          break;
        case "nextSlide":
          deck.nextSlides();
          ran = true;
          break;
        case "prevSlide":
          deck.prevSlides();
          ran = true;
          break;
        case "goToSlide":
          deck.goToSlide(Number(handler.slide ?? 0));
          ran = true;
          break;
      }
    }

    return ran;
  }

  function fireTree(
    tree: Tree | undefined,
    on: EventTrigger,
    key?: string,
  ): boolean {
    if (!tree) return false;

    let ran = false;

    for (const node of flattenTree(tree)) {
      if (fire(node, on, key)) ran = true;
    }

    return ran;
  }

  const hasAction = (tree: Tree, action: EventAction) =>
    flattenTree(tree).some((node) =>
      EVENT_TRIGGERS.some((on) =>
        handlersFor(node, on).some((handler) => handler.action === action),
      ),
    );

  return { fire, fireTree, hasAction };
}

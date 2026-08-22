export const EVENT_TRIGGERS = ["click", "hover", "key", "enter"] as const;

export const EVENT_ACTIONS = [
  "setState",
  "toggleState",
  "nextSlide",
  "prevSlide",
  "goToSlide",
] as const;

export type EventTrigger = (typeof EVENT_TRIGGERS)[number];
export type EventAction = (typeof EVENT_ACTIONS)[number];

export type EventHandler = {
  on: EventTrigger;
  action: EventAction;
  key?: string;
  state?: string;
  slide?: number;
};

export function useEventDispatch() {
  function handlersFor(node: Tree, on: EventTrigger, key?: string) {
    const stored = useNodeComponents().getStoredComponent(
      node.id,
      "core.event",
    );
    const all: EventHandler[] = stored?.data?.handlers ?? [];

    return all.filter((h) => h.on === on && (on !== "key" || h.key === key));
  }

  function fire(node: Tree, on: EventTrigger, key?: string): boolean {
    const handlers = handlersFor(node, on, key);

    if (!handlers.length) return false;

    const deck = useDeckStore();
    const { activeState, animateTo } = useAnimationState();
    const timing =
      useNodeComponents().getStoredComponent(node.id, "core.animation")?.data ??
      {};

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

          animateTo(node.id, next, timing);
          ran = true;
          break;
        }
        case "nextSlide":
          deck.nextSlides();
          ran = true;
          break;
        case "prevSlide":
          deck.prevSlides();
          ran = true;
          break;
        case "goToSlide":
          deck.currentSlidesIndex = Number(handler.slide ?? 0);
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

  return { fire, fireTree };
}

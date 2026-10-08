export const SLIDE_TRANSITION_KINDS = ["fade", "push", "magic"] as const;

export type SlideTransitionKind = (typeof SLIDE_TRANSITION_KINDS)[number];

export const transitionHandler = (handlers: EventHandler[] | undefined) =>
  handlers?.find((h) => h.on === "enter" && h.action === "transition");

const ident = (text: string) =>
  "m-" +
  [...text]
    .map((c) =>
      /[a-zA-Z0-9-]/.test(c) ? c : `_${c.codePointAt(0)!.toString(36)}_`,
    )
    .join("");

export function magicNames(nodes: Pick<Tree, "id" | "type" | "name">[]) {
  const names = new Map<string, string>();
  const seen = new Set<string>();

  for (const node of nodes) {
    const name = ident(`${node.type}/${node.name}`);

    if (!seen.has(name)) {
      names.set(node.id, name);
      seen.add(name);
      continue;
    }

    for (const [id, other] of names) if (other === name) names.delete(id);
  }

  return names;
}

function nameElements(nodes: Tree[]) {
  for (const [id, name] of magicNames(nodes)) {
    const el = document.getElementById(id);

    if (el) el.style.viewTransitionName = name;
  }
}

function clearNames() {
  for (const el of document.querySelectorAll<HTMLElement>(".render [id]"))
    el.style.viewTransitionName = "";
}

export async function playSlideTransition(
  handler: EventHandler,
  back: boolean,
  change: () => void,
  nodes: () => Tree[],
) {
  const root = document.documentElement;
  const duration = handler.duration ?? DEFAULT_HANDLER_DURATION;
  const magic = handler.kind === "magic";

  root.style.setProperty("--slide-duration", `${duration}ms`);
  root.style.setProperty(
    "--slide-easing",
    cssEasing(handler.easing ?? "ease-out", duration),
  );
  root.dataset.slideTransition = handler.kind ?? "fade";
  root.dataset.slideDirection = back ? "back" : "forward";

  if (magic) nameElements(nodes());

  const transition = document.startViewTransition(async () => {
    clearNames();
    change();
    await nextTick();

    if (magic) nameElements(nodes());
  });

  try {
    await transition.finished;
  } finally {
    clearNames();
    delete root.dataset.slideTransition;
    delete root.dataset.slideDirection;
  }
}

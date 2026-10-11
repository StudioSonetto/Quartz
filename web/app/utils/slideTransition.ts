export const SLIDE_TRANSITION_KINDS = [
  "fade",
  "push",
  "magic",
  "none",
] as const;

export type TransitionData = {
  kind: (typeof SLIDE_TRANSITION_KINDS)[number];
  duration: number;
  easing: string;
};

const ident = (text: string) =>
  "m-" +
  [...text]
    .map((c) =>
      /[a-zA-Z0-9-]/.test(c) ? c : `_${c.codePointAt(0)!.toString(36)}_`,
    )
    .join("");

export function magicNames(nodes: Pick<Tree, "id" | "type" | "name">[]) {
  const pairs = nodes.map((n) => [n.id, ident(`${n.type}/${n.name}`)] as const);
  const count = new Map<string, number>();

  for (const [, name] of pairs) count.set(name, (count.get(name) ?? 0) + 1);

  return new Map(pairs.filter(([, name]) => count.get(name) === 1));
}

export type TransitionNode = Pick<Tree, "id" | "type" | "name"> & {
  transition?: TransitionData;
};

export function transitionPlan(
  root: TransitionData | undefined,
  before: TransitionNode[],
  after: TransitionNode[],
) {
  const names = new Map<string, string>();
  const groups = new Map<string, TransitionData>([
    ["slide", root ?? { kind: "none", duration: 0, easing: "linear" }],
  ]);

  for (const nodes of [before, after]) {
    const magic = new Set(
      nodes.filter((node) =>
        node.transition
          ? node.transition.kind === "magic"
          : root?.kind === "magic",
      ),
    );
    const unique = magicNames([...magic]);

    for (const node of nodes) {
      const name = magic.has(node)
        ? unique.get(node.id)
        : node.transition && `t-${node.id}`;

      if (!name) continue;

      names.set(node.id, name);
      groups.set(name, node.transition ?? root!);
    }
  }

  if ([...groups.values()].every((group) => group.kind === "none")) return;

  return { names, groups };
}

type SlideSide = { tree?: Tree; components?: ComponentModel[] };

export function slidePlan(before: SlideSide, after: SlideSide) {
  const transitionsOf = ({ components }: SlideSide) =>
    new Map(
      components
        ?.filter((c) => c.type === "core.transition")
        .map((c) => [c.node, c.data as TransitionData]),
    );

  const old = transitionsOf(before);
  const next = transitionsOf(after);

  if (!old.size && !next.size) return;

  const nodesOf = ({ tree }: SlideSide, transitions: typeof old) =>
    (tree ? flattenTree(tree) : [])
      .filter((node) => node.path !== ROOT_PATH)
      .map(({ id, type, name }) => ({
        id,
        type,
        name,
        transition: transitions.get(id),
      }));

  return transitionPlan(
    after.tree && next.get(after.tree.id),
    nodesOf(before, old),
    nodesOf(after, next),
  );
}

let named: HTMLElement[] = [];
let playing = 0;

function nameElements(names: Map<string, string> = new Map()) {
  for (const el of named) el.style.viewTransitionName = "";

  named = [];

  for (const [id, name] of names) {
    const el = document.querySelector<HTMLElement>(
      `.render [data-node="${id}"]`,
    );

    if (!el) continue;

    el.style.viewTransitionName = name;
    named.push(el);
  }
}

const PSEUDO = /^::view-transition-(group|old|new)\((.+)\)$/;

function retime(groups: Map<string, TransitionData>, back: boolean) {
  const root = document.documentElement;
  const timings = new Map<string, { duration: number; easing: string }>();
  const replaced = new Set<string>();

  for (const animation of root.getAnimations({ subtree: true })) {
    const effect = animation.effect as KeyframeEffect | null;
    const pseudoElement = effect?.pseudoElement ?? "";
    const [, part, name] = pseudoElement.match(PSEUDO) ?? [];
    const group = name ? groups.get(name) : undefined;

    if (!group) continue;

    if (!timings.has(name!))
      timings.set(name!, {
        duration: group.duration,
        easing: cssEasing(group.easing, group.duration),
      });

    const timing = timings.get(name!)!;
    const replace = group.kind === "none" || (group.kind === "push" && part !== "group");

    if (!replace) {
      effect!.updateTiming(timing);
      continue;
    }

    animation.cancel();

    // Each layer runs two built-in animations; one replacement is enough.
    if (replaced.has(pseudoElement)) continue;

    replaced.add(pseudoElement);

    if (group.kind === "none") {
      // Held for the whole transition, or the old picture reappears once a short animation ends.
      if (part === "old")
        root.animate(
          { opacity: [0, 0] },
          { duration: 1, fill: "forwards", pseudoElement },
        );

      continue;
    }

    const x = `translateX(${(part === "old") === back ? "" : "-"}100%)`;

    root.animate(
      { transform: part === "old" ? ["none", x] : [x, "none"] },
      { ...timing, fill: "both", pseudoElement },
    );
  }
}

export async function playSlideTransition(
  plan: NonNullable<ReturnType<typeof transitionPlan>>,
  back: boolean,
  change: () => void,
) {
  const turn = ++playing;

  nameElements(plan.names);

  const transition = document.startViewTransition(async () => {
    change();
    await nextTick();

    if (turn === playing) nameElements(plan.names);
  });

  try {
    await transition.ready;
    retime(plan.groups, back);
    await transition.finished;
  } finally {
    if (turn === playing) nameElements();
  }
}

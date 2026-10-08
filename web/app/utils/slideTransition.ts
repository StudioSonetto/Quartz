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

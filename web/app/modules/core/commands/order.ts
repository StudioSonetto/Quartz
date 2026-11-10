const split = (siblings: Tree[], picked: Set<Tree>) => [
  siblings.filter((n) => !picked.has(n)),
  siblings.filter((n) => picked.has(n)),
];

const swapPast = (siblings: Tree[], picked: Set<Tree>, step: 1 | -1) => {
  const out = [...siblings];
  const indices = out.map((_, i) => i);

  for (const i of step === 1 ? indices.reverse() : indices) {
    const j = i + step;

    if (out[j] && picked.has(out[i]!) && !picked.has(out[j]!))
      [out[i], out[j]] = [out[j]!, out[i]!];
  }

  return out;
};

const ops = [
  {
    id: "front",
    title: "Bring to Front",
    icon: "i-carbon-bring-to-front",
    keys: ["mod+shift+]", "mod+shift+}"],
    move: (s: Tree[], p: Set<Tree>) => split(s, p).flat(),
  },
  {
    id: "forward",
    title: "Bring Forward",
    icon: "i-carbon-bring-forward",
    keys: ["mod+]"],
    move: (s: Tree[], p: Set<Tree>) => swapPast(s, p, 1),
  },
  {
    id: "back",
    title: "Send to Back",
    icon: "i-carbon-send-to-back",
    keys: ["mod+shift+[", "mod+shift+{"],
    move: (s: Tree[], p: Set<Tree>) => split(s, p).reverse().flat(),
  },
  {
    id: "backward",
    title: "Send Backward",
    icon: "i-carbon-send-backward",
    keys: ["mod+["],
    move: (s: Tree[], p: Set<Tree>) => swapPast(s, p, -1),
  },
];

const movable = (ctx: CommandContext) =>
  ctx.unlockedNodes.filter((n) => n.parent);

export default ops.map(
  ({ id, title, icon, keys, move }, i): Command => ({
    id: `core.order.${id}`,
    keys,
    title,
    category: "Arrange",
    menu: { node: 64 + i },
    submenu: "Order",
    icon,
    when: (ctx) => movable(ctx).length > 0,
    run: (ctx) => {
      const picked = new Set(movable(ctx));
      let changed = false;

      for (const parent of new Set([...picked].map((n) => n.parent!))) {
        const next = move(parent.children, picked);

        if (next.every((n, i) => n === parent.children[i])) continue;

        parent.children = next;
        changed = true;
      }

      if (changed) ctx.deck.reorderNodes();
    },
  }),
);

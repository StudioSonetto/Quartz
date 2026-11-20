export type TextNode = NodeModel & { slide: number };

type Run = { text: string; marks?: Record<string, unknown> };

const typographyByNode = (rows: ComponentRow[]) =>
  new Map(
    rows
      .filter((row) => row.type === "core.typography")
      .map((row) => [row.node, row]),
  );

const runsOf = (content: unknown): Run[] =>
  Array.isArray(content) ? content : [{ text: String(content ?? "") }];

function lockReason(node: NodeModel, row?: ComponentRow) {
  if (node.type !== "core.text") return "not a text box";
  if (node.locked) return "locked in Quartz";
  if (node.reference && syncs(node, "core.typography"))
    return "linked — edit it in Quartz";
  if (row?.data.$bind?.content) return "bound to a variable";
}

export function outline(nodes: TextNode[], rows: ComponentRow[]) {
  const typography = typographyByNode(rows);

  // Grouped by slide id: two slides can share an index, and would merge.
  return [...Map.groupBy(nodes, (node) => node.slides).values()]
    .sort((a, b) => a[0]!.slide - b[0]!.slide)
    .map((group) => ({
      slide: group[0]!.slide,
      texts: flattenTree(buildTree(group))
        .filter((node) => node.type === "core.text")
        .map((node) => {
          const row = typography.get(node.id);
          const text = runsOf(row?.data.content)
            .map((run) => run.text)
            .join("");
          const reason = lockReason(node, row);

          return {
            id: node.id,
            name: node.name,
            text,
            length: text.length,
            editable: !reason,
            reason,
          };
        }),
    }));
}

export function planText(
  nodes: TextNode[],
  rows: ComponentRow[],
  edits: { node: string; text: string }[],
) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const typography = typographyByNode(rows);
  const write: ComponentRow[] = [];
  const skipped: { node: string; reason: string }[] = [];

  for (const [id, text] of new Map(edits.map((e) => [e.node, e.text]))) {
    const node = byId.get(id);
    const row = typography.get(id);
    const reason = node ? lockReason(node, row) : "not in this deck";

    if (reason) {
      skipped.push({ node: id, reason });

      continue;
    }

    const marks = runsOf(row?.data.content)[0]?.marks;

    write.push({
      node: id,
      type: "core.typography",
      data: { ...row?.data, content: marks ? [{ text, marks }] : text },
    });
  }

  return { write, skipped };
}

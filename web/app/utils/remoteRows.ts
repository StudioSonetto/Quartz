export type RemoteRow = {
  table: "nodes" | "components";
  event: "INSERT" | "UPDATE" | "DELETE";
  row: Record<string, any>;
};

export function pickRemote(
  rows: RemoteRow[],
  known: (node: string) => string | undefined,
  busy: (key: string) => boolean,
): Map<string, RemoteRow[]> {
  const out = new Map<string, RemoteRow[]>();

  for (const remote of rows) {
    const { row } = remote;
    const isNode = remote.table === "nodes";

    const slide = isNode ? (row.slides ?? known(row.id)) : known(row.node);
    const key = isNode ? row.id : componentKey(row.node, row.type);

    if (!slide || busy(key)) continue;

    const list = out.get(slide);

    if (list) list.push(remote);
    else out.set(slide, [remote]);
  }

  return out;
}

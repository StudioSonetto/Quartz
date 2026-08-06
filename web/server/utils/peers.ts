import type { componentType } from "~~/server/db/schema";

export interface ComponentRow {
  node: string;
  type: (typeof componentType.enumValues)[number];
  data: Record<string, any>;
}

// The rows to write: the originals plus one copy per peer.
//
// One row per `node:type` is not cosmetic — `ON CONFLICT DO UPDATE` errors
// outright if a single statement touches a row twice, and a request usually
// already carries rows for several members of a group.
//
// Which row wins is decided rather than left to iteration order. A row the
// client sent for a node is that node's own state and always beats a copy fanned
// out from a peer; peers only fill in nodes the request said nothing about.
// Between two rows for the same node the later one wins, matching the upsert.
export function expandComponentsToPeers(
  rows: ComponentRow[],
  peerIds: Map<string, string[]>,
): ComponentRow[] {
  const rowKey = (node: string, type: ComponentRow["type"]) => `${node}:${type}`;
  const out = new Map<string, ComponentRow>();

  for (const row of rows) out.set(rowKey(row.node, row.type), row);

  const explicit = new Set(out.keys());

  for (const row of rows) {
    for (const node of peerIds.get(row.node) ?? []) {
      const key = rowKey(node, row.type);
      if (explicit.has(key)) continue;

      out.set(key, { ...row, node, data: JSON.parse(JSON.stringify(row.data)) });
    }
  }
  return [...out.values()];
}

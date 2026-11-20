import { and, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { components, nodes, slides } from "~~/server/db/schema";
import type { componentType } from "~~/server/db/schema";
import type { Tx } from "./slideRows";

export interface ComponentRow {
  node: string;
  type: (typeof componentType.enumValues)[number];
  data: Record<string, any>;
}

export function expandComponentsToPeers(
  rows: ComponentRow[],
  peersFor: (node: string, type: ComponentRow["type"]) => string[],
): ComponentRow[] {
  const rowKey = (node: string, type: ComponentRow["type"]) =>
    `${node}:${type}`;
  const out = new Map<string, ComponentRow>();

  for (const row of rows) out.set(rowKey(row.node, row.type), row);

  const explicit = new Set(out.keys());

  for (const row of rows) {
    for (const node of peersFor(row.node, row.type)) {
      const key = rowKey(node, row.type);
      if (explicit.has(key)) continue;

      out.set(key, {
        ...row,
        node,
        data: JSON.parse(JSON.stringify(row.data)),
      });
    }
  }
  return [...out.values()];
}

export async function lookupPeers(tx: Tx, ids: string[]) {
  const peerIds = new Map<string, string[]>();
  const unsynced = new Map<string, string[]>();

  if (ids.length) {
    const src = alias(nodes, "src");
    const srcSlides = alias(slides, "src_slides");
    const peerSlides = alias(slides, "peer_slides");

    const peerRows = await tx
      .select({
        source: src.id,
        peer: nodes.id,
        path: src.path,
        unsynced: src.unsynced,
      })
      .from(src)
      .innerJoin(srcSlides, eq(src.slides, srcSlides.id))
      .innerJoin(
        peerSlides,
        and(
          eq(peerSlides.deck, srcSlides.deck),
          ne(peerSlides.id, srcSlides.id),
        ),
      )
      .innerJoin(
        nodes,
        and(
          eq(nodes.slides, peerSlides.id),
          eq(nodes.reference, src.reference),
          eq(nodes.type, src.type),
        ),
      )
      .where(
        and(
          inArray(src.id, ids),
          isNotNull(src.reference),
          ne(src.reference, ""),
          ne(nodes.id, src.id),
        ),
      );

    for (const row of peerRows) {
      const peers = peerIds.get(row.source);

      if (peers) peers.push(row.peer);
      else {
        peerIds.set(row.source, [row.peer]);
        unsynced.set(row.source, unsyncedOf(row));
      }
    }
  }

  return (source: string, channel: SyncChannel) =>
    unsynced.get(source)?.includes(channel) ? [] : (peerIds.get(source) ?? []);
}

export async function writeWithPeers(
  tx: Tx,
  rows: ComponentRow[],
  peersFor: (source: string, channel: SyncChannel) => string[],
) {
  const componentRows = expandComponentsToPeers(rows, peersFor);

  if (componentRows.length) {
    await tx
      .insert(components)
      .values(componentRows)
      .onConflictDoUpdate({
        target: [components.node, components.type],
        set: { data: sql`excluded.data` },
      });
  }
}

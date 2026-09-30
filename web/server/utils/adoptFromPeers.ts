import { and, asc, eq, isNotNull, ne, not, sql, type SQL } from "drizzle-orm";
import { alias, type AnyPgColumn } from "drizzle-orm/pg-core";
import type { db } from "~~/server/db";
import { components, nodes, slides } from "~~/server/db/schema";

// Takes from the earliest-slide peer; new nodes never adopt from each other.
export async function adoptFromPeers(
  tx: Pick<typeof db, "selectDistinctOn" | "insert" | "update">,
  which: (table: Record<"id" | "slides", AnyPgColumn>) => SQL,
) {
  const peer = alias(nodes, "peer");
  const ownSlides = alias(slides, "own_slides");
  const peerSlides = alias(slides, "peer_slides");

  const rows = await tx
    .selectDistinctOn([nodes.id, components.type], {
      node: nodes.id,
      type: components.type,
      data: components.data,
      path: nodes.path,
      unsynced: nodes.unsynced,
      name: peer.name,
      locked: peer.locked,
      index: peerSlides.index,
    })
    .from(nodes)
    .innerJoin(ownSlides, eq(ownSlides.id, nodes.slides))
    .innerJoin(
      peer,
      and(eq(peer.reference, nodes.reference), eq(peer.type, nodes.type)),
    )
    .innerJoin(peerSlides, eq(peerSlides.id, peer.slides))
    .innerJoin(components, eq(components.node, peer.id))
    .where(
      and(
        which(nodes),
        not(which(peer)),
        isNotNull(nodes.reference),
        ne(nodes.reference, ""),
        eq(peerSlides.deck, ownSlides.deck),
        ne(peerSlides.id, ownSlides.id),
      ),
    )
    .orderBy(nodes.id, components.type, asc(peerSlides.index));

  const earliest = new Map<string, (typeof rows)[number]>();

  for (const row of rows) {
    const seen = earliest.get(row.node);

    if (!seen || row.index < seen.index) earliest.set(row.node, row);
  }

  for (const row of earliest.values()) {
    const set = {
      ...(syncs(row, "name") && { name: row.name }),
      ...(syncs(row, "locked") && { locked: row.locked }),
    };

    if (Object.keys(set).length)
      await tx.update(nodes).set(set).where(eq(nodes.id, row.node));
  }

  const adopted = rows
    .filter((row) => syncs(row, row.type))
    .map(({ node, type, data }) => ({ node, type, data }));

  if (!adopted.length) return;

  await tx
    .insert(components)
    .values(adopted)
    .onConflictDoUpdate({
      target: [components.node, components.type],
      set: { data: sql`excluded.data` },
    });
}

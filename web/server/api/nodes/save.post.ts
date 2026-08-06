import { and, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "~~/server/db";
import {
  components,
  componentType,
  decks,
  nodes,
  nodeType,
  slides,
} from "~~/server/db/schema";

const bodySchema = z.object({
  nodesToUpsert: z
    .array(
      z.object({
        id: z.string().uuid(),
        slides: z.string().uuid(),
        name: z.string(),
        path: z.string(),
        reference: z.string().nullable().optional(),
        type: z.enum(nodeType.enumValues),
        sort_order: z.number().int().default(0),
      }),
    )
    .default([]),
  nodesToDelete: z
    .array(z.object({ path: z.string(), slides: z.string().uuid() }))
    .default([]),
  componentsToUpsert: z
    .array(
      z.object({
        node: z.string().uuid(),
        type: z.enum(componentType.enumValues),
        data: z.record(z.string(), z.any()).default({}),
      }),
    )
    .default([]),
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const { nodesToUpsert, nodesToDelete, componentsToUpsert } =
    await validateBody(event, bodySchema);

  // Every node this request touches must live on a slide the user owns.
  const slideIds = [
    ...new Set([
      ...nodesToUpsert.map((node) => node.slides),
      ...nodesToDelete.map((node) => node.slides),
    ]),
  ];

  if (slideIds.length) {
    const owned = await db
      .select({ id: slides.id })
      .from(slides)
      .innerJoin(decks, eq(slides.deck, decks.id))
      .where(and(inArray(slides.id, slideIds), eq(decks.lapidarist, user.id)));

    if (owned.length !== slideIds.length)
      throw createError({ statusCode: 403 });
  }

  // Components may target pre-existing nodes not in nodesToUpsert; those nodes
  // must also belong to the user (upserted nodes are covered by the check above).
  const upsertIds = new Set(nodesToUpsert.map((node) => node.id));
  const foreignNodeIds = [
    ...new Set(
      componentsToUpsert
        .map((component) => component.node)
        .filter((id) => !upsertIds.has(id)),
    ),
  ];

  if (foreignNodeIds.length) {
    const owned = await db
      .select({ id: nodes.id })
      .from(nodes)
      .innerJoin(slides, eq(nodes.slides, slides.id))
      .innerJoin(decks, eq(slides.deck, decks.id))
      .where(
        and(inArray(nodes.id, foreignNodeIds), eq(decks.lapidarist, user.id)),
      );

    if (owned.length !== foreignNodeIds.length)
      throw createError({ statusCode: 403 });
  }

  await db.transaction(async (tx) => {
    // Read before the upsert overwrites them: only a save that actually renames
    // a keyed node should push a name out to its peers. `reorderNodes`,
    // `groupSelection` and `insertClone` mark whole slides dirty, so most saves
    // carry keyed nodes whose name has not changed at all.
    const keyedUpserts = nodesToUpsert.filter((node) => !!node.reference);
    const storedNames = new Map<string, string>();

    if (keyedUpserts.length) {
      const stored = await tx
        .select({ id: nodes.id, name: nodes.name })
        .from(nodes)
        .where(
          inArray(
            nodes.id,
            keyedUpserts.map((node) => node.id),
          ),
        );

      for (const node of stored) storedNames.set(node.id, node.name);
    }

    // A node with no stored row is new, and converging its group on the name it
    // arrived with is the right outcome.
    const renamed = keyedUpserts.filter(
      (node) => storedNames.get(node.id) !== node.name,
    );

    if (nodesToUpsert.length) {
      await tx
        .insert(nodes)
        .values(nodesToUpsert)
        .onConflictDoUpdate({
          target: nodes.id,
          set: {
            name: sql`excluded.name`,
            path: sql`excluded.path`,
            reference: sql`excluded.reference`,
            type: sql`excluded.type`,
            sort_order: sql`excluded.sort_order`,
          },
        });
    }

    for (const node of nodesToDelete) {
      await tx
        .delete(nodes)
        .where(
          and(
            eq(nodes.slides, node.slides),
            sql`${nodes.path} <@ ${node.path}::ltree`,
          ),
        );
    }

    // A write to a keyed node must land on every node in the deck sharing that
    // key, whether or not the client had those slides loaded. Uses `tx` so it
    // sees nodes this same request just upserted.
    const componentNodeIds = [
      ...new Set(componentsToUpsert.map((component) => component.node)),
    ];
    // A rename saves the node row alone, so renamed nodes need peers resolved
    // even with nothing in `componentsToUpsert`. One query serves both.
    const peerLookupIds = [
      ...new Set([...componentNodeIds, ...renamed.map((node) => node.id)]),
    ];
    const peerIds = new Map<string, string[]>();

    if (peerLookupIds.length) {
      const src = alias(nodes, "src");
      const srcSlides = alias(slides, "src_slides");
      const peerSlides = alias(slides, "peer_slides");

      const peerRows = await tx
        .select({ source: src.id, peer: nodes.id })
        .from(src)
        .innerJoin(srcSlides, eq(src.slides, srcSlides.id))
        // Other slides of the same deck only. A key repeated within one slide
        // is legacy data — the old reference field wrote one key across a whole
        // multi-selection — and fanning writes between those would collapse
        // them onto each other. `peersOf` skips the source slide to match.
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
            inArray(src.id, peerLookupIds),
            isNotNull(src.reference),
            ne(src.reference, ""),
            ne(nodes.id, src.id),
          ),
        );

      for (const { source, peer } of peerRows) {
        peerIds.set(source, [...(peerIds.get(source) ?? []), peer]);
      }
    }

    // `name` is the one node column peers share. `path`, `slides`, `sort_order`
    // and `reference` are per-copy and must never travel.
    //
    // Collected by name first: a group or ungroup can rename several keyed
    // nodes at once, and a statement per node would hold the transaction open
    // for a round trip each.
    const namePushes = new Map<string, Set<string>>();

    for (const node of renamed) {
      const peers = peerIds.get(node.id);
      if (!peers?.length) continue;

      const targets = namePushes.get(node.name) ?? new Set<string>();
      for (const peer of peers) targets.add(peer);
      namePushes.set(node.name, targets);
    }

    for (const [name, targets] of namePushes) {
      await tx
        .update(nodes)
        .set({ name })
        .where(inArray(nodes.id, [...targets]));
    }

    const componentRows = expandComponentsToPeers(componentsToUpsert, peerIds);

    if (componentRows.length) {
      await tx
        .insert(components)
        .values(componentRows)
        .onConflictDoUpdate({
          target: [components.node, components.type],
          set: { data: sql`excluded.data` },
        });
    }
  });
});

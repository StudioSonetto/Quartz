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
        unsynced: z
          .array(z.enum(["name", ...componentType.enumValues]))
          .nullable()
          .optional(),
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
  componentsToDelete: z
    .array(
      z.object({
        node: z.string().uuid(),
        type: z.enum(componentType.enumValues),
      }),
    )
    .default([]),
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const {
    nodesToUpsert,
    nodesToDelete,
    componentsToUpsert,
    componentsToDelete,
  } = await validateBody(event, bodySchema);

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

  const upsertIds = new Set(nodesToUpsert.map((node) => node.id));
  const componentNodeIds = [
    ...new Set(
      [...componentsToUpsert, ...componentsToDelete].map(
        (component) => component.node,
      ),
    ),
  ];
  const foreignNodeIds = componentNodeIds.filter((id) => !upsertIds.has(id));

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
            unsynced: sql`excluded.unsynced`,
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

    const peerLookupIds = [
      ...new Set([...componentNodeIds, ...renamed.map((node) => node.id)]),
    ];
    const peerIds = new Map<string, string[]>();
    const unsynced = new Map<string, string[]>();

    const peersFor = (source: string, channel: SyncChannel) =>
      unsynced.get(source)?.includes(channel)
        ? []
        : (peerIds.get(source) ?? []);

    if (peerLookupIds.length) {
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
            inArray(src.id, peerLookupIds),
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

    const namePushes = new Map<string, Set<string>>();

    for (const node of renamed) {
      const peers = peersFor(node.id, "name");

      if (!peers.length) continue;

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

    const componentRows = expandComponentsToPeers(componentsToUpsert, peersFor);

    if (componentRows.length) {
      await tx
        .insert(components)
        .values(componentRows)
        .onConflictDoUpdate({
          target: [components.node, components.type],
          set: { data: sql`excluded.data` },
        });
    }

    const deletesByType = new Map<
      (typeof componentType.enumValues)[number],
      Set<string>
    >();

    for (const target of componentsToDelete) {
      const ids = deletesByType.get(target.type) ?? new Set<string>();

      ids.add(target.node);
      for (const peer of peersFor(target.node, target.type)) ids.add(peer);

      deletesByType.set(target.type, ids);
    }

    for (const [type, ids] of deletesByType) {
      await tx
        .delete(components)
        .where(
          and(inArray(components.node, [...ids]), eq(components.type, type)),
        );
    }
  });
});

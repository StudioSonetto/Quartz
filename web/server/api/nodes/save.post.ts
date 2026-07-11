import { and, eq, inArray, like, sql } from "drizzle-orm";
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
          },
        });
    }

    for (const node of nodesToDelete) {
      await tx
        .delete(nodes)
        .where(
          and(eq(nodes.slides, node.slides), like(nodes.path, `${node.path}%`)),
        );
    }

    if (componentsToUpsert.length) {
      await tx
        .insert(components)
        .values(componentsToUpsert)
        .onConflictDoUpdate({
          target: [components.node, components.type],
          set: { data: sql`excluded.data` },
        });
    }
  });
});

import { and, asc, eq, isNotNull, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "~~/server/db";
import { components, nodes, slides } from "~~/server/db/schema";

const bodySchema = z.object({
  deck: z.string().uuid(),
  index: z.number().int().nonnegative(),
  id: z.string().uuid().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const { deck, index, id } = await validateBody(event, bodySchema);

  await requireDeckOwner(deck, user.id);

  let [slide] = await db
    .insert(slides)
    .values(id ? { id, deck, index } : { deck, index })
    .onConflictDoNothing({ target: slides.id })
    .returning();

  if (slide) {
    await adoptFromPeers(slide);
  } else if (id) {
    [slide] = await db
      .select()
      .from(slides)
      .where(and(eq(slides.id, id), eq(slides.deck, deck)));

    if (!slide) throw createError({ statusCode: 409 });
  }

  return slide && { ...slide, root: await rootNode(slide.id) };
});

async function rootNode(slide: string) {
  const [root] = await db
    .select({ id: nodes.id })
    .from(nodes)
    .where(and(eq(nodes.slides, slide), eq(nodes.path, ROOT_NODE_PATH)));

  return root?.id;
}

async function adoptFromPeers(slide: { id: string; deck: string }) {
  const peer = alias(nodes, "peer");
  const peerSlides = alias(slides, "peer_slides");

  const rows = await db
    .select({
      node: nodes.id,
      type: components.type,
      data: components.data,
      path: nodes.path,
      unsynced: nodes.unsynced,
    })
    .from(nodes)
    .innerJoin(
      peer,
      and(eq(peer.reference, nodes.reference), eq(peer.type, nodes.type)),
    )
    .innerJoin(peerSlides, eq(peerSlides.id, peer.slides))
    .innerJoin(components, eq(components.node, peer.id))
    .where(
      and(
        eq(nodes.slides, slide.id),
        isNotNull(nodes.reference),
        ne(nodes.reference, ""),
        eq(peerSlides.deck, slide.deck),
        ne(peerSlides.id, slide.id),
      ),
    )
    .orderBy(asc(peerSlides.index));

  const adopted = new Map<
    string,
    Pick<(typeof rows)[number], "node" | "type" | "data">
  >();

  for (const row of rows) {
    const key = `${row.node}:${row.type}`;

    if (adopted.has(key) || !syncs(row, row.type)) continue;

    adopted.set(key, { node: row.node, type: row.type, data: row.data });
  }

  if (!adopted.size) return;

  await db
    .insert(components)
    .values([...adopted.values()])
    .onConflictDoUpdate({
      target: [components.node, components.type],
      set: { data: sql`excluded.data` },
    });
}

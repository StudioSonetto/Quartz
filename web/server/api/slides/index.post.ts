import { and, asc, eq, isNotNull, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "~~/server/db";
import { components, nodes, slides } from "~~/server/db/schema";

const bodySchema = z.object({
  deck: z.string().uuid(),
  index: z.number().int().nonnegative(),
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const { deck, index } = await validateBody(event, bodySchema);

  await requireDeckOwner(deck, user.id);

  const [slide] = await db.insert(slides).values({ deck, index }).returning();

  if (slide) await adoptFromPeers(slide);

  return slide;
});

async function adoptFromPeers(slide: { id: string; deck: string }) {
  const peer = alias(nodes, "peer");
  const peerSlides = alias(slides, "peer_slides");

  const rows = await db
    .select({ node: nodes.id, type: components.type, data: components.data })
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

  const adopted = new Map<string, (typeof rows)[number]>();

  for (const row of rows) {
    const key = `${row.node}:${row.type}`;

    if (!adopted.has(key)) adopted.set(key, row);
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

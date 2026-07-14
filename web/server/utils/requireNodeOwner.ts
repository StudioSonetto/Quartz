import { and, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { decks, nodes, slides } from "~~/server/db/schema";

/**
 * Verifies the node exists and its slide's deck belongs to the given user.
 * Throws 404 otherwise.
 */
export async function requireNodeOwner(nodeId: string, userId: string) {
  const [node] = await db
    .select({ id: nodes.id })
    .from(nodes)
    .innerJoin(slides, eq(nodes.slides, slides.id))
    .innerJoin(decks, eq(slides.deck, decks.id))
    .where(and(eq(nodes.id, nodeId), eq(decks.lapidarist, userId)));

  if (!node) throw createError({ statusCode: 404 });

  return node;
}

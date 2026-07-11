import { and, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { decks } from "~~/server/db/schema";

/**
 * Verifies the deck exists and belongs to the given user.
 * Throws 404 otherwise (don't reveal existence of other users' decks).
 */
export async function requireDeckOwner(deckId: string, userId: string) {
  const [deck] = await db
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.lapidarist, userId)));

  if (!deck) throw createError({ statusCode: 404 });

  return deck;
}

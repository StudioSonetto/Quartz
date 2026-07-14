import { and, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { decks, slides } from "~~/server/db/schema";

/**
 * Verifies the slide exists and its deck belongs to the given user.
 * Throws 404 otherwise.
 */
export async function requireSlideOwner(slideId: string, userId: string) {
  const [slide] = await db
    .select({ id: slides.id })
    .from(slides)
    .innerJoin(decks, eq(slides.deck, decks.id))
    .where(and(eq(slides.id, slideId), eq(decks.lapidarist, userId)));

  if (!slide) throw createError({ statusCode: 404 });

  return slide;
}

import { and, count, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { decks } from "~~/server/db/schema";

const BASIC_DECK_LIMIT = 10;

export async function requireDeckRoom(userId: string) {
  if (!useRuntimeConfig().polarAccessToken) return;
  if ((await unlockedModulesOf(userId)).length) return;

  const [owned] = await db
    .select({ n: count() })
    .from(decks)
    .where(and(eq(decks.lapidarist, userId), eq(decks.is_template, false)));

  if (owned!.n >= BASIC_DECK_LIMIT)
    throw createError({ statusCode: 403, statusMessage: "Deck limit" });
}

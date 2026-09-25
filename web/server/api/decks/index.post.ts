import { count, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { decks } from "~~/server/db/schema";

const BASIC_DECK_LIMIT = 10;

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  if (
    useRuntimeConfig().polarAccessToken &&
    !(await unlockedModulesOf(user.id)).length
  ) {
    const [owned] = await db
      .select({ n: count() })
      .from(decks)
      .where(eq(decks.lapidarist, user.id));

    if (owned!.n >= BASIC_DECK_LIMIT)
      throw createError({ statusCode: 403, statusMessage: "Deck limit" });
  }

  const [deck] = await db
    .insert(decks)
    .values({ lapidarist: user.id, title: "Unnamed Deck" })
    .returning();

  return deck;
});

import { desc, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { decks } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const { userId } = requireDiscordToken(event);

  if (!userId) throw createError({ statusCode: 403 });

  return db
    .select({ id: decks.id, title: decks.title })
    .from(decks)
    .where(eq(decks.lapidarist, userId))
    .orderBy(desc(decks.last_modified));
});

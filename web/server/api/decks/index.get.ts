import { asc, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { decks } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  return db
    .select()
    .from(decks)
    .where(eq(decks.lapidarist, user.id))
    .orderBy(asc(decks.last_modified));
});

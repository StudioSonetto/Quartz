import { asc, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { decks } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  await requireUser(event);

  return db
    .select({ id: decks.id, title: decks.title })
    .from(decks)
    .where(eq(decks.is_template, true))
    .orderBy(asc(decks.title));
});

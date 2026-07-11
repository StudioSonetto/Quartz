import { and, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { decks } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const id = getRouterParam(event, "id")!;

  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, id), eq(decks.lapidarist, user.id)));

  if (!deck) throw createError({ statusCode: 404 });

  return deck;
});

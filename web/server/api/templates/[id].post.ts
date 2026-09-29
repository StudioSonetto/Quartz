import { and, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { decks } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = getRouterParam(event, "id")!;

  const [[template]] = await Promise.all([
    db
      .select()
      .from(decks)
      .where(and(eq(decks.id, id), eq(decks.is_template, true))),
    requireDeckRoom(user.id),
  ]);

  if (!template) throw createError({ statusCode: 404 });

  return copyDeck(event, template, user.id);
});

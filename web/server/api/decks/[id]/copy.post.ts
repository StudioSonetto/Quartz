import { and, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { decks } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = getRouterParam(event, "id")!;

  const [[source]] = await Promise.all([
    db
      .select()
      .from(decks)
      .where(and(eq(decks.id, id), eq(decks.lapidarist, user.id))),
    requireDeckRoom(user.id),
  ]);

  if (!source) throw createError({ statusCode: 404 });

  return copyDeck(event, source, user.id, {
    title: `${source.title} (Copy)`,
    template: source.template,
    module_allowance: source.module_allowance,
  });
});

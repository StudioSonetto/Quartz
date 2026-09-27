import { eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { decks } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id")!;

  const row = db
    .select()
    .from(decks)
    .where(eq(decks.id, id))
    .then(([deck]) => deck);

  await requireDeckReader(
    event,
    row.then((deck) => deck && { deck: deck.id, owner: deck.lapidarist }),
  );

  const { lapidarist, ...visible } = (await row)!;

  return visible;
});

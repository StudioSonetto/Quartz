import { eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { decks } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id")!;

  const { title, last_modified } = await requireDeckReader(event, () =>
    db
      .select()
      .from(decks)
      .where(eq(decks.id, id))
      .then(([row]) => row && { ...row, deck: row.id, owner: row.lapidarist }),
  );

  return { id, title, last_modified };
});

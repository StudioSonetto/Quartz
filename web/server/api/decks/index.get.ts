import { sql } from "drizzle-orm";
import { decks, slides } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  return decksOf(user.id, {
    id: decks.id,
    lapidarist: decks.lapidarist,
    title: decks.title,
    last_modified: decks.last_modified,
    cover: sql<string | null>`(
      select s.id from ${slides} s
      where s.deck = "decks"."id" and s.index = 0
      limit 1
    )`.as("cover"),
  });
});

import { db } from "~~/server/db";
import { decks } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const [deck] = await db
    .insert(decks)
    .values({ lapidarist: user.id, title: "Unnamed Deck" })
    .returning();

  return deck;
});

import { db } from "~~/server/db";
import { decks } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  await requireDeckRoom(user.id);

  return db.transaction(async (tx) => {
    const [deck] = await tx
      .insert(decks)
      .values({ lapidarist: user.id, title: "Unnamed Deck" })
      .returning();

    await insertBlankSlide(tx, deck!.id, 0);

    return deck;
  });
});

import { and, count, eq, gt, sql } from "drizzle-orm";
import { db } from "~~/server/db";
import { decks, slides } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const id = getRouterParam(event, "id")!;

  const { deck } = await requireSlideOwner(id, user.id);

  await db.transaction(async (tx) => {
    await tx
      .select({ id: decks.id })
      .from(decks)
      .where(eq(decks.id, deck))
      .for("update");

    const [total] = await tx
      .select({ value: count() })
      .from(slides)
      .where(eq(slides.deck, deck));

    if ((total?.value ?? 0) <= 1)
      throw createError({
        statusCode: 409,
        statusMessage: "A deck must keep at least one slides.",
      });

    const [gone] = await tx
      .delete(slides)
      .where(eq(slides.id, id))
      .returning({ index: slides.index });

    if (!gone) throw createError({ statusCode: 404 });

    await tx
      .update(slides)
      .set({ index: sql`${slides.index} - 1` })
      .where(and(eq(slides.deck, deck), gt(slides.index, gone.index)));
  });

  await removeSnapshots(event, [`${deck}/${id}.png`]);

  setResponseStatus(event, 204);
});

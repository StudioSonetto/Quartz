import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/db";
import { slides } from "~~/server/db/schema";

const bodySchema = z.object({
  order: z.array(z.string().uuid()).min(1),
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const deck = getRouterParam(event, "id")!;
  const { order } = await validateBody(event, bodySchema);

  await requireDeckOwner(deck, user.id);

  const existing = await db
    .select()
    .from(slides)
    .where(eq(slides.deck, deck));

  const check = checkSlideOrder(
    existing.map((s) => s.id),
    order,
  );

  if (!check.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid slide order (${check.reason})`,
    });
  }

  await db.transaction(async (tx) => {
    for (const [i, id] of order.entries()) {
      await tx
        .update(slides)
        .set({ index: i })
        .where(and(eq(slides.id, id), eq(slides.deck, deck)));
    }
  });

  // Build the response from the rows already fetched rather than selecting
  // them again — `order` is a verified permutation, so this is what was written.
  const byId = new Map(existing.map((s) => [s.id, s]));

  return order.map((id, i) => ({ ...byId.get(id)!, index: i }));
});

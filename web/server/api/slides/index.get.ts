import { and, asc, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { slides } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const query = getQuery(event);
  const deck = query.deck as string;
  const index = query.index !== undefined ? Number(query.index) : undefined;

  await requireDeckOwner(deck, user.id);

  if (index !== undefined) {
    const [slide] = await db
      .select()
      .from(slides)
      .where(and(eq(slides.deck, deck), eq(slides.index, index)));
    if (!slide) throw createError({ statusCode: 404 });
    return slide;
  }

  return db
    .select()
    .from(slides)
    .where(eq(slides.deck, deck))
    .orderBy(asc(slides.index));
});

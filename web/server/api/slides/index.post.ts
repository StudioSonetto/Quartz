import { z } from "zod";
import { db } from "~~/server/db";
import { slides } from "~~/server/db/schema";

const bodySchema = z.object({
  deck: z.string().uuid(),
  index: z.number().int().nonnegative(),
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const { deck, index } = await validateBody(event, bodySchema);

  await requireDeckOwner(deck, user.id);

  const [slide] = await db.insert(slides).values({ deck, index }).returning();

  return slide;
});

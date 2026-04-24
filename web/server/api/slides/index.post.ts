import { db } from "~~/server/db";
import { slides } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  await requireUser(event);

  const { deck, index } = await readBody<{ deck: string; index: number }>(
    event,
  );

  return db.insert(slides).values({ deck, index }).returning();
});

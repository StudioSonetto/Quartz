import { asc, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { nodes } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  await requireUser(event);

  const { slides: slidesId } = getQuery(event) as { slides: string };

  return db
    .select()
    .from(nodes)
    .where(eq(nodes.slides, slidesId))
    .orderBy(asc(nodes.path));
});

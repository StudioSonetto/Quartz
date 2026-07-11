import { asc, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { components, nodes } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const { slides: slidesId } = getQuery(event) as { slides: string };

  await requireSlideOwner(slidesId, user.id);

  return db
    .select({
      node: components.node,
      type: components.type,
      data: components.data,
    })
    .from(components)
    .innerJoin(nodes, eq(components.node, nodes.id))
    .where(eq(nodes.slides, slidesId))
    .orderBy(asc(components.type));
});

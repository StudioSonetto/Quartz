import { asc, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { components } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const node = getRouterParam(event, "node")!;

  await requireDeckReader(event, () => nodeTarget(node));

  return db
    .select()
    .from(components)
    .where(eq(components.node, node))
    .orderBy(asc(components.type));
});

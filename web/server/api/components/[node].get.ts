import { asc, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { components } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const node = getRouterParam(event, "node")!;

  await requireNodeOwner(node, user.id);

  return db
    .select()
    .from(components)
    .where(eq(components.node, node))
    .orderBy(asc(components.type));
});

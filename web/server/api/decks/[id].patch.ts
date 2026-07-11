import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/db";
import { decks } from "~~/server/db/schema";

const bodySchema = z.object({ title: z.string().max(255) });

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const id = getRouterParam(event, "id")!;
  const { title } = await validateBody(event, bodySchema);

  await db
    .update(decks)
    .set({ title, last_modified: new Date() })
    .where(and(eq(decks.id, id), eq(decks.lapidarist, user.id)));
});

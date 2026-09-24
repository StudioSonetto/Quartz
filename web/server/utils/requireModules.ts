import { eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { lapidaries } from "~~/server/db/schema";

export async function requireModules(userId: string, types: string[]) {
  if (!useRuntimeConfig().public.billing) return;
  if (!lockedModules(types, []).length) return;

  const [row] = await db
    .select({ unlocked: lapidaries.unlocked_modules })
    .from(lapidaries)
    .where(eq(lapidaries.id, userId));

  if (lockedModules(types, row?.unlocked ?? []).length)
    throw createError({ statusCode: 403, statusMessage: "Module locked" });
}

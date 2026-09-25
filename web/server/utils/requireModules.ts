import { eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { lapidaries } from "~~/server/db/schema";

export async function unlockedModulesOf(userId: string) {
  const [row] = await db
    .select({ unlocked: lapidaries.unlocked_modules })
    .from(lapidaries)
    .where(eq(lapidaries.id, userId));

  return row?.unlocked ?? [];
}

export async function requireModules(userId: string, types: string[]) {
  if (!useRuntimeConfig().polarAccessToken) return;
  if (!lockedModules(types, []).length) return;

  if (lockedModules(types, await unlockedModulesOf(userId)).length)
    throw createError({ statusCode: 403, statusMessage: "Module locked" });
}

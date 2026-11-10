import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "~~/server/db";
import { decks, lapidaries, nodes, slides } from "~~/server/db/schema";

export async function unlockedModulesOf(userId: string) {
  const [row] = await db
    .select({ unlocked: lapidaries.unlocked_modules })
    .from(lapidaries)
    .where(eq(lapidaries.id, userId));

  return row?.unlocked ?? [];
}

export async function lockedModulesIn(userId: string, types: string[]) {
  const modules = Object.keys(paidCounts(types));

  if (!useRuntimeConfig().polarAccessToken || !modules.length) return [];

  const unlocked = await unlockedModulesOf(userId);

  return modules.filter((m) => !moduleUnlocked(m, unlocked));
}

export async function requireAllowance(
  tx: Tx,
  deckIds: string[],
  modules: string[],
) {
  const module = sql`split_part(${nodes.type}::text, '.', 1)`;

  const over = await tx
    .select({ deck: decks.id })
    .from(nodes)
    .innerJoin(slides, eq(nodes.slides, slides.id))
    .innerJoin(decks, eq(slides.deck, decks.id))
    .where(and(inArray(decks.id, deckIds), inArray(module, modules)))
    .groupBy(decks.id, module)
    .having(
      sql`count(*) > coalesce((${decks.module_allowance}->>${module})::int, 0)`,
    )
    .limit(1);

  if (over.length)
    throw createError({ statusCode: 403, statusMessage: "Module locked" });
}

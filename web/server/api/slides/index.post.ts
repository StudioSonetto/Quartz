import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/db";
import { nodes, slides } from "~~/server/db/schema";

const bodySchema = z.object({
  deck: z.string().uuid(),
  index: z.number().int().nonnegative(),
  id: z.string().uuid().optional(),
  root: z.string().uuid().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const { deck, index, id, root } = await validateBody(event, bodySchema);

  await requireDeckOwner(deck, user.id);

  const created = await db.transaction(async (tx) => {
    const slide = await insertBlankSlide(tx, deck, index, { id, root });

    if (slide) await adoptFromPeers(tx, (t) => eq(t.slides, slide.id));

    return slide;
  });

  if (created) return created;

  const [existing] = await db
    .select()
    .from(slides)
    .where(and(eq(slides.id, id!), eq(slides.deck, deck)));

  if (!existing) throw createError({ statusCode: 409 });

  return { ...existing, root: await rootNode(existing.id) };
});

async function rootNode(slide: string) {
  const [root] = await db
    .select({ id: nodes.id })
    .from(nodes)
    .where(and(eq(nodes.slides, slide), eq(nodes.path, ROOT_PATH)));

  return root?.id;
}

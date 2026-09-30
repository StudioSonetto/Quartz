import { and, asc, eq, getTableColumns } from "drizzle-orm";
import { db } from "~~/server/db";
import { components, decks, nodes, slides } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id")!;

  const [deck] = await db
    .select({ title: decks.title })
    .from(decks)
    .where(and(eq(decks.id, id), eq(decks.is_public, true)));

  if (!deck) throw createError({ statusCode: 404 });

  const [deckSlides, deckNodes, deckComponents, signed] = await Promise.all([
    db
      .select()
      .from(slides)
      .where(eq(slides.deck, id))
      .orderBy(asc(slides.index)),
    db
      .select(getTableColumns(nodes))
      .from(nodes)
      .innerJoin(slides, eq(nodes.slides, slides.id))
      .where(eq(slides.deck, id))
      .orderBy(asc(nodes.path)),
    db
      .select({
        node: components.node,
        type: components.type,
        data: components.data,
        slide: nodes.slides,
      })
      .from(components)
      .innerJoin(nodes, eq(components.node, nodes.id))
      .innerJoin(slides, eq(nodes.slides, slides.id))
      .where(eq(slides.deck, id))
      .orderBy(asc(components.type)),
    signedAssets(event, id),
  ]);

  return {
    id,
    title: deck.title,
    slides: deckSlides,
    nodes: deckNodes,
    components: deckComponents,
    assets: Object.fromEntries(signed),
  };
});

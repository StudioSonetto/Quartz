import { eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { db } from "~~/server/db";
import { decks, nodes, slides } from "~~/server/db/schema";

type ReadTarget = { deck: string; owner: string };

const target = { deck: decks.id, owner: decks.lapidarist };

export async function requireDeckReader(
  event: H3Event,
  read: ReadTarget | undefined | Promise<ReadTarget | undefined>,
) {
  const token = readDiscordToken(event);

  const [found, allowed] = await Promise.all([
    read,
    token
      ? liveSession(token.instanceId, token.discordId).then((s) => s?.deck)
      : requireUser(event).then((u) => u.id),
  ]);

  if (!found || allowed !== (token ? found.deck : found.owner))
    throw createError({ statusCode: 404 });
}

export const deckTarget = (id: string) =>
  db
    .select(target)
    .from(decks)
    .where(eq(decks.id, id))
    .then(([row]) => row);

export const slideTarget = (id: string) =>
  db
    .select(target)
    .from(slides)
    .innerJoin(decks, eq(slides.deck, decks.id))
    .where(eq(slides.id, id))
    .then(([row]) => row);

export const nodeTarget = (id: string) =>
  db
    .select(target)
    .from(nodes)
    .innerJoin(slides, eq(nodes.slides, slides.id))
    .innerJoin(decks, eq(slides.deck, decks.id))
    .where(eq(nodes.id, id))
    .then(([row]) => row);

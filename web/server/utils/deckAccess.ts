import { desc, eq } from "drizzle-orm";
import type { SelectedFields } from "drizzle-orm/pg-core";
import type { H3Event } from "h3";
import { db } from "~~/server/db";
import { decks, nodes, slides } from "~~/server/db/schema";

type Target = { deck: string; owner: string };

export const deckOwnerColumns = { deck: decks.id, owner: decks.lapidarist };

export const deckTarget = (id: string) =>
  db
    .select(deckOwnerColumns)
    .from(decks)
    .where(eq(decks.id, id))
    .then(([row]) => row);

export const slideTarget = (id: string) =>
  db
    .select(deckOwnerColumns)
    .from(slides)
    .innerJoin(decks, eq(slides.deck, decks.id))
    .where(eq(slides.id, id))
    .then(([row]) => row);

export const nodeTarget = (id: string) =>
  db
    .select(deckOwnerColumns)
    .from(nodes)
    .innerJoin(slides, eq(nodes.slides, slides.id))
    .innerJoin(decks, eq(slides.deck, decks.id))
    .where(eq(nodes.id, id))
    .then(([row]) => row);

// 404, not 403: don't reveal that other users' decks exist.
async function requireOwned<T extends Target>(
  read: Promise<T | undefined>,
  userId: string,
) {
  const found = await read;

  if (!found || found.owner !== userId) throw createError({ statusCode: 404 });

  return found;
}

export const requireDeckOwner = (deckId: string, userId: string) =>
  requireOwned(deckTarget(deckId), userId);

export const requireSlideOwner = (slideId: string, userId: string) =>
  requireOwned(slideTarget(slideId), userId);

// The owner, or a Discord pass whose activity is showing this deck.
export async function requireDeckReader<T extends Target>(
  event: H3Event,
  read: () => Promise<T | undefined>,
) {
  const token = readDiscordToken(event);

  if (!token) {
    const user = await requireUser(event);

    return requireOwned(read(), user.id);
  }

  const [found, session] = await Promise.all([
    read(),
    liveSession(token.instanceId, token.discordId),
  ]);

  if (!found || found.deck !== session?.deck)
    throw createError({ statusCode: 404 });

  return found;
}

export const decksOf = <T extends SelectedFields>(userId: string, columns: T) =>
  db
    .select(columns)
    .from(decks)
    .$dynamic()
    .where(eq(decks.lapidarist, userId))
    .orderBy(desc(decks.last_modified));

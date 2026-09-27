import { decks } from "~~/server/db/schema";

export default defineEventHandler((event) =>
  decksOf(requireDiscordOwner(event).userId, {
    id: decks.id,
    title: decks.title,
  }),
);

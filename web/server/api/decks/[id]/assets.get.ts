export default defineEventHandler(async (event) => {
  const { deck } = await requireDeckReader(event, () =>
    deckTarget(getRouterParam(event, "id")!),
  );

  const signed = await signedAssets(event, deck);
  const origin = useRuntimeConfig(event).public.supabase.url;

  // Discord's CSP only allows its own proxy.
  return Object.fromEntries(
    [...signed].map(([name, url]) => [
      name,
      readDiscordToken(event) ? proxiedSupabase(url, origin) : url,
    ]),
  );
});

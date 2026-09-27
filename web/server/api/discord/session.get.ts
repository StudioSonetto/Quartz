export default defineEventHandler(async (event) => {
  const { id, deck, presenter } = await requireLiveSession(event);
  const { publicKey, privateKey } = sessionKeys(id, presenter);
  const isPresenter = requireDiscordToken(event).discordId === presenter;

  return {
    deck,
    presenter,
    publicKey,
    ...(isPresenter && { privateKey }),
  };
});

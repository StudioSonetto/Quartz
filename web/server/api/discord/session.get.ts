export default defineEventHandler(async (event) => {
  const { instanceId, discordId } = requireDiscordToken(event);
  const session = await liveSession(instanceId, discordId);

  return session && sessionView(session, discordId);
});

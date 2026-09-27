export default defineEventHandler(async (event) => {
  const session = await requireLiveSession(event);

  return sessionView(session, session.viewer);
});

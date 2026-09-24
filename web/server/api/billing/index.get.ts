export default defineEventHandler(async (event) => {
  if (!useRuntimeConfig().polarAccessToken) return { unlocked: "all" as const };

  const user = await requireUser(event);

  return { unlocked: await unlockedModulesOf(user.id) };
});

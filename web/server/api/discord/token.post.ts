import { z } from "zod";

const schema = z.object({
  code: z.string().min(1),
  instanceId: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const { code, instanceId } = await validateBody(event, schema);
  const config = useRuntimeConfig(event);

  if (!config.discordClientSecret) throw createError({ statusCode: 404 });

  const { access_token } = await $fetch<{ access_token: string }>(
    "https://discord.com/api/oauth2/token",
    {
      method: "POST",
      body: new URLSearchParams({
        client_id: config.public.discordClientId,
        client_secret: config.discordClientSecret,
        grant_type: "authorization_code",
        code,
      }),
    },
  );

  const me = $fetch<{ id: string }>("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const [{ id: discordId }, users] = await Promise.all([
    me,
    instanceUsers(instanceId, { fresh: true }),
  ]);

  if (!users) throw createError({ statusCode: 503 });
  if (!users.includes(discordId)) throw createError({ statusCode: 403 });

  const userId = await quartzUserFor(discordId);

  return {
    access_token,
    token: signDiscordToken(
      { discordId, userId, instanceId },
      config.discordClientSecret,
    ),
    discordId,
    canPresent: !!userId,
  };
});

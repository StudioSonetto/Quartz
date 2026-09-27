import type { FetchError } from "ofetch";

const TTL = 15_000;
const cache = new Map<string, { at: number; users: Promise<string[] | null> }>();

// null means Discord could not be asked; [] means the activity has ended.
export function instanceUsers(
  instanceId: string,
  { fresh = false } = {},
): Promise<string[] | null> {
  const hit = cache.get(instanceId);

  if (!fresh && hit && Date.now() - hit.at < TTL) return hit.users;

  const config = useRuntimeConfig();

  const users = $fetch<{ users: string[] }>(
    `https://discord.com/api/v10/applications/${config.public.discordClientId}/activity-instances/${encodeURIComponent(instanceId)}`,
    { headers: { Authorization: `Bot ${config.discordBotToken}` } },
  ).then(
    (res) => res.users,
    (err: FetchError) => (err.statusCode === 404 ? [] : null),
  );

  if (cache.size > 1000) cache.clear();

  // Failures are cached too, so a rate limit isn't hammered by every read.
  cache.set(instanceId, { at: Date.now(), users });

  return users;
}

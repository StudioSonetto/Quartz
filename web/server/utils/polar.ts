import { Polar } from "@polar-sh/sdk";

let client: Polar | undefined;

export function usePolar() {
  const { polarAccessToken, polarServer } = useRuntimeConfig();

  if (!polarAccessToken) throw createError({ statusCode: 404 });

  client ??= new Polar({
    accessToken: polarAccessToken,
    server: polarServer as "sandbox" | "production",
  });

  return client;
}

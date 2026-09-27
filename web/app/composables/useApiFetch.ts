type ApiFetch = <T = any>(
  url: string,
  options?: Record<string, any>,
) => Promise<T>;

export const useDiscordToken = () =>
  useState<string | null>("discord-token", () => null);

export function useApiFetch(): ApiFetch {
  const fetch = useRequestFetch() as ApiFetch;
  const token = useDiscordToken();

  return (url, options = {}) =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(token.value && { Authorization: `Bearer ${token.value}` }),
      },
    });
}

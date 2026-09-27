export const useDiscordPass = () =>
  useState<string | null>("discord-pass", () => null);

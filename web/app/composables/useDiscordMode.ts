export const useDiscordPass = () =>
  useState<string | null>("discord-pass", () => null);

export function enterDiscordMode(pass: string) {
  useDiscordPass().value = pass;
  setFontCssBase("/api/discord/fonts");
  useDeckSync().readOnly = true;
}

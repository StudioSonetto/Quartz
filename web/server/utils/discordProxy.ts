const DISCORD_PROXY = "/.proxy";

export const proxiedSupabase = (url: string, supabaseUrl: string) =>
  url.replace(supabaseUrl, `${DISCORD_PROXY}/supabase`);

export const proxiedFontshare = (css: string) =>
  css.replace(
    /(https:)?\/\/cdn\.fontshare\.com/g,
    `${DISCORD_PROXY}/fontshare`,
  );

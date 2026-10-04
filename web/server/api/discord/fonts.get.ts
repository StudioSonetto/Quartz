import type { H3Event } from "h3";
import { hash } from "ohash";
import { FONTSHARE_CSS, fonts, fontSlug } from "~~/shared/utils/fonts";

const KNOWN = new Set(fonts.map(fontSlug));

export default defineCachedEventHandler(
  async (event) => {
    const css = await $fetch<string>(
      `${FONTSHARE_CSS}?${fontQuery(event)}&display=swap`,
      { responseType: "text" },
    );

    setHeader(event, "content-type", "text/css");

    return proxiedFontshare(css);
  },
  { maxAge: 60 * 60 * 24, getKey: (event) => hash(fontQuery(event)) },
);

function fontQuery(event: H3Event) {
  const family = getQuery(event)["f[]"];
  const slug = typeof family === "string" ? family.replace(/@\d+$/, "") : "";

  if (!KNOWN.has(slug)) throw createError({ statusCode: 400 });

  return `f[]=${slug}`;
}

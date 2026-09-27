import type { H3Event } from "h3";
import { hash } from "ohash";
import { fonts, fontSlug } from "~~/shared/utils/fonts";

const KNOWN = new Set(fonts.map((f) => `${fontSlug(f)}@1`));

export default defineCachedEventHandler(
  async (event) => {
    const css = await $fetch<string>(
      `https://api.fontshare.com/v2/css?${fontQuery(event)}&display=swap`,
      { responseType: "text" },
    );

    setHeader(event, "content-type", "text/css");

    return proxiedFontshare(css);
  },
  { maxAge: 60 * 60 * 24, getKey: (event) => hash(fontQuery(event)) },
);

// Catalogue fonts only, so junk queries can't fill the cache.
function fontQuery(event: H3Event) {
  const families = [getQuery(event)["f[]"]]
    .flat()
    .filter((f): f is string => typeof f === "string" && KNOWN.has(f));

  if (!families.length) throw createError({ statusCode: 400 });

  return [...new Set(families)].map((f) => `f[]=${f}`).join("&");
}

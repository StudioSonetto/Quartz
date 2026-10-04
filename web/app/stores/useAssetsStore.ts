export type Asset = { name: string; url: string };

export type FontAsset = Asset & FontMeta;

export const useAssetsStore = defineStore("assets", () => {
  const client = useSupabaseClient();

  const { cached, fresh, list, sign, store } = useSignedBucket("assets");

  const assets = computed<Asset[]>(() =>
    Object.entries(cached.value.urls).map(([name, url]) => ({ name, url })),
  );

  const images = computed(() => {
    return assets.value.filter((asset) => isImage(asset.name));
  });

  const imageNames = computed(() => images.value.map((a) => a.name));

  const imageUrls = computed(
    () => new Map(images.value.map((a) => [a.name, a.url])),
  );

  function imageUrl(name: string) {
    return imageUrls.value.get(name);
  }

  const media = computed(() =>
    assets.value.filter((asset) => isImage(asset.name) || isVideo(asset.name)),
  );

  const mediaNames = computed(() => media.value.map((a) => a.name));

  function mediaUrl(name: string) {
    return isImage(name) || isVideo(name) ? cached.value.urls[name] : undefined;
  }

  const faceKey = (deck: string, name: string) => `${deck}/${name}`;

  const faces = ref<Record<string, FontMeta>>({});
  const fontFaces = new Map<string, FontFace | null>();

  const fonts = computed<FontAsset[]>(() =>
    assets.value
      .filter((asset) => isFont(asset.name))
      .map((asset) => ({
        ...asset,
        ...(faces.value[faceKey(cached.value.deck, asset.name)] ??
          fontFromName(asset.name)),
      })),
  );

  const fontFamilies = computed(
    () =>
      new Map(
        [...Map.groupBy(fonts.value, (font) => font.family)].map(
          ([family, files]) => [
            family,
            files.sort(
              (a, b) =>
                (parseInt(a.weight) || 400) - (parseInt(b.weight) || 400) ||
                a.style.localeCompare(b.style),
            ),
          ],
        ),
      ),
  );

  const models = computed(() => {
    return assets.value.filter((asset) => isModel(asset.name));
  });

  const modelUrls = computed(
    () => new Map(models.value.map((a) => [a.name, a.url])),
  );

  function modelUrl(name: string) {
    return modelUrls.value.get(name);
  }

  const isImage = (name: string) => assetKind(name) === "image";
  const isFont = (name: string) => assetKind(name) === "font";
  const isModel = (name: string) => assetKind(name) === "model";
  const isVideo = (name: string) => assetKind(name) === "video";

  async function fetchAssets(deck: string) {
    const names = await list(deck);

    if (!names) return;

    const reusable = fresh(deck);

    const urls = await sign(deck, names, reusable ? cached.value.urls : {});

    if (!urls) return;

    await setSignedUrls(deck, urls, reusable ? cached.value.at : Date.now());
  }

  async function setSignedUrls(
    deck: string,
    urls: Record<string, string>,
    at = Date.now(),
  ) {
    store(deck, urls, at);

    await serveFonts(deck);
  }

  function storageFull() {
    if (getUnlockedModules().length) {
      alert("Storage full. Pro includes 100 MB.");
    } else if (
      confirm("Storage full. Basic includes 10 MB. Upgrade to Pro for 100 MB?")
    ) {
      window.location.assign("/api/billing/checkout");
    }
  }

  async function uploadAssets(deck: string, files: File[]) {
    const stored = await list(deck);

    const taken = new Set(
      [...assets.value.map((a) => a.name), ...(stored ?? [])].map(assetKey),
    );

    const problems: string[] = [];

    const planned = files.flatMap((file) => {
      if (!assetKind(file.name)) {
        problems.push(unsupportedFile(file.name));

        return [];
      }

      if (assetKind(file.name) === "video" && file.size > MAX_VIDEO_BYTES) {
        problems.push(`Can't use ${file.name}. Videos must be under 50 MB.`);

        return [];
      }

      const name = uniqueAssetName(file.name, taken);

      taken.add(assetKey(name));

      return [{ file, name }];
    });

    let full = false;

    const entries = await Promise.all(
      planned.map(async ({ file, name }) => {
        const { error } = await client.storage
          .from("assets")
          .upload(`${deck}/${name}`, file, { cacheControl: "31536000" });

        if (error) console.error(error);
        if (error?.message.includes("row-level security")) full = true;
        else if (error)
          problems.push(`Couldn't upload ${name}: ${error.message}`);

        return [file, error ? null : name] as const;
      }),
    );

    if (problems.length) alert(problems.join("\n"));
    if (full) storageFull();

    const names = new Set(entries.flatMap(([, name]) => (name ? [name] : [])));

    if (names.size) {
      const added = await sign(deck, [...names]);

      if (added)
        await setSignedUrls(
          deck,
          { ...cached.value.urls, ...added },
          cached.value.at,
        );
    }

    return new Map(entries);
  }

  async function deleteAssets(deck: string, removed: Asset[]) {
    const { error } = await client.storage
      .from("assets")
      .remove(removed.map((asset) => `${deck}/${asset.name}`));

    if (error) {
      return console.error(error);
    }

    for (const asset of removed) {
      const key = faceKey(deck, asset.name);
      const face = fontFaces.get(key);

      if (face) document.fonts.delete(face);

      fontFaces.delete(key);
      delete faces.value[key];
    }

    await fetchAssets(deck);
  }

  async function serveFonts(deck: string) {
    const pending = fonts.value.filter(
      (f) => !fontFaces.has(faceKey(deck, f.name)),
    );

    await Promise.all(
      pending.map(async (font) => {
        const key = faceKey(deck, font.name);

        fontFaces.set(key, null);

        try {
          const response = await fetch(font.url);

          if (!response.ok)
            throw new Error(`${font.name}: HTTP ${response.status}`);

          const buffer = await response.arrayBuffer();
          const meta = (await readFontMeta(buffer)) ?? fontFromName(font.name);
          const fontFace = new FontFace(meta.family, buffer, {
            weight: meta.weight,
            style: meta.style,
          });

          await fontFace.load();

          // Deleted while loading.
          if (!fontFaces.has(key)) return;

          document.fonts.add(fontFace);
          fontFaces.set(key, fontFace);
          faces.value[key] = meta;
        } catch (error) {
          fontFaces.delete(key);
          console.error(error);
        }
      }),
    );
  }

  return {
    setSignedUrls,
    assets,
    images,
    imageNames,
    imageUrl,
    media,
    mediaNames,
    mediaUrl,
    isVideo,
    fonts,
    fontFamilies,
    models,
    modelUrl,
    isImage,
    isFont,
    isModel,
    fetchAssets,
    uploadAssets,
    deleteAssets,
  };
});

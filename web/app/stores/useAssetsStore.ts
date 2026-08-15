import type { FileObject } from "@supabase/storage-js";

export const useAssetsStore = defineStore("assets", () => {
  const client = useSupabaseClient();

  const assets = ref<(FileObject & { url: URL })[]>([]);

  const LIST_LIMIT = 1000;

  const images = computed(() => {
    return assets.value.filter((asset) => isImage(asset.name));
  });

  const imageNames = computed(() => images.value.map((a) => a.name));

  const imageUrls = computed(
    () => new Map(images.value.map((a) => [a.name, a.url.toString()])),
  );

  function imageUrl(name: string) {
    return imageUrls.value.get(name);
  }

  const fonts = computed(() => {
    return assets.value.filter((asset) => isFont(asset.name));
  });

  const models = computed(() => {
    return assets.value.filter((asset) => isModel(asset.name));
  });

  const modelUrls = computed(
    () => new Map(models.value.map((a) => [a.name, a.url.toString()])),
  );

  function modelUrl(name: string) {
    return modelUrls.value.get(name);
  }

  const isImage = (name: string) => assetKind(name) === "image";
  const isFont = (name: string) => assetKind(name) === "font";
  const isModel = (name: string) => assetKind(name) === "model";

  const blobUrls = new Set<string>();

  async function resolveAsset(deck: string, asset: FileObject) {
    const { url, response } = await getStorageObject(
      "assets",
      deck,
      asset.name,
      asset.updated_at ?? asset.id,
    );

    if (!response.ok) return null;

    if (isModel(asset.name)) {
      const blob = URL.createObjectURL(await response.blob());

      blobUrls.add(blob);

      return { ...asset, url: new URL(blob) };
    }

    return { ...asset, url };
  }

  function releaseBlobUrls() {
    blobUrls.forEach((url) => URL.revokeObjectURL(url));
    blobUrls.clear();
  }

  async function fetchAssets(deck: string) {
    const { data, error } = await client.storage
      .from("assets")
      .list(deck, { limit: LIST_LIMIT });

    if (error) {
      console.error(error);
    }

    if (!data) return;

    releaseBlobUrls();

    // One round trip per asset, run together — a deck of twenty used to cost
    // twenty sequential fetches before anything appeared.
    const resolved = await Promise.all(
      data.map((asset) => resolveAsset(deck, asset as FileObject)),
    );

    assets.value = resolved.filter((asset) => asset !== null);

    await serveFonts();
  }

  async function uploadAssets(deck: string, files: File[]) {
    const { data: stored } = await client.storage
      .from("assets")
      .list(deck, { limit: LIST_LIMIT });

    const taken = new Set([
      ...assets.value.map((a) => a.name),
      ...(stored ?? []).map((a) => a.name),
    ]);

    const planned = files.flatMap((file) => {
      if (!assetKind(file.name)) return [];

      const name = uniqueAssetName(file.name, taken);

      taken.add(name);

      return [{ file, name }];
    });

    const entries = await Promise.all(
      planned.map(async ({ file, name }) => {
        const { error } = await client.storage
          .from("assets")
          .upload(`${deck}/${name}`, file);

        if (error) console.error(error);

        return [file, error ? null : name] as const;
      }),
    );

    const names = new Set(entries.flatMap(([, name]) => (name ? [name] : [])));

    if (names.size) {
      const { data } = await client.storage
        .from("assets")
        .list(deck, { limit: LIST_LIMIT });
      const added = await Promise.all(
        (data ?? [])
          .filter((asset) => names.has(asset.name))
          .map((asset) => resolveAsset(deck, asset as FileObject)),
      );

      assets.value = [...assets.value, ...added.filter((a) => a !== null)];

      await serveFonts();
    }

    return new Map(entries);
  }

  async function deleteSelectedAsset(deck: string, asset: FileObject) {
    const { error } = await client.storage
      .from("assets")
      .remove([`${deck}/${asset.name}`]);

    if (error) {
      return console.error(error);
    }

    await fetchAssets(deck);
  }

  const served = new Set<string>();

  async function serveFonts() {
    const pending = fonts.value.filter((f) => !served.has(f.url.toString()));

    await Promise.all(
      pending.map(async (font) => {
        try {
          const fontName = font.name.split(".")[0] ?? font.name;
          const fontFace = new FontFace(fontName, `url(${font.url})`);

          await fontFace.load();

          document.fonts.add(fontFace);
          served.add(font.url.toString());
        } catch (error) {
          console.error(error);
        }
      }),
    );
  }

  return {
    assets,
    images,
    imageNames,
    imageUrl,
    fonts,
    models,
    modelUrl,
    isImage,
    isFont,
    isModel,
    fetchAssets,
    uploadAssets,
    deleteSelectedAsset,
  };
});

<template>
  <Title>{{ deck?.title ?? "404" }} | Quartz</Title>
  <div v-if="!deck">
    <p>Either the deck does not exist or you do not have access.</p>
    <NuxtLink to="/atelier">Return</NuxtLink>
  </div>
  <div @contextmenu.prevent v-else class="flex flex-col h-screen select-none">
    <AtelierHeader :title="deck.title" />
    <div class="flex flex-1 overflow-hidden">
      <AtelierToolbar />
      <AtelierInspector />
      <div class="flex flex-1 flex-col min-w-0">
        <div class="render-container">
          <AtelierRender canEdit />
        </div>
        <AtelierTimeline />
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.render-container {
  @apply px-[6.28%] flex flex-1 items-center;
}
</style>

<script setup lang="ts">
const client = useSupabaseClient();

// Derive the channel type from the client so it matches the exact
// @supabase/realtime-js copy the client is built from (avoids the
// duplicate-package type mismatch with @nuxtjs/supabase).
type RealtimeChannel = ReturnType<typeof client.channel>;

const { fetchDeck, fetchAllSlides } = useDeckStore();
const { fetchAssets } = useAssetsStore();

let deckRC: RealtimeChannel, slidesRC: RealtimeChannel;

const snapshotScheduler = useSnapshotScheduler();

const { data: deck, refresh: refreshDeck } = await useAsyncData(
  "deck",
  async () => await fetchDeck(useRoute().params.id as string)
);

const { refresh: refreshSlides } = await useAsyncData(
  "slides",
  async () => await fetchAllSlides(useRoute().params.id as string)
);

onMounted(async () => {
  snapshotScheduler.start();

  deckRC = client
    .channel("public:decks")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "decks" },
      () => refreshDeck()
    )
    .subscribe();

  slidesRC = client
    .channel("public:slides")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "slides",
        filter: `deck=eq.${deck.value?.id}`,
      },
      () => refreshSlides()
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "slides",
      },
      () => refreshSlides()
    )
    .subscribe();

  await fetchAssets(deck.value?.id as string);
});

onUnmounted(() => {
  snapshotScheduler.stop();
  client.removeAllChannels();
});
</script>

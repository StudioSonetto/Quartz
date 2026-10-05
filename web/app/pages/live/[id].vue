<template>
  <Title>{{ status === "error" ? "404" : deckTitle }} | Quartz</Title>
  <div v-if="status === 'error'">
    <p>Either the deck does not exist or you do not have access.</p>
    <NuxtLink to="/atelier">Return</NuxtLink>
  </div>
  <div
    v-else
    v-on="controls"
    @mousemove="onCursorMoved"
    tabindex="0"
    autofocus
    class="live"
  >
    <AtelierRender class="select-none" />
    <div
      :class="{
        'opacity-0': !cursorMoved,
      }"
      class="overlay"
    >
      <p>Page {{ currentSlidesIndex + 1 }} / {{ slides.length }}</p>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.live {
  @apply h-screen select-none;
  @apply flex justify-center items-center;

  .overlay {
    @apply fixed bottom-18 bg-dark-900 p-3 rounded-6 text-3;
    @apply transition-opacity duration-300;
  }
}
</style>

<script setup lang="ts">
const client = useSupabaseClient();

type RealtimeChannel = ReturnType<typeof client.channel>;

const { fetchDeck, fetchAllSlides, openDeck, enterSlide } = useDeckStore();
const { slides, currentSlidesIndex, deckTitle, openedDeck } = storeToRefs(
  useDeckStore(),
);
const { fetchAssets } = useAssetsStore();
const { reset } = useAnimationState();

const controls = usePresentationControls(() => true, leavePresentation);

const cursorMoved = ref(false);

function onCursorMoved() {
  if (cursorMoved.value) return;

  cursorMoved.value = true;

  setTimeout(() => {
    cursorMoved.value = false;
  }, 5000);
}

function leavePresentation() {
  if (mine.value) navigateTo(`/atelier/${id}`);
}

let deckRC: RealtimeChannel, slidesRC: RealtimeChannel;

const id = useRoute().params.id as string;

const mine = computed(() => openedDeck.value === id);

const { status } = await useAsyncData(`live-deck-${id}`, () => openDeck(id), {
  lazy: mine.value,
});

onMounted(async () => {
  if (status.value === "error") return;

  enterSlide();

  // Realtime channels are private, so only the owner gets live edits.
  if (!mine.value) return;

  fetchAssets(id);

  deckRC = client
    .channel(`live:${id}:decks`, { config: { private: true } })
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "decks", filter: `id=eq.${id}` },
      () => fetchDeck(id),
    )
    .subscribe();

  slidesRC = client
    .channel(`live:${id}:slides`, { config: { private: true } })
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "slides",
        filter: `deck=eq.${id}`,
      },
      () => fetchAllSlides(id),
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "slides",
      },
      () => fetchAllSlides(id),
    )
    .subscribe();
});

onUnmounted(() => {
  reset();

  client.removeAllChannels();
});
</script>

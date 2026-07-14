<template>
  <Title>Dashboard | Quartz</Title>
  <div class="flex">
    <DashboardSidebar />
    <div class="flex-1 overflow-auto">
      <DashboardHeader />
      <div class="flex flex-wrap gap-6 p-6">
        <DashboardDeck
          v-for="deck in decks"
          :title="deck.title"
          :id="deck.id"
          :last_modified="deck.last_modified"
          :key="deck.id"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient();

// Derive the channel type from the client so it matches the exact
// @supabase/realtime-js copy the client is built from (avoids the
// duplicate-package type mismatch with @nuxtjs/supabase).
type RealtimeChannel = ReturnType<typeof client.channel>;

let realtimeChannel: RealtimeChannel;

const { data: decks, refresh: refreshDecks } = await useAsyncData(
  "decks",
  async () => await useDeckStore().fetchAllDecks(),
);

onMounted(() => {
  realtimeChannel = client
    .channel("public:decks")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "decks" },
      () => refreshDecks(),
    );

  realtimeChannel.subscribe();
});

onUnmounted(() => {
  client.removeChannel(realtimeChannel);
});
</script>

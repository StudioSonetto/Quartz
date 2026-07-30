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

type RealtimeChannel = ReturnType<typeof client.channel>;

let realtimeChannel: RealtimeChannel;

const { data: decks, refresh: refreshDecks } = await useAsyncData(
  "decks",
  async () => await useDeckStore().fetchAllDecks(),
);

onMounted(() => {
  const userId = useAuthStore().user?.id;

  realtimeChannel = client
    .channel(`dashboard:${userId}:decks`, { config: { private: true } })
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

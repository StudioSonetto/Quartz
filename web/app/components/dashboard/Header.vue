<template>
  <div class="dashboard-header">
    <p>Decks</p>
    <div class="dashboard-header-actions">
      <UIButton
        v-if="template"
        :disabled="copying"
        @click="fromTemplate(template)"
      >
        New from template
        <div class="i-carbon-template"></div>
      </UIButton>
      <UIButton @click="deck.insertNewDeck()">
        New Deck
        <div class="i-carbon-add"></div>
      </UIButton>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ template?: string }>();

const deck = useDeckStore();

const copying = ref(false);

async function fromTemplate(template: string) {
  copying.value = true;

  const id = await deck
    .insertFromTemplate(template)
    .finally(() => (copying.value = false));

  if (id) navigateTo(`/atelier/${id}`);
}
</script>

<style scoped lang="postcss">
.dashboard-header {
  @apply w-full h-16 px-6 select-none bg-dark-800;
  @apply border-solid border-0 border-b-1 border-dark-200;
  @apply flex items-center justify-between;

  p {
    @apply text-base font-500;
  }

  .dashboard-header-actions {
    @apply flex gap-2;
  }
}
</style>

<template>
  <div class="dashboard-header">
    <p>Decks</p>
    <UIButton @click="useDeckStore().insertNewDeck()">
      New Deck
      <div class="i-carbon-add"></div>
    </UIButton>
  </div>
</template>

<style scoped lang="postcss">
.dashboard-header {
  @apply w-full h-16 px-6 select-none;
  @apply border-solid border-0 border-b-1 border-dark-200;
  @apply flex items-center justify-between;

  p {
    @apply text-base font-500;
  }
}
</style>

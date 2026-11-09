<template>
  <div class="deck-skeleton">
    <div class="deck-skeleton-preview" />
    <div class="deck-skeleton-info">
      <div class="deck-skeleton-title" />
      <div class="deck-skeleton-date" />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.deck-skeleton {
  @apply w-sm bg-dark-800 overflow-hidden;
  @apply border-rd-lg border-solid border-1 border-dark-200;

  &.fade-fast-leave-active {
    @apply hidden;
  }

  .deck-skeleton-preview {
    @apply w-full aspect-video bg-dark-600 animate-pulse;
  }

  .deck-skeleton-info {
    @apply flex flex-col gap-2 px-4 py-3;
    @apply border-solid border-0 border-t-1 border-dark-200;

    .deck-skeleton-title,
    .deck-skeleton-date {
      @apply h-3 border-rd bg-dark-600 animate-pulse;
    }

    .deck-skeleton-title {
      @apply w-1/2;
    }

    .deck-skeleton-date {
      @apply w-1/3;
    }
  }
}
</style>

<template>
  <div class="bar" @contextmenu.prevent>
    <AtelierSelectionActions />
  </div>
</template>

<style scoped lang="postcss">
.bar {
  @apply flex items-center gap-4;
  @apply py-1;
  @apply text-light-200;
}
</style>

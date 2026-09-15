<template>
  <div class="timeline">
    <Transition name="timeline-swap" mode="out-in">
      <KeepAlive>
        <AtelierDopesheet v-if="rows.length" :rows="rows" />
        <AtelierSlides v-else />
      </KeepAlive>
    </Transition>
  </div>
</template>

<style scoped lang="postcss">
.timeline {
  @apply flex flex-col bg-dark-800 h-[15vh] w-full;
  @apply border-solid border-0 border-t-2 border-dark-200;
}

.timeline-swap-enter-active,
.timeline-swap-leave-active {
  @apply transition-all;
}

.timeline-swap-enter-from,
.timeline-swap-leave-to {
  @apply opacity-0 translate-y-1;
}
</style>

<script setup lang="ts">
const rows = useDopesheetRows();
const { reset } = usePlayhead();

whenever(() => !rows.value.length, reset);
</script>

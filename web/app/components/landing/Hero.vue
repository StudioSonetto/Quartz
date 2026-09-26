<template>
  <div>
    <div class="hero">
      <GradientShader :paused="top <= 0" />
      <div class="title">
        <h1>Pitch Ambitiously</h1>
      </div>
      <div class="scroll-down">
        <p>
          <span class="i-carbon-chevron-down"></span>
          scroll to explore
          <span class="i-carbon-chevron-down"></span>
        </p>
      </div>
    </div>
    <div ref="cover" class="hero-cover">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.hero {
  @apply flex sticky top-0 h-[95svh];

  .title {
    @apply absolute select-none opacity-90;
    @apply top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2;
    @apply w-full px-6 text-center;

    h1 {
      @apply text-[12vw] sm:text-6xl md:text-7xl lg:text-8xl;
      @apply font-400 tracking-tight;
    }
  }

  .scroll-down {
    @apply absolute bottom-8 left-1/2 -translate-x-1/2;
    @apply w-full px-6 select-none opacity-90;

    p {
      @apply flex items-center justify-center gap-2 ui-text-3;
    }
  }
}

.hero-cover {
  @apply relative z-1 bg-dark-900;
  @apply border-solid border-0 border-t-2 border-dark-200;
}
</style>

<script setup lang="ts">
const cover = useTemplateRef<HTMLDivElement>("cover");

const { top } = useElementBounding(cover);
</script>

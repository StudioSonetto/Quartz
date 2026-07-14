<template>
  <div class="hero">
    <GradientShader />
    <div class="title">
      <h1>Pitch Ambitiously</h1>
    </div>
    <div class="scroll-down">
      <p>
        <span class="i-carbon-chevron-down"></span>
        scroll down to learn more
        <span class="i-carbon-chevron-down"></span>
      </p>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.hero {
  @apply flex relative h-[95vh];
  @apply border-solid border-0 border-b-2 border-dark-200;

  .title {
    @apply absolute select-none opacity-90;
    @apply top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2;
    @apply w-full text-center px-6;

    h1 {
      @apply text-5xl md:text-6xl lg:text-9xl font-400 tracking-tight;
    }
  }

  .scroll-down {
    @apply absolute bottom-8 left-1/2 -translate-x-1/2;
    @apply select-none opacity-90;

    p {
      @apply flex items-center gap-2 ui-text-3;
    }
  }
}
</style>

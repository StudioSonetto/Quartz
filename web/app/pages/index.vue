<template>
  <LandingNavbar />
  <LandingHero />
  <section>
    <div>
      <h2>Why<br />Quartz?</h2>
    </div>
  </section>
  <LandingFooter />
</template>

<style scoped lang="postcss">
section {
  @apply h-screen px-12 py-24;

  h2 {
    @apply uppercase font-100 text-8xl;
  }
}
</style>

<script setup lang="ts">
useSeoMeta({
  title: "Quartz",
  ogTitle: "Quartz",
  description: "Open source slides engine; built for ambitious presenters.",
  ogDescription: "Open source slides engine; built for ambitious presenters.",
  ogUrl: "https://quartz.graphics/",
});
</script>

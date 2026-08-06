<template>
  <LandingNavbar />
  <LandingHero />
  <LandingSection title="Node powered" description="...">
    <div class="bg-dark-500 w-full h-xl my-12"></div>
  </LandingSection>
  <LandingSection title="Keyboard driven" description="...">
    <div class="bg-dark-500 w-full h-xl my-12"></div>
  </LandingSection>
  <LandingModules />
  <LandingPricing />
  <LandingRoadmap />
  <LandingFAQ />
  <LandingSection title="cta">
    <div class="flex flex-col items-center justify-center">
      <p class="text-4xl">Start pitching easy.</p>
    </div>
  </LandingSection>
  <LandingFooter />
</template>

<script setup lang="ts">
useSeoMeta({
  title: "Quartz",
  ogTitle: "Quartz",
  description: "Open source slides engine; built for ambitious presenters.",
  ogDescription: "Open source slides engine; built for ambitious presenters.",
  ogUrl: "https://quartz.graphics/",
});
</script>

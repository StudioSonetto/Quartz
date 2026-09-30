<template>
  <LandingNavbar />
  <LandingHero>
    <LandingProduct />
    <LandingPricing />
    <LandingRoadmap />
    <LandingFAQ />
    <LandingSection title="cta">
      <div class="flex flex-col items-center gap-8 text-center">
        <p data-reveal class="ui-text-6">Pitch ambitiously.</p>
        <div data-reveal>
          <UIButton variant="solid" to="/auth">Start free</UIButton>
        </div>
      </div>
    </LandingSection>
  </LandingHero>
  <LandingFooter />
</template>

<script setup lang="ts">
import Lenis from "lenis";

// Discord always opens the activity at "/", with frame_id in the query.
definePageMeta({
  middleware: (to) => {
    if (to.query.frame_id)
      return navigateTo({ path: "/discord", query: to.query });
  },
});

let lenis: Lenis;

onMounted(() => {
  lenis = new Lenis({ autoRaf: true });
});

onBeforeUnmount(() => lenis?.destroy());

useSeoMeta({
  title: "Quartz",
  ogTitle: "Quartz",
  description: "Open core slides engine; built for ambitious presenters.",
  ogDescription: "Open core slides engine; built for ambitious presenters.",
});
</script>

<template>
  <LandingNavbar />
  <LandingHero>
    <LandingSection title="Node powered" description="...">
      <div class="bg-dark-500 w-full h-xl"></div>
    </LandingSection>
    <LandingSection title="Keyboard driven" description="...">
      <div class="bg-dark-500 w-full h-xl"></div>
    </LandingSection>
    <LandingPricing />
    <LandingRoadmap />
    <LandingFAQ />
    <LandingSection title="cta">
      <div class="flex flex-col items-center justify-center">
        <p class="ui-text-6">Start pitching easy.</p>
      </div>
    </LandingSection>
  </LandingHero>
  <LandingFooter />
</template>

<script setup lang="ts">
import Lenis from "lenis";

let lenis: Lenis;

onMounted(() => {
  lenis = new Lenis({ autoRaf: true });
});

onBeforeUnmount(() => lenis?.destroy());

useSeoMeta({
  title: "Quartz",
  ogTitle: "Quartz",
  ogImage: "/images/og-image.png",
  description: "Open core slides engine; built for ambitious presenters.",
  ogDescription: "Open core slides engine; built for ambitious presenters.",
  ogUrl: "https://quartz.graphics/",
});

useHead({
  htmlAttrs: {
    lang: "en",
  },
});
</script>

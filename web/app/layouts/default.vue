<template>
  <main>
    <slot />
    <ContextMenu />
    <SpeedInsights />
  </main>
</template>

<script setup lang="ts">
import { SpeedInsights } from "@vercel/speed-insights/nuxt";
</script>

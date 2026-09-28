<template>
  <LandingSection
    id="product"
    title="Product"
    description="Why switch to Quartz when other presentation apps already exist?"
  >
    <div class="product-grid">
      <div v-for="feature in features" :key="feature.title">
        <div class="product-media">
          <img
            v-if="feature.image"
            :src="feature.image"
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>
        <h3>{{ feature.title }}</h3>
        <p>{{ feature.text }}</p>
      </div>
    </div>
  </LandingSection>
</template>

<style scoped lang="postcss">
.product-grid {
  @apply grid md:grid-cols-2 gap-x-8 gap-y-16;

  .product-media {
    @apply w-full aspect-video bg-dark-500 border-rd overflow-hidden;

    img {
      @apply w-full h-full object-cover;
    }
  }

  h3 {
    @apply mt-6 ui-text-4 font-500;
  }

  p {
    @apply mt-3 ui-muted;
  }
}
</style>

<script setup lang="ts">
const features: { title: string; text: string; image?: string }[] = [
  {
    title: "Node based editor with modern UI & UX.",
    text: "Flexible and reusable. Empower your slides with nodes using dynamic and scriptable values and states.",
  },
  {
    title: "Realtime 3D rendering.",
    text: "Import your 3D models or use basic shapes to enhance your story.",
  },
  {
    title: "Complex and interactive animations.",
    text: "Key component values to animate them with the built-in dopesheet, and trigger them by Events.",
  },
  {
    title: "Present or pitch ambitiously.",
    text: "You can currently either present locally or in Discord via Activity!",
  },
];
</script>

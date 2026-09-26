<template>
  <footer>
    <div class="footer-about">
      <NuxtLink to="/" class="footer-brand">quartz</NuxtLink>
      <p>Open-core slides engine for ambitious presentations.</p>
      <p class="footer-copyright">© {{ new Date().getFullYear() }} Sonetto</p>
    </div>
    <nav class="footer-links">
      <div v-for="group in groups" :key="group.title">
        <p>{{ group.title }}</p>
        <ul>
          <li v-for="link in group.links" :key="link.label">
            <NuxtLink :to="link.to" :target="link.target">{{
              link.label
            }}</NuxtLink>
          </li>
        </ul>
      </div>
    </nav>
  </footer>
</template>

<style scoped lang="postcss">
footer {
  @apply ui-section select-none bg-dark-800;
  @apply border-solid border-0 border-t-2 border-dark-200;
  @apply flex flex-col gap-12 md:flex-row md:justify-between;
}

.footer-about {
  @apply flex flex-col gap-8 max-w-xs ui-text-4;

  .footer-brand {
    @apply w-fit ui-text-6 font-medium;
  }

  .footer-copyright {
    @apply ui-text-3 text-light-200/40;
  }
}

.footer-links {
  @apply flex gap-12 sm:gap-20;

  p {
    @apply mb-4 ui-text-3 font-400 text-light-200/40;
  }

  ul {
    @apply flex flex-col gap-3 list-none;
  }

  a {
    @apply ui-text-3 text-light-200/70 transition-colors;
    @apply hover:text-light-200 focus-visible:text-light-200 focus-visible:underline;
  }
}
</style>

<script setup lang="ts">
type Link = { label: string; to: string; target?: string };

const groups: { title: string; links: Link[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Pricing", to: "/#pricing" },
      { label: "Roadmap", to: "/#roadmap" },
      { label: "FAQ", to: "/#faq" },
      { label: "Docs", to: "/docs" },
    ],
  },
  {
    title: "Community",
    links: [{ label: "Discord", to: DISCORD_URL, target: "_blank" }],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", to: "/legal/privacy" },
      { label: "Terms", to: "/legal/terms" },
    ],
  },
];
</script>

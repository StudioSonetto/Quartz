<template>
  <LandingSection title="FAQ">
    <template #description>
      Visit our
      <NuxtLink to="https://discord.gg/MXWb4W92ZH" external target="_blank"
        >Discord</NuxtLink
      >
      if you have more questions!
    </template>
    <div class="faq-grid">
      <div v-for="(column, i) in columns" :key="i" class="faq-column">
        <div v-for="item in column" :key="item.q" class="faq-item">
          <button :aria-expanded="opened.has(item.q)" @click="toggle(item.q)">
            {{ item.q }}
            <div class="faq-icon i-carbon-add" />
          </button>
          <div :inert="!opened.has(item.q)" class="faq-answer">
            <div>
              <p>{{ item.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </LandingSection>
</template>

<style scoped lang="postcss">
.faq-grid {
  @apply flex flex-col md:flex-row gap-6;
}

.faq-column {
  @apply flex flex-col gap-6 w-full;
}

.faq-item {
  @apply border-solid border-1 border-dark-200 border-rd;

  button {
    @apply flex justify-between items-center gap-6 w-full p-5;
    @apply ui-text-3 text-left text-inherit bg-transparent border-0;
    @apply cursor-pointer;
  }

  p {
    @apply px-5 pb-5 ui-text-3 text-light-200/60;
  }
}

.faq-answer {
  @apply grid grid-rows-[0fr] transition-[grid-template-rows] duration-300;

  & > div {
    @apply overflow-hidden min-h-0;
  }
}

[aria-expanded="true"] {
  .faq-icon {
    @apply rotate-45;
  }

  & + .faq-answer {
    @apply grid-rows-[1fr];
  }
}

.faq-icon {
  @apply flex-shrink-0 text-xl transition-transform;
}
</style>

<script setup lang="ts">
const items = [
  {
    q: "Where does Quartz run?",
    a: "Directly in your browser, without the need to install anything just like your other slides app you knew! You can also present inside Discord as an Activity.",
  },
  {
    q: "Is Quartz open source?",
    a: "Kind of, the core is open source under Apache-2.0, so you can self-host it.",
  },
  {
    q: "What does subscribing the Pro plan gives?",
    a: "Currently only 3D features such as importing objects, animating them, and shader support. Animation is included in the Free/Basic plan.",
  },
  {
    q: "Can I animate my slides?",
    a: "Yes. Every slides has a timeline with keyframes, states, and events like hover and click.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! Pro comes with a 7 day free trial.",
  },
  {
    q: "What if my Pro plan expires afterwards?",
    a: "No worries at all, Pro plan related nodes are still available for presentations, but you can't add edit them.",
  },
];

const opened = reactive(new Set<string>());

function toggle(q: string) {
  if (!opened.delete(q)) opened.add(q);
}

const half = Math.ceil(items.length / 2);
const columns = [items.slice(0, half), items.slice(half)];
</script>

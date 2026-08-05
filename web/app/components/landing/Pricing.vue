<template>
  <LandingSection
    title="Pricing"
    description="One time module payment instead of subscriptions."
  >
    <div class="pricing">
      <table>
        <colgroup>
          <col class="w-2/5" />
          <col class="w-3/10" />
          <col class="w-3/10" />
        </colgroup>
        <thead>
          <tr>
            <th></th>
            <th>
              <h3>Core</h3>
              <p>Free forever.</p>
            </th>
            <th>
              <h3>Any paid module*</h3>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.label">
            <td class="feature">{{ row.label }}</td>
            <td class="value">{{ row.free }}</td>
            <td class="value">
              <span v-if="row.unlimited" class="unlimited">∞</span>
              <template v-else-if="row.module">
                with <span class="module">{{ row.module }}</span> ·
                {{ row.paid }}
              </template>
              <template v-else>{{ row.paid }}</template>
            </td>
          </tr>
          <tr class="actions">
            <td class="feature">Local presenting · full editor</td>
            <td>
              <NuxtLink class="btn" to="/auth">Start free</NuxtLink>
            </td>
            <td>
              <NuxtLink class="btn btn-solid" to="#modules">
                Browse modules
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="footnote">
        <span class="unlimited">∞</span> Buying <span class="dim">any</span>
        module removes every limit — they never expire.
      </p>
    </div>
  </LandingSection>
</template>

<style scoped lang="postcss">
.pricing {
  @apply select-none;

  table {
    @apply w-full table-fixed border-collapse;
    @apply border-solid border-1 border-dark-200;
  }

  th,
  td {
    @apply text-left align-middle px-8 py-5;
    @apply border-solid border-0 border-b-1 border-l-1 border-dark-200;
  }

  th:first-child,
  td:first-child {
    @apply border-l-0;
  }

  tbody tr:last-child td {
    @apply border-b-0;
  }

  thead {
    th {
      @apply py-8;

      h3 {
        @apply uppercase font-100 text-4xl m-0;
      }

      p {
        @apply ui-text-3 mt-3 mb-0 text-light-200/50;
      }
    }
  }

  .feature {
    @apply ui-text-3 text-light-200/60;
  }

  .value {
    @apply ui-text-3 font-500 text-light-200;
  }

  .module {
    @apply text-accent;
  }

  .unlimited {
    @apply text-accent;
  }

  .dim {
    @apply text-light-200/50;
  }

  .actions td {
    @apply py-8;
  }

  .btn {
    @apply inline-flex justify-center items-center;
    @apply border-solid border-1 border-light-200/60 border-rd;
    @apply px-6 py-3 ui-text-3 transition-all;
    @apply hover:bg-light-200 hover:text-dark-900 active:opacity-80;
  }

  .btn-solid {
    @apply bg-light-200/90 text-dark-900 border-light-200/90;
    @apply hover:bg-light-200;
  }

  .footnote {
    @apply flex items-center gap-3 ui-text-3 mt-10 mb-0 font-500;
  }

  .note {
    @apply ui-text-3 mt-8 mb-0 text-light-200/50;
  }
}
</style>

<script setup lang="ts">
interface PricingRow {
  label: string;
  free: string;
  paid: string;
  module?: string;
  unlimited?: boolean;
}

const rows: PricingRow[] = [
  { label: "Max Decks", free: "10", paid: "∞", unlimited: true },
  { label: "Max Slides per Deck", free: "30", paid: "∞", unlimited: true },
  { label: "Max Nodes per Slides", free: "20", paid: "∞", unlimited: true },
  {
    label: "3D Rendering",
    free: "Basic",
    paid: "$100",
    module: "WebGL",
  },
];
</script>

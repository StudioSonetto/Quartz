<template>
  <LandingSection
    title="Pricing"
    description="Only pay for the features you want."
  >
    <div class="pricing">
      <table>
        <colgroup>
          <col class="w-1.5/4" />
          <col class="w-1.25/4" />
          <col class="w-1.25/4" />
        </colgroup>
        <thead>
          <tr>
            <th></th>
            <th>
              <h3>Core Editor</h3>
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
              <div v-if="row.unlimited" class="text-xl i-carbon-infinity"></div>
              <template v-else-if="row.module">
                with <span class="module">{{ row.module }}</span> ·
                {{ row.paid }}
              </template>
              <template v-else>{{ row.paid }}</template>
            </td>
          </tr>
          <tr class="actions">
            <td class="feature"></td>
            <td>
              <NuxtLink class="btn" to="/auth">Start free</NuxtLink>
            </td>
            <td>
              <NuxtLink class="btn btn-solid" to="#modules">
                Browse all modules
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="whitespace"></div>
      <div class="whitespace"></div>
      <div class="whitespace"></div>
      <p class="footnote">* Purchasing any module unlock every size limits.</p>
    </div>
  </LandingSection>
</template>

<style scoped lang="postcss">
.pricing {
  table {
    @apply w-full table-fixed border-collapse;
    @apply border-solid border-1 border-dark-200;
  }

  th,
  td {
    @apply text-left align-middle p-8;
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
        @apply uppercase font-400 text-3xl m-0;
      }

      p {
        @apply ui-text-3 mt-3 text-light-200/60;
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

  .dim {
    @apply text-light-200/50;
  }

  .actions td {
    @apply py-8;
  }

  .btn {
    @apply border-solid border-1.5 border-light-200/60 border-rd;
    @apply px-6 py-3 ui-text-3 transition-colors;
    @apply hover:bg-light-200 hover:text-dark-900;
  }

  .btn-solid {
    @apply bg-light-200/90 text-dark-900 border-light-200/90;
    @apply hover:bg-light-200;
  }

  .footnote {
    @apply flex items-center ui-text-3;
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
    label: "3D Rendering & Support",
    free: "Basic features only.",
    paid: "$50",
    module: "WebGL",
  },
];
</script>

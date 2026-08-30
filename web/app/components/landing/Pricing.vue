<template>
  <LandingSection title="Pricing" description="Price in AUD.">
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
            <h3>Basic</h3>
            <p>Free forever.</p>
          </th>
          <th>
            <h3>Pro</h3>
            <p>$20 per month.</p>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.label">
          <td class="feature">{{ row.label }}</td>
          <td class="value">{{ row.free }}</td>
          <td class="value">
            <div v-if="row.unlimited" class="text-xl i-carbon-infinity"></div>
            <template v-else>{{ row.paid }}</template>
          </td>
        </tr>
        <tr class="actions">
          <td class="feature"></td>
          <td>
            <UIButton to="/auth">Start free</UIButton>
          </td>
          <td>
            <UIButton variant="solid" to="/">Select plan</UIButton>
          </td>
        </tr>
      </tbody>
    </table>
  </LandingSection>
</template>

<style scoped lang="postcss">
table {
  @apply w-full table-fixed border-collapse;
  @apply border-solid border-1 border-dark-200;
}

th,
td {
  @apply text-left align-middle p-6;
  @apply border-solid border-0 border-b-1 border-l-1 border-dark-200;
}

th:first-child,
td:first-child {
  @apply border-l-0;
}

tbody tr:last-child td {
  @apply border-b-0;
}

thead th {
  @apply py-8;

  h3 {
    @apply uppercase font-400 text-3xl m-0;
  }

  p {
    @apply ui-text-3 mt-3 text-light-200/60;
  }
}

.feature {
  @apply ui-text-3 text-light-200/60;
}

.value {
  @apply ui-text-3 font-500 text-light-200;
}

.actions td {
  @apply py-8;
}
</style>

<script setup lang="ts">
interface PricingRow {
  label: string;
  free: string;
  paid: string;
  unlimited?: boolean;
}

const rows: PricingRow[] = [
  { label: "Max Decks", free: "10", paid: "∞", unlimited: true },
  { label: "Max Slides per Deck", free: "30", paid: "∞", unlimited: true },
  { label: "Max Nodes per Slides", free: "30", paid: "∞", unlimited: true },
  {
    label: "Assets storage size",
    free: "100 MB",
    paid: "5000 MB",
  },
  {
    label: "Animations and Events",
    free: "Fully unlocked.",
    paid: "Fully unlocked.",
  },
  {
    label: "Scriptable and Dynamic slides",
    free: "Fully unlocked.",
    paid: "Fully unlocked.",
  },
  {
    label: "3D Nodes and Rendering",
    free: "Limited features.",
    paid: "Fully unlocked.",
  },
  {
    label: "Presentation modes",
    free: "Local only.",
    paid: "Local + Interactive presentations & Discord Integration.",
  },
];
</script>

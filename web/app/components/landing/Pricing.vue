<template>
  <LandingSection title="Pricing" description="Start creating slides free!">
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
            <p>$20 USD per month.</p>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.label">
          <td class="feature">{{ row.label }}</td>
          <td v-for="(cell, i) in [row.free, row.paid]" :key="i" class="value">
            <div v-if="cell === true" class="text-xl i-carbon-checkmark"></div>
            <template v-else>{{ cell || "—" }}</template>
          </td>
        </tr>
        <tr class="actions">
          <td class="feature"></td>
          <td>
            <UIButton to="/auth">Start free</UIButton>
          </td>
          <td>
            <UIButton variant="solid" to="/api/billing/checkout" external>
              Select plan
            </UIButton>
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
  free: string | boolean;
  paid: string | boolean;
}

const rows: PricingRow[] = [
  { label: "3D nodes and rendering", free: false, paid: true },
  { label: "Animations, events and scripting", free: true, paid: true },
  { label: "Decks", free: "10", paid: "Unlimited" },
  { label: "Asset storage", free: "10 MB", paid: "100 MB" },
];
</script>

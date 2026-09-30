<template>
  <LandingSection id="pricing" title="Pricing">
    <template #description>
      Upgrade to Pro when you want
      <span class="tracking-[0.5em]">more</span> "depth".
    </template>
    <table>
      <colgroup>
        <col class="w-1.5/4" />
        <col class="w-1.25/4" />
        <col class="w-1.25/4" />
      </colgroup>
      <thead>
        <tr data-reveal>
          <th></th>
          <th>
            <h3>Basic</h3>
            <p>Free forever.</p>
          </th>
          <th>
            <h3>Pro</h3>
            <p>7 days free trial.</p>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.label" data-reveal>
          <td class="feature">{{ row.label }}</td>
          <td v-for="(cell, i) in [row.free, row.paid]" :key="i" class="value">
            <div v-if="cell === true" class="text-xl i-carbon-checkmark"></div>
            <template v-else>{{ cell || "—" }}</template>
          </td>
        </tr>
        <tr data-reveal class="actions">
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
    @apply ui-muted mt-3;
  }
}

.feature {
  @apply ui-muted;
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

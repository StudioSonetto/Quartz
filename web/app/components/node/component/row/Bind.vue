<template>
  <div ref="slot" class="bind-slot">
    <button
      type="button"
      class="bind-indicator"
      :class="{ 'bind-indicator-active': !!source }"
      @click="open = !open"
    >
      <div
        :class="source ? 'i-carbon-circle-solid' : 'i-carbon-circle-dash'"
      ></div>
    </button>
    <div v-if="open" class="bind-popover">
      <button
        v-for="entry in candidates"
        :key="entry.name"
        type="button"
        class="bind-option"
        @click="commit(entry.name)"
      >
        {{ entry.name }}
      </button>
      <input
        class="bind-expression"
        :value="source ?? ''"
        placeholder="expression"
        @change="commit(($event.target as HTMLInputElement).value)"
      />
      <p v-if="refused ?? error" class="bind-error">{{ refused ?? error }}</p>
      <button
        v-if="source"
        type="button"
        class="bind-clear"
        @click="commit('')"
      >
        unbind
      </button>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.bind-slot {
  @apply relative flex items-center ml-2;

  .bind-indicator {
    @apply bg-transparent border-none text-light-200 cursor-pointer opacity-40;

    &.bind-indicator-active {
      @apply opacity-100 text-accent;
    }
  }

  .bind-popover {
    @apply absolute right-0 top-full z-10 mt-1 p-2 w-48;
    @apply bg-dark-900 border-solid border-2 border-dark-200;
    @apply flex flex-col gap-1;
  }

  .bind-option,
  .bind-clear {
    @apply bg-transparent border-none text-left text-light-200 cursor-pointer;
    @apply ui-text-3;
  }

  .bind-expression {
    @apply bg-transparent border-none text-light-200 ui-text-3;
  }

  .bind-error {
    @apply ui-text-3 text-red-400;
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{
  path: string;
  kind?: VariableKind;
}>();

const open = ref(false);
const refused = ref<string | null>(null);
const slot = useTemplateRef<HTMLElement>("slot");

onClickOutside(slot, () => {
  open.value = false;
  refused.value = null;
});

const { source, candidates, error, bind } = useBinding(
  () => props.path,
  () => props.kind,
);

// A refused bind keeps the popover open, otherwise the reason vanishes with it.
function commit(expression: string) {
  const result = bind(expression);

  refused.value = result.ok ? null : result.error;

  if (result.ok) open.value = false;
}
</script>

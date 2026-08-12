<template>
  <div
    class="variable-entry"
    :class="{ 'variable-entry-selected': props.selected }"
    @click="emit('select')"
  >
    <div class="variable-header" @dblclick="emit('toggle')">
      <div
        class="variable-caret i-carbon-caret-right"
        :class="{ 'variable-caret-open': props.open }"
      ></div>
      <span class="variable-name">{{ props.entry.name || "unnamed" }}</span>
      <span v-if="issue" class="variable-issue">{{ issue }}</span>
      <span v-else class="variable-preview">
        <span
          v-if="swatch"
          class="variable-swatch"
          :style="{ background: swatch }"
        ></span>
        {{ preview }}
      </span>
    </div>
    <div v-if="props.open" class="variable-rows">
      <NodeComponentRow name="name">
        <NodeComponentRowFieldText
          lazy
          :value="props.entry.name"
          @update:value="(v: string) => emit('rename', v.trim())"
        />
      </NodeComponentRow>
      <NodeComponentRow name="kind">
        <NodeComponentRowFieldSelect
          :options="KINDS"
          :value="props.entry.kind"
          @update:value="
            (v: string) => emit('patch', { kind: v as VariableKind })
          "
        />
      </NodeComponentRow>
      <NodeComponentRow name="value">
        <div class="variable-value">
          <NodeComponentRowFieldColour
            v-if="literalColour"
            class="variable-swatch-field"
            :value="props.entry.expression"
            @update:value="(v: string) => emit('patch', { expression: v })"
          />
          <NodeComponentRowFieldText
            lazy
            :maxlength="120"
            :value="props.entry.expression"
            @update:value="(v: string) => emit('patch', { expression: v })"
          />
        </div>
      </NodeComponentRow>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.variable-entry {
  @apply w-full border-solid border border-transparent;

  &.variable-entry-selected {
    @apply border-accent;
  }

  .variable-header {
    @apply flex gap-2 cursor-pointer select-none;

    &:has(+ .variable-rows) {
      @apply mb-6;
    }

    .variable-caret {
      @apply transition-transform;

      &.variable-caret-open {
        @apply rotate-90;
      }
    }

    .variable-name {
      @apply flex-1 w-0 truncate;
    }

    .variable-preview {
      @apply opacity-60 truncate max-w-1/2;
    }

    .variable-swatch {
      @apply w-3 h-3 mr-1 inline-block align-middle;
      @apply border-solid border border-dark-200;
    }

    .variable-issue {
      @apply text-red-400 truncate max-w-1/2;
    }
  }

  .variable-rows {
    @apply pb-2;
  }

  .variable-value {
    @apply flex gap-2 w-full;

    .variable-swatch-field {
      @apply flex-none w-8!;
    }
  }
}
</style>

<script setup lang="ts">
const KINDS: VariableKind[] = ["colour", "number", "string", "font"];

const props = defineProps<{
  entry: VariableDef;
  problem?: string;
  scope?: Scope;
  selected: boolean;
  open: boolean;
}>();

const emit = defineEmits<{
  select: [];
  toggle: [];
  rename: [value: string];
  patch: [changes: Partial<VariableDef>];
}>();

const resolved = computed(() =>
  props.scope ? resolveSource(props.entry.expression, props.scope) : undefined,
);

const issue = computed(() => {
  if (props.problem) return props.problem;

  const result = resolved.value;

  if (!result) return undefined;

  return result.ok
    ? (kindProblem(result.value, props.entry.kind) ?? undefined)
    : result.error;
});

const preview = computed(() =>
  resolved.value?.ok ? String(resolved.value.value) : "",
);

const swatch = computed(() =>
  props.entry.kind === "colour" && !kindProblem(preview.value, "colour")
    ? preview.value
    : undefined,
);

const literalColour = computed(
  () => props.entry.kind === "colour" && isLiteral(props.entry.expression),
);
</script>

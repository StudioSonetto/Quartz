<template>
  <NodeComponentListEntry
    :index="props.index"
    :name="props.entry.name"
    :issue="issue"
    :preview="preview"
    :swatch="swatch"
  >
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
  </NodeComponentListEntry>
</template>

<style scoped lang="postcss">
.variable-value {
  @apply flex gap-2 w-full;

  .variable-swatch-field {
    @apply flex-none w-8!;
  }
}
</style>

<script setup lang="ts">
const KINDS: VariableKind[] = ["colour", "number", "string", "font"];

const props = defineProps<{
  index: number;
  entry: VariableDef;
  problem?: string;
  scope?: Scope;
}>();

const emit = defineEmits<{
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

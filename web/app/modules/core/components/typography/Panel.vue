<template>
  <NodeComponent
    name="typography"
    :icon="props.icon"
    :components="props.components"
  >
    <NodeComponentRow
      name="content"
      path="content"
      kind="string"
      :override="text"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldText
        isParagraph
        :value="Array.isArray(value) ? runsText(value) : value"
        :disabled="hasRuns && !sole"
        :highlight="selection"
        @update:value="update"
        @update:highlight="selection = $event"
      />
    </NodeComponentRow>
    <NodeComponentRow
      name="font"
      path="font"
      kind="font"
      :override="marks?.font"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldDropdown
        :options="[...fonts, ...fontAssets].sort()"
        :value="value"
        @update:value="(font: string) => setFont(font, update)"
      />
    </NodeComponentRow>
    <NodeComponentRow
      name="size"
      path="size"
      kind="number"
      :override="marks?.size"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow
      name="weight"
      path="weight"
      kind="number"
      :override="marks?.weight"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow
      name="line height"
      path="lineHeight"
      kind="number"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow
      name="letter spacing"
      path="letterSpacing"
      kind="number"
      :override="marks?.letterSpacing"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow
      name="transform"
      path="textTransform"
      :override="marks?.textTransform"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'none', icon: 'i-carbon-text-font' },
          { value: 'uppercase', icon: 'i-carbon-text-all-caps' },
          { value: 'lowercase', icon: 'i-carbon-text-small-caps' },
          { value: 'capitalize', icon: 'i-carbon-text-selection' },
        ]"
        :value="value"
        @update:value="update"
      />
    </NodeComponentRow>
    <NodeComponentRow
      name="opacity"
      path="opacity"
      kind="number"
      :override="marks?.opacity"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow
      name="colour"
      path="colour"
      kind="colour"
      :override="marks?.colour"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldColour :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow
      name="style"
      path="style"
      :override="marks?.style"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'italic', icon: 'i-carbon-text-italic' },
          { value: 'underline', icon: 'i-carbon-text-underline' },
          { value: 'strikethrough', icon: 'i-carbon-text-strikethrough' },
        ]"
        toggleMode
        :value="value"
        @update:value="update"
      />
    </NodeComponentRow>
    <NodeComponentRow
      name="alignment"
      path="alignment"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'left', icon: 'i-carbon-text-align-left' },
          { value: 'center', icon: 'i-carbon-text-align-center' },
          { value: 'right', icon: 'i-carbon-text-align-right' },
          { value: 'justify', icon: 'i-carbon-text-align-justify' },
        ]"
        :value="value"
        @update:value="update"
      />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
import { MARK_KEYS, type TypographyMarks } from "./types";

type Override = { value: any; update: (next: unknown) => void };

const props = defineProps<{
  components: ComponentModel[];
  nodes: Tree[];
  icon: string;
}>();

const { set } = useMergedFields(() => props.components);
const { textSelection } = storeToRefs(useAtelierStore());

const hasRuns = computed(() =>
  props.components.some((component) => Array.isArray(component.data?.content)),
);

const sole = computed(() =>
  props.components.length === 1 ? props.components[0] : undefined,
);

const runs = computed(() => toRuns(sole.value?.data.content));

const fontAssets = computed(() =>
  useAssetsStore().fonts.map((font) => font.family),
);

// The field edits runs as plain text, so the edit is spliced in rather than
// replacing the content and losing every mark with it.
const text = computed(() => {
  const component = sole.value;
  const current = runs.value;

  if (!component) return undefined;

  return {
    value: runsText(current),
    update: (next: unknown) => {
      set(["content"], fromRuns(spliceText(current, String(next))));

      // Character offsets taken before this edit no longer point at the same
      // characters.
      textSelection.value = null;
    },
  };
});

const selection = computed<{ start: number; end: number } | null>({
  get: () =>
    textSelection.value?.nodeId === sole.value?.node
      ? textSelection.value
      : null,
  set: (range) => {
    const node = sole.value?.node;

    if (node) textSelection.value = range ? { nodeId: node, ...range } : null;
  },
});

const marks = computed(() => {
  const component = sole.value;
  const current = runs.value;
  const active = selection.value;

  if (!component || !active) return undefined;

  const { start, end } = active;

  if (end > current.reduce((total, run) => total + run.text.length, 0))
    return undefined;

  return Object.fromEntries(
    MARK_KEYS.map((key) => [
      key,
      {
        value: selectionMark(current, start, end, key, component.data),
        update: (next: unknown) =>
          set(
            ["content"],
            fromRuns(
              applyMarks(
                current,
                start,
                end,
                { [key]: next } as Partial<TypographyMarks>,
                component.data,
              ),
            ),
          ),
      },
    ]),
  ) as Record<(typeof MARK_KEYS)[number], Override>;
});

function setFont(font: string, update: (next: unknown) => void) {
  ensureFonts([font]);
  update(font);
}
</script>

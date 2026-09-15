<template>
  <NodeComponent
    name="syntax"
    :icon="props.icon"
    :components="props.components"
  >
    <NodeComponentRow
      name="language"
      path="language"
      kind="string"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldDropdown
        :options="CODE_LANGUAGES"
        :value="value"
        @update:value="update"
      />
    </NodeComponentRow>
    <NodeComponentRow name="theme" path="theme" v-slot="{ value, update }">
      <NodeComponentRowFieldSelect
        :options="CODE_THEMES"
        :value="value"
        @update:value="update"
      />
    </NodeComponentRow>
    <NodeComponentRow name="background">
      <NodeComponentRowFieldRadio
        :options="backgroundOptions"
        :value="mixed ? undefined : background.type"
        @update:value="setBackground"
      />
    </NodeComponentRow>
    <NodeComponentRow
      v-if="!mixed && background.type === 'colour'"
      name="background colour"
      path="background.value"
      kind="colour"
    >
      <NodeComponentRowFieldColour
        :value="background.value"
        @update:value="(v) => set(['background'], { type: 'colour', value: v })"
      />
    </NodeComponentRow>
    <NodeComponentRow
      name="padding"
      path="padding"
      kind="number"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow
      name="radius"
      path="radius"
      kind="number"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
import { CODE_LANGUAGES, CODE_THEMES } from "./options";

const props = defineProps<{
  components: ComponentModel[];
  nodes: Tree[];
  icon: string;
}>();

const { field, set } = useMergedFields(() => props.components);

// "none" means the theme paints its own background.
const backgroundOptions = [
  { value: "none", icon: "i-carbon-paint-brush" },
  { value: "colour", icon: "i-carbon-color-palette" },
];

const {
  raw,
  mixed,
  paint: background,
} = usePaintField(() => props.components, field, "background");

function setBackground(next: string | string[]) {
  const previous = raw.value as { value?: string } | undefined;

  set(
    ["background"],
    one(next) === "colour"
      ? { type: "colour", value: previous?.value ?? "#0D1117" }
      : { type: "none" },
  );
}
</script>

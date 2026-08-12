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
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldText
        isParagraph
        :value="value"
        @update:value="update"
      />
    </NodeComponentRow>
    <NodeComponentRow name="font" path="font" kind="font" v-slot="{ value }">
      <NodeComponentRowFieldDropdown
        :options="[...fonts, ...fontAssets].sort()"
        :value="value"
        @update:value="setFont"
      />
    </NodeComponentRow>
    <NodeComponentRow
      name="size"
      path="size"
      kind="number"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow
      name="weight"
      path="weight"
      kind="number"
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
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow
      name="transform"
      path="textTransform"
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
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow
      name="colour"
      path="colour"
      kind="colour"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldColour :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow name="style" path="style" v-slot="{ value, update }">
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
const props = defineProps<{
  components: ComponentModel[];
  nodes: Tree[];
  icon: string;
}>();

const { set } = useMergedFields(() => props.components);

const fontAssets = computed(() =>
  useAssetsStore()
    .fonts.map((font) => font.name.split(".")[0])
    .filter((font) => font !== undefined),
);

function setFont(font: string) {
  ensureFonts([font]);

  set(["font"], font);
}
</script>

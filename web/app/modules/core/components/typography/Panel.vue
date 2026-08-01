<template>
  <NodeComponent name="typography" :icon="props.icon">
    <NodeComponentRow name="content">
      <NodeComponentRowFieldText
        isParagraph
        :value="field(['content'])"
        @update:value="(v) => set(['content'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="font">
      <NodeComponentRowFieldDropdown
        :options="[...fonts, ...fontAssets].sort()"
        :value="field(['font'])"
        @update:value="(v) => set(['font'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="size">
      <NodeComponentRowFieldNumber
        :value="field(['size'])"
        @update:value="(v) => set(['size'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="weight">
      <NodeComponentRowFieldNumber
        :value="field(['weight'])"
        @update:value="(v) => set(['weight'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="line height">
      <NodeComponentRowFieldNumber
        :value="field(['lineHeight'])"
        @update:value="(v) => set(['lineHeight'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="letter spacing">
      <NodeComponentRowFieldNumber
        :value="field(['letterSpacing'])"
        @update:value="(v) => set(['letterSpacing'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="transform">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'none', icon: 'i-carbon-text-font' },
          { value: 'uppercase', icon: 'i-carbon-text-all-caps' },
          { value: 'lowercase', icon: 'i-carbon-text-small-caps' },
          { value: 'capitalize', icon: 'i-carbon-text-selection' },
        ]"
        :value="field(['textTransform'])"
        @update:value="(v) => set(['textTransform'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="opacity">
      <NodeComponentRowFieldNumber
        :value="field(['opacity'])"
        @update:value="(v) => set(['opacity'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="colour">
      <NodeComponentRowFieldColour
        :value="field(['colour'])"
        @update:value="(v) => set(['colour'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="style">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'italic', icon: 'i-carbon-text-italic' },
          { value: 'underline', icon: 'i-carbon-text-underline' },
          { value: 'strikethrough', icon: 'i-carbon-text-strikethrough' },
        ]"
        toggleMode
        :value="field(['style'])"
        @update:value="(v) => set(['style'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="alignment">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'left', icon: 'i-carbon-text-align-left' },
          { value: 'center', icon: 'i-carbon-text-align-center' },
          { value: 'right', icon: 'i-carbon-text-align-right' },
          { value: 'justify', icon: 'i-carbon-text-align-justify' },
        ]"
        :value="field(['alignment'])"
        @update:value="(v) => set(['alignment'], v)"
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

const { field, set } = useMergedFields(() => props.components);

const fontAssets = computed(() =>
  useAssetsStore()
    .fonts.map((font) => font.name.split(".")[0])
    .filter((font) => font !== undefined),
);
</script>

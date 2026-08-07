<template>
  <NodeComponent name="model" :icon="props.icon">
    <NodeComponentRow name="type">
      <NodeComponentRowFieldSelect
        :value="typeValue"
        @update:value="(v) => set(['type'], v)"
        :options="[
          ...primitiveTypes,
          ...useAssetsStore().models.map((model) => model.name),
        ]"
      />
    </NodeComponentRow>
    <NodeComponentRow name="fallback">
      <NodeComponentRowFieldSelect
        :disabled="primitiveTypes.includes(typeValue)"
        :value="field(['fallback'])"
        @update:value="(v) => set(['fallback'], v)"
        :options="['none', ...primitiveTypes]"
      />
    </NodeComponentRow>
    <NodeComponentRow name="colour">
      <NodeComponentRowFieldColour
        :value="field(['colour'])"
        @update:value="(v) => set(['colour'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="texture">
      <NodeComponentRowFieldSelect
        :value="field(['texture'])"
        @update:value="(v) => set(['texture'], v)"
        :options="[
          'default',
          ...useAssetsStore().images.map((image) => image.name),
        ]"
      />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
import { primitiveTypes } from "../../lib/primitives";

const props = defineProps<{
  components: ComponentModel[];
  nodes: Tree[];
  icon: string;
}>();

const { field, set } = useMergedFields(() => props.components);

// `type` drives both the value and the fallback's disabled state — read once.
const typeValue = computed(() => field(["type"]));
</script>

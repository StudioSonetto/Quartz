<template>
  <NodeComponent name="layout" :icon="props.icon">
    <NodeComponentRow name="background">
      <NodeComponentRowFieldColour
        v-model:value="props.component.data.background"
      />
    </NodeComponentRow>
    <NodeComponentRow name="spacing">
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.margin"
      />
    </NodeComponentRow>
    <NodeComponentRow name="align">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'start', icon: 'i-carbon-align-vertical-top' },
          { value: 'center', icon: 'i-carbon-align-vertical-center' },
          { value: 'end', icon: 'i-carbon-align-vertical-bottom' },
        ]"
        v-model:value="props.component.data.align"
      />
    </NodeComponentRow>
    <NodeComponentRow name="direction">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'row', icon: 'i-carbon-align-horizontal-left' },
          { value: 'column', icon: 'i-carbon-align-horizontal-center' },
        ]"
        v-model:value="props.component.data.direction"
      />
    </NodeComponentRow>
    <NodeComponentRow name="columns">
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.columns"
      />
    </NodeComponentRow>
    <NodeComponentRow name="rows">
      <NodeComponentRowFieldNumber v-model:value="props.component.data.rows" />
    </NodeComponentRow>
    <NodeComponentRow name="gap">
      <NodeComponentRowFieldNumber v-model:value="props.component.data.gap" />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
const { updateComponent } = useDeckStore();

const props = defineProps<{
  component: ComponentModel;
  icon: string;
}>();

watch(props.component.data, () => {
  updateComponent(props.component);
});
</script>

<template>
  <NodeComponentRow
    name="volume"
    path="volume"
    kind="number"
    v-slot="{ value, update }"
  >
    <NodeComponentRowFieldNumber :value="value" @update:value="update" />
  </NodeComponentRow>
  <NodeComponentRow name="sound" path="muted" v-slot="{ value, update }">
    <NodeComponentRowFieldRadio
      :options="[
        { value: 'false', icon: 'i-carbon-volume-up', label: 'on' },
        { value: 'true', icon: 'i-carbon-volume-mute', label: 'muted' },
      ]"
      :value="String(value)"
      @update:value="(v) => update(v === 'true')"
    />
  </NodeComponentRow>
  <NodeComponentRow name="loop" path="loop" v-slot="{ value, update }">
    <NodeComponentRowFieldRadio
      :options="[
        { value: 'false', icon: 'i-carbon-arrow-right', label: 'once' },
        { value: 'true', icon: 'i-carbon-repeat', label: 'loop' },
      ]"
      :value="String(value)"
      @update:value="(v) => update(v === 'true')"
    />
  </NodeComponentRow>
  <NodeComponentRow name="start (ms)" path="start" v-slot="{ value, update }">
    <NodeComponentRowFieldNumber :value="value" @update:value="update" />
  </NodeComponentRow>
</template>

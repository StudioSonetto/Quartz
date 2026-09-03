<template>
  <AtelierRenderGizmoOutlines />
  <AtelierRenderGizmoHandles />
  <AtelierRenderGizmoPathOverlay />
  <AtelierRenderGizmoMarquee />
  <AtelierRenderGizmoSelection />
  <AtelierRenderGizmoGuides />
  <AtelierRenderGizmoGhost />
</template>

<script setup lang="ts">
const renderRoot = inject(renderRootKey)!;

provide(nodeRectsKey, useNodeRects(renderRoot));
</script>

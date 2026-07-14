<template>
  <TresCanvas>
    <TresPerspectiveCamera
      :args="[45, 1, 0.001, 1000]"
      :position="[0, 0, 0.1]"
    />
    <TresMesh>
      <TresPlaneGeometry :args="[1.2, 1.2, 150, 150]" />
      <TresShaderMaterial
        :vertex-shader="vertexShader"
        :fragment-shader="fragmentShader"
        :uniforms="uniforms"
      ></TresShaderMaterial>
    </TresMesh>
    <TresMesh :position="[0, 0, 0.0]" ref="glassMesh">
      <TresIcosahedronGeometry :args="[0.02, 0]" />
      <TresMeshPhysicalMaterial
        :color="0xffffff"
        :transparent="true"
        :opacity="1"
        :roughness="0.5"
        :metalness="0"
        :transmission="1"
        :thickness="0.5"
        :ior="1.5"
        :reflectivity="0.5"
        :clearcoat="1"
      />
    </TresMesh>
  </TresCanvas>
</template>

<script setup lang="ts">
import vertexShader from "~/assets/shaders/hero/vertex.glsl?raw";
import fragmentShader from "~/assets/shaders/hero/fragment.glsl?raw";

import { Color } from "three";
import type { Mesh } from "three";

const palette = [new Color(0x6b8a95), new Color(0x3a4a5f), new Color(0x1a2338)];

const uniforms = {
  uTime: { value: Math.random() },
  uColor: { value: palette },
  uGrainSize: { value: 500 },
  uGrainIntensity: { value: 0.1 },
};

const { onLoop } = useRenderLoop();

onLoop(({ delta }) => {
  uniforms.uTime.value += 0.01 * delta;
});

const glassMesh = ref<Mesh | null>(null);

onMounted(() => {
  const animate = () => {
    if (glassMesh.value) {
      glassMesh.value.rotation.x += 0.001;
      glassMesh.value.rotation.y += 0.001;
    }

    requestAnimationFrame(animate);
  };

  animate();
});
</script>

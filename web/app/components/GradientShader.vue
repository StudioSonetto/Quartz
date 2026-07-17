<template>
  <TresCanvas @ready="onReady">
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
        :color="0x4a6578"
        :transparent="true"
        :opacity="0.7"
        :roughness="0.1"
        :metalness="0"
        :thickness="0.5"
        :ior="1.5"
        :clearcoat="1"
      />
    </TresMesh>
  </TresCanvas>
</template>

<script setup lang="ts">
import vertexShader from "~/assets/shaders/hero/vertex.glsl?raw";
import fragmentShader from "~/assets/shaders/hero/fragment.glsl?raw";

import { TresCanvas } from "@tresjs/core";

import {
  Color,
  CanvasTexture,
  EquirectangularReflectionMapping,
  PMREMGenerator,
  SRGBColorSpace,
} from "three";
import type { Mesh, Scene, Texture, WebGLRenderer } from "three";

const palette: [Color, Color, Color] = [
  new Color(0x6b8a95),
  new Color(0x3a4a5f),
  new Color(0x1a2338),
];

let envMap: Texture | undefined;

function onReady(context: {
  renderer: { value: WebGLRenderer };
  scene: { value: Scene };
}) {
  const renderer = context.renderer?.value;
  const scene = context.scene?.value;
  if (!renderer || !scene) return;

  const canvas = document.createElement("canvas");

  canvas.width = 512;
  canvas.height = 256;

  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

  gradient.addColorStop(0, palette[0].getStyle());
  gradient.addColorStop(0.5, palette[1].getStyle());
  gradient.addColorStop(1, palette[2].getStyle());

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const highlight = (x: number, y: number, r: number, alpha: number) => {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);

    glow.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  highlight(canvas.width * 0.3, canvas.height * 0.3, 130, 0.9);
  highlight(canvas.width * 0.72, canvas.height * 0.5, 90, 0.55);

  const equirect = new CanvasTexture(canvas);

  equirect.mapping = EquirectangularReflectionMapping;
  equirect.colorSpace = SRGBColorSpace;

  const pmrem = new PMREMGenerator(renderer);

  envMap = pmrem.fromEquirectangular(equirect).texture;

  scene.environment = envMap;

  equirect.dispose();
  pmrem.dispose();
}

onBeforeUnmount(() => envMap?.dispose());

const uniforms = {
  uTime: { value: Math.random() },
  uColor: { value: palette },
  uGrainSize: { value: 500 },
  uGrainIntensity: { value: 0.1 },
};

const { onLoop } = useRenderLoop();

const glassMesh = shallowRef<Mesh>();

onLoop(({ delta }) => {
  uniforms.uTime.value += 0.01 * delta;

  if (glassMesh.value) {
    glassMesh.value.rotation.x += 0.001;
    glassMesh.value.rotation.y += 0.001;
  }
});
</script>

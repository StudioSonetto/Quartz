import type { BufferGeometry, Group } from "three";

import type { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import type { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import { primitiveGeometries } from "./primitives";
import type { CanvasContext } from "../types";

export async function loadModel(
  context: CanvasContext,
  name: string,
  fallback: string,
) {
  const { models } = storeToRefs(useAssetsStore());

  const getFallback = () => {
    if (fallback !== "none") {
      return primitiveGeometries[fallback as keyof typeof primitiveGeometries];
    }

    return;
  };

  if (context.cache.has(name)) {
    const cached = context.cache.get(name);

    if (cached) return cached;
  }

  const model = models.value.find((asset) => asset.name === name);

  if (!model) {
    console.error(`Model ${name} not found in assets`);

    return getFallback();
  }

  const extension = name.split(".").pop()?.toLowerCase();
  const url = model.url.toString();

  const loaders = {
    gltf: {
      loader: context.loaders.gltf,
      resolve: (data: any) => data.scene,
    },
    glb: {
      loader: context.loaders.gltf,
      resolve: (data: any) => data.scene,
    },
    fbx: { loader: context.loaders.fbx, resolve: (data: any) => data },
    obj: { loader: context.loaders.obj, resolve: (data: any) => data },
  };

  async function process(
    loader: FBXLoader | GLTFLoader | OBJLoader,
    extract: (data: any) => BufferGeometry | Group,
  ) {
    return new Promise<BufferGeometry | Group>((resolve, reject) => {
      loader.load(
        url,
        (data: any) => resolve(extract(data)),
        undefined,
        reject,
      );
    });
  }

  try {
    const { loader, resolve } = loaders[extension as keyof typeof loaders];

    const model = await process(loader, resolve);

    context.cache.set(name, model);

    return model;
  } catch (error) {
    console.error(`Error loading model ${name}: ${error}`);

    return getFallback();
  }
}

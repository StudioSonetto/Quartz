import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  TextureLoader,
  WebGLRenderer,
} from "three";

import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import { loadModel } from "./loadModel";
import { getPrimitiveGeometry, primitiveTypes } from "./primitives";

import type { CanvasContext, WebglApi } from "../types";

const contexts = new Map<string, CanvasContext>();

const loadingObjects = new Set<string>();

const isAnimating = ref(false);

function setupCanvas(canvas: string) {
  document
    .getElementById(canvas)
    ?.appendChild(contexts.get(canvas)!.renderer.domElement);

  if (!isAnimating.value) {
    animate();

    isAnimating.value = true;
  }
}

function animate() {
  requestAnimationFrame(animate);

  contexts.forEach((context) => {
    context.scene.children.forEach((child) => {
      child.rotation.x += 0.01;
      child.rotation.y += 0.01;
    });

    context.renderer.render(context.scene, context.camera);
  });
}

function createPrimitiveMesh(type: string, color: string) {
  const geometry = getPrimitiveGeometry(type);

  return new Mesh(geometry, new MeshBasicMaterial({ color }));
}

function createCustomMaterial(textureUrl: string, color: string) {
  const texture = new TextureLoader().load(textureUrl);
  return new MeshPhongMaterial({ map: texture, color });
}

function createModel(
  geometry: BufferGeometry | Group | null,
  color: string,
  textureUrl?: string,
) {
  if (!geometry) {
    return new Mesh(new BoxGeometry(0, 0, 0), new MeshBasicMaterial({ color }));
  }

  if (geometry instanceof BufferGeometry) {
    const material = textureUrl
      ? createCustomMaterial(textureUrl, color)
      : new MeshBasicMaterial({ color });
    return new Mesh(geometry.clone(), material);
  }

  if (geometry instanceof Group) {
    const clonedGroup = geometry.clone();

    clonedGroup.traverse((child) => {
      if (child instanceof Mesh) {
        if (textureUrl) {
          child.material = createCustomMaterial(textureUrl, color);
        } else {
          const material = child.material as
            | MeshBasicMaterial
            | MeshPhongMaterial;

          if (material.color) material.color.set(color);
        }
      }
    });

    return clonedGroup;
  }
}

function updateObjectColour(object: Mesh | Group, color: string) {
  if (object instanceof Mesh) {
    const material = object.material as MeshBasicMaterial | MeshPhongMaterial;

    material.color.set(color);
  } else if (object instanceof Group) {
    object.traverse((child) => {
      if (child instanceof Mesh) {
        const material = child.material as
          | MeshBasicMaterial
          | MeshPhongMaterial;

        material.color.set(color);
      }
    });
  }
}

function getTextureUrl(texture: string | undefined): string | undefined {
  if (!texture || texture === "default") {
    return undefined;
  }

  const selectedTexture = useAssetsStore().images.find(
    (img: { name: string; url: URL }) => img.name === texture,
  );

  if (selectedTexture) {
    return selectedTexture.url.toString();
  }

  return undefined;
}

function textureSrcOf(material: MeshBasicMaterial | MeshPhongMaterial) {
  return material.map?.image?.src || material.map?.source?.data?.src;
}

function materialTextureChanged(
  material: MeshBasicMaterial | MeshPhongMaterial,
  textureUrl: string | undefined,
) {
  const hasMap = !!material.map;

  if (!textureUrl) return hasMap;
  if (!hasMap) return true;

  return textureSrcOf(material) !== textureUrl;
}

function textureChanged(object: Mesh | Group, texture?: string) {
  const textureUrl = getTextureUrl(texture);

  if (object instanceof Mesh) {
    return materialTextureChanged(
      object.material as MeshBasicMaterial | MeshPhongMaterial,
      textureUrl,
    );
  }

  let changed = false;

  object.traverse((child) => {
    if (changed || !(child instanceof Mesh)) return;

    changed = materialTextureChanged(
      child.material as MeshBasicMaterial | MeshPhongMaterial,
      textureUrl,
    );
  });

  return changed;
}

function shouldRecreateObject(
  existing: Mesh | Group,
  model: any,
  isPrimitive: boolean,
) {
  if (existing instanceof Mesh !== isPrimitive) return true;

  if (isPrimitive && existing instanceof Mesh) {
    return (
      existing.geometry.type !== getPrimitiveGeometry(model.type)?.type ||
      textureChanged(existing, model.texture)
    );
  }

  return (
    existing.userData?.modelType !== model.type ||
    textureChanged(existing, model.texture)
  );
}

function applyTransform(object: Mesh | Group, transform: any) {
  object.position.set(transform.position.x, transform.position.y, transform.position.z);
  object.scale.set(transform.scale, transform.scale, transform.scale);
  object.rotation.set(
    (transform.rotation.x * Math.PI) / 180,
    (transform.rotation.y * Math.PI) / 180,
    (transform.rotation.z * Math.PI) / 180,
  );
}

async function instantiateObject(
  context: CanvasContext,
  node: Tree,
  model: any,
  transform: any,
) {
  const isPrimitive = primitiveTypes.includes(model.type);
  const textureUrl = getTextureUrl(model.texture);

  const newObject = isPrimitive
    ? createPrimitiveMesh(model.type, model.colour)
    : await loadModel(context, model.type, model.fallback).then((geometry) =>
        createModel(geometry ?? null, model.colour, textureUrl),
      );

  if (!newObject) {
    return console.error("Failed to create object");
  }

  if (!isPrimitive) {
    newObject.userData.modelType = model.type;
  }

  applyTransform(newObject, transform);

  context.objects.set(node.id, newObject);
  context.scene.add(newObject);
}

function startInstantiate(context: CanvasContext, node: Tree, model: any, transform: any) {
  if (loadingObjects.has(node.id)) return;
  loadingObjects.add(node.id);
  Promise.resolve(instantiateObject(context, node, model, transform))
    .catch((error) => console.error("Failed to instantiate object", error))
    .finally(() => {
      loadingObjects.delete(node.id);
    });
}

function disposeObject(object: Mesh | Group) {
  if (object instanceof Mesh) {
    object.geometry.dispose();

    Array.isArray(object.material)
      ? object.material.forEach((material) => material.dispose())
      : object.material.dispose();
  }
}

function updateObject(object: Mesh | Group, model: any, transform: any) {
  updateObjectColour(object, model.colour);
  applyTransform(object, transform);
}

export function createWebglApi(
  findComponent: (
    node: Tree,
    type: ComponentType,
  ) => ComponentModel | undefined,
): WebglApi {
  function ensureCanvasContext(node: Tree) {
    const transform = findComponent(node, "core.transform")!.data;

    const sceneComponent = findComponent(node, "webgl.scene")!.data;
    const cameraComponent = findComponent(node, "webgl.camera")!.data;

    if (!contexts.has(node.id)) {
      contexts.set(node.id, {
        scene: new Scene(),
        camera: new PerspectiveCamera(
          75,
          transform.size.width / transform.size.height,
          0.1,
          1000,
        ),
        renderer: new WebGLRenderer({ antialias: true }),
        loaders: {
          fbx: new FBXLoader(),
          gltf: new GLTFLoader(),
          obj: new OBJLoader(),
        },
        objects: new Map(),
        cache: new Map(),
      });

      const ambientLight = new AmbientLight(0xffffff, 0.5);
      const directionalLight = new DirectionalLight(0xffffff, 1);

      directionalLight.position.set(5, 5, 5);

      contexts.get(node.id)!.scene.add(ambientLight);
      contexts.get(node.id)!.scene.add(directionalLight);

      watch(
        () => transform.size.width / transform.size.height,
        (newAspectRatio) => {
          const context = contexts.get(node.id);

          if (!context) return;

          context.camera.aspect = newAspectRatio;
          context.camera.updateProjectionMatrix();

          context.renderer.setSize(transform.size.width, transform.size.height);
        },
      );
    }

    const context = contexts.get(node.id);

    context?.renderer.setSize(transform.size.width, transform.size.height);
    context?.renderer.setClearColor(sceneComponent.background);

    context?.camera.position.set(
      cameraComponent.x,
      cameraComponent.y,
      cameraComponent.z,
    );
  }

  function syncObject(context: CanvasContext, node: Tree) {
    const model = findComponent(node, "webgl.model")!.data;
    const transform = findComponent(node, "webgl.transform")!.data;

    const isPrimitive = primitiveTypes.includes(model.type);
    const existingObject = context.objects.get(node.id);

    if (!existingObject) {
      startInstantiate(context, node, model, transform);
      return;
    }

    updateObject(existingObject, model, transform);

    const needsRecreation = shouldRecreateObject(existingObject, model, isPrimitive);

    if (needsRecreation) {
      disposeObject(existingObject);
      context.scene.remove(existingObject);
      context.objects.delete(node.id);
      startInstantiate(context, node, model, transform);
    }
  }

  return {
    ensureCanvasContext,
    getCanvasContext: (id: string) => contexts.get(id),
    syncObject,
    setupCanvas,
  };
}

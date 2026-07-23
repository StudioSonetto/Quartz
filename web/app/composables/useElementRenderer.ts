// TODO: Refactor this whole mess.

// ! = Required component; ? = Optional component.

import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  DirectionalLight,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  TetrahedronGeometry,
  TextureLoader,
  WebGLRenderer,
} from "three";

import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import { getNodeType, getModuleApi } from "~/modules/registry";
import { provideWebglApi } from "~/modules/webgl";
import type { CanvasContext } from "~/modules/webgl/types";

const contexts = new Map<string, CanvasContext>();

// Node ids whose object is currently being (re)instantiated. Guards against the
// async `instantiateObject` being fired repeatedly across render evaluations
// before a load resolves, which would add duplicate meshes to the scene.
const loadingObjects = new Set<string>();

const isAnimating = ref(false);

export const primitiveGeometries = {
  box: new BoxGeometry(1, 1, 1),
  icosahedron: new IcosahedronGeometry(),
  triangle: new TetrahedronGeometry(),
  sphere: new SphereGeometry(0.5, 32, 32),
};

export const primitiveTypes = Object.keys(primitiveGeometries);

function getPrimitiveGeometry(type: string) {
  return primitiveGeometries[type as keyof typeof primitiveGeometries];
}

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

function updateMaterialColor(material: any, color: string) {
  if (material.color) {
    material.color.set(color);
  }
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
          updateMaterialColor(child.material, color);
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

function getCurrentTextureSrc(
  material: MeshBasicMaterial | MeshPhongMaterial,
): string | undefined {
  return material.map?.image?.src || material.map?.source?.data?.src;
}

function hasTextureChanged(
  currentSrc: string | undefined,
  newTextureUrl: string | undefined,
  hasMap: boolean,
): boolean {
  if (!newTextureUrl && hasMap) {
    return true;
  }

  if (newTextureUrl && !hasMap) {
    return true;
  }

  if (newTextureUrl && hasMap && currentSrc !== newTextureUrl) {
    return true;
  }

  return false;
}

function checkTextureChanged(object: Mesh | Group, texture?: string): boolean {
  const textureUrl = getTextureUrl(texture);

  if (object instanceof Mesh) {
    const material = object.material as MeshBasicMaterial | MeshPhongMaterial;
    const currentTextureSrc = getCurrentTextureSrc(material);

    return hasTextureChanged(currentTextureSrc, textureUrl, !!material.map);
  }

  if (object instanceof Group) {
    let textureChanged = false;

    object.traverse((child) => {
      if (child instanceof Mesh && !textureChanged) {
        const material = child.material as
          | MeshBasicMaterial
          | MeshPhongMaterial;
        const currentTextureSrc = getCurrentTextureSrc(material);

        if (hasTextureChanged(currentTextureSrc, textureUrl, !!material.map)) {
          textureChanged = true;
          return;
        }
      }
    });

    return textureChanged;
  }

  return false;
}

interface ObjectUserData {
  modelType?: string;
}

function setObjectMetadata(object: Mesh | Group, modelType: string): void {
  if (!object.userData) {
    object.userData = {};
  }

  (object.userData as ObjectUserData).modelType = modelType;
}

function getObjectModelType(object: Mesh | Group): string | undefined {
  return (object.userData as ObjectUserData)?.modelType;
}

async function instantiateObject(
  context: CanvasContext,
  node: Tree,
  model: any,
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
    setObjectMetadata(newObject, model.type);
  }

  newObject.position.set(model.x, model.y, model.z);
  newObject.scale.set(model.scale, model.scale, model.scale);

  context.objects.set(node.id, newObject);
  context.scene.add(newObject);
}

function startInstantiate(context: CanvasContext, node: Tree, model: any) {
  if (loadingObjects.has(node.id)) return;

  loadingObjects.add(node.id);

  Promise.resolve(instantiateObject(context, node, model))
    .catch((error) => console.error("Failed to instantiate object", error))
    .finally(() => {
      loadingObjects.delete(node.id);
    });
}

function hasTypeConflict(
  existingObject: Mesh | Group,
  isPrimitive: boolean,
): boolean {
  return (
    (existingObject instanceof Mesh && !isPrimitive) ||
    (existingObject instanceof Group && isPrimitive)
  );
}

function hasPrimitiveGeometryChanged(
  existingObject: Mesh | Group,
  model: any,
  isPrimitive: boolean,
): boolean {
  return (
    existingObject instanceof Mesh &&
    isPrimitive &&
    existingObject.geometry.type !== getPrimitiveGeometry(model.type)?.type
  );
}

function hasModelTypeChanged(
  existingObject: Mesh | Group,
  model: any,
  isPrimitive: boolean,
): boolean {
  return !isPrimitive && getObjectModelType(existingObject) !== model.type;
}

function shouldRecreateObject(
  existingObject: Mesh | Group,
  model: any,
  isPrimitive: boolean,
): boolean {
  if (hasTypeConflict(existingObject, isPrimitive)) {
    return true;
  }

  if (hasPrimitiveGeometryChanged(existingObject, model, isPrimitive)) {
    return true;
  }

  if (hasModelTypeChanged(existingObject, model, isPrimitive)) {
    return true;
  }

  return checkTextureChanged(existingObject, model.texture);
}

function disposeObject(object: Mesh | Group) {
  if (object instanceof Mesh) {
    object.geometry.dispose();

    Array.isArray(object.material)
      ? object.material.forEach((material) => material.dispose())
      : object.material.dispose();
  }
}

function updateObject(object: Mesh | Group, model: any) {
  updateObjectColour(object, model.colour);
  object.position.set(model.x, model.y, model.z);
  object.scale.set(model.scale, model.scale, model.scale);
}

export function useElementRenderer() {
  const { currentComponents } = storeToRefs(useDeckStore());

  function findComponent(node: Tree, type: ComponentType) {
    return currentComponents.value?.find(
      (component) => component.type === type && component.node === node.id,
    );
  }

  const renderEl = ref<HTMLDivElement>(
    document.querySelector(".render") as HTMLDivElement,
  );

  onMounted(() => {
    renderEl.value = document.querySelector(".render") as HTMLDivElement;
  });

  const { width, height } = useElementSize(renderEl);

  const scale = computed(() => {
    return Math.min(width.value / 1920, height.value / 1080);
  });

  function ensureCanvasContext(node: Tree) {
    const transform = findComponent(node, "core.transform")!.data;

    const sceneComponent = findComponent(node, "webgl.scene")!.data;
    const cameraComponent = findComponent(node, "webgl.camera")!.data;

    if (!contexts.has(node.id)) {
      contexts.set(node.id, {
        scene: new Scene(),
        camera: new PerspectiveCamera(
          75,
          transform.width / transform.height,
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
        () => transform.width / transform.height,
        (newAspectRatio) => {
          const context = contexts.get(node.id);

          if (!context) return;

          context.camera.aspect = newAspectRatio;
          context.camera.updateProjectionMatrix();

          context.renderer.setSize(transform.width, transform.height);
        },
      );
    }

    const context = contexts.get(node.id);

    context?.renderer.setSize(transform.width, transform.height);
    context?.renderer.setClearColor(sceneComponent.background);

    context?.camera.position.set(
      cameraComponent.x,
      cameraComponent.y,
      cameraComponent.z,
    );
  }

  function syncObject(context: CanvasContext, node: Tree) {
    const model = findComponent(node, "webgl.model")!.data;

    const isPrimitive = primitiveTypes.includes(model.type);
    const existingObject = context.objects.get(node.id);

    if (!existingObject) {
      startInstantiate(context, node, model);

      return;
    }

    updateObject(existingObject, model);

    const needsRecreation = shouldRecreateObject(
      existingObject,
      model,
      isPrimitive,
    );

    if (needsRecreation) {
      disposeObject(existingObject);

      context.scene.remove(existingObject);

      // Stop tracking so the next render re-enters the guarded initial path
      // instead of recreating again while the replacement loads.
      context.objects.delete(node.id);

      startInstantiate(context, node, model);
    }
  }

  function resolveRender(node: Tree) {
    const def = getNodeType(node.type);

    if (!def) return undefined;

    const ctx: RenderContext = {
      findComponent,
      scale: scale.value,
      module: <T>(moduleId: string) => {
        const api = getModuleApi<T>(moduleId);

        if (!api) throw new Error(`Module "${moduleId}" is not registered`);

        return api;
      },
    };

    return { element: def.renderer.element, ...def.renderer.render(node, ctx) };
  }

  provideWebglApi({
    ensureCanvasContext,
    getCanvasContext: (id) => contexts.get(id),
    syncObject,
  });

  return {
    resolveRender,
    setupCanvas,
  };
}

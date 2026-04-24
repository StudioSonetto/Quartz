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

const contexts = new Map<string, CanvasContext>();

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
  mesh: any,
) {
  const isPrimitive = primitiveTypes.includes(mesh.type);
  const textureUrl = getTextureUrl(mesh.texture);

  const newObject = isPrimitive
    ? createPrimitiveMesh(mesh.type, mesh.colour)
    : await loadModel(context, mesh.type, mesh.fallback).then((geometry) =>
        createModel(geometry ?? null, mesh.colour, textureUrl),
      );

  if (!newObject) {
    return console.error("Failed to create object");
  }

  if (!isPrimitive) {
    setObjectMetadata(newObject, mesh.type);
  }

  newObject.position.set(mesh.x, mesh.y, mesh.z);
  newObject.scale.set(mesh.scale, mesh.scale, mesh.scale);

  context.objects.set(node.id, newObject);
  context.scene.add(newObject);
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
  mesh: any,
  isPrimitive: boolean,
): boolean {
  return (
    existingObject instanceof Mesh &&
    isPrimitive &&
    existingObject.geometry.type.toLowerCase() !== mesh.type.toLowerCase()
  );
}

function hasModelTypeChanged(
  existingObject: Mesh | Group,
  mesh: any,
  isPrimitive: boolean,
): boolean {
  return !isPrimitive && getObjectModelType(existingObject) !== mesh.type;
}

function shouldRecreateObject(
  existingObject: Mesh | Group,
  mesh: any,
  isPrimitive: boolean,
): boolean {
  if (hasTypeConflict(existingObject, isPrimitive)) {
    return true;
  }

  if (hasPrimitiveGeometryChanged(existingObject, mesh, isPrimitive)) {
    return true;
  }

  if (hasModelTypeChanged(existingObject, mesh, isPrimitive)) {
    return true;
  }

  return checkTextureChanged(existingObject, mesh.texture);
}

function disposeObject(object: Mesh | Group) {
  if (object instanceof Mesh) {
    object.geometry.dispose();

    Array.isArray(object.material)
      ? object.material.forEach((material) => material.dispose())
      : object.material.dispose();
  }
}

function updateObject(object: Mesh | Group, mesh: any) {
  updateObjectColour(object, mesh.colour);
  object.position.set(mesh.x, mesh.y, mesh.z);
  object.scale.set(mesh.scale, mesh.scale, mesh.scale);
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

  const renderer: Record<NodeType, NodeRenderer> = {
    group: {
      element: "div",
      render: (node: Tree) => {
        const layout = findComponent(node, "layout")?.data || {};

        return {
          style: {
            margin: `${layout.margin}px`,
            display: "flex",
            alignItems: layout.align,
            justifyContent: layout.justify,
          },
        };
      },
    },
    text: {
      element: "p",
      render: (node: Tree) => {
        const typography = findComponent(node, "typography")!.data;
        const transform = findComponent(node, "transform")!.data;

        const xPercent = (transform.position.x / 1920) * 100;
        const yPercent = (transform.position.y / 1080) * 100;

        const textDecorations: string[] = [];

        let fontStyle = "normal";

        typography.style.forEach((style: string) => {
          switch (style) {
            case "italic":
              fontStyle = "italic";

              break;
            case "underline":
              textDecorations.push("underline");

              break;
            case "strikethrough":
              textDecorations.push("line-through");

              break;
          }
        });

        return {
          content: typography.content,
          style: {
            color: typography.colour,
            fontFamily: typography.font,
            fontSize: `${typography.size}px`,
            fontWeight: typography.weight,
            fontStyle,
            textDecoration:
              textDecorations.length > 0 ? textDecorations.join(" ") : "none",
            left: `${xPercent}%`,
            textAlign: typography.alignment,
            top: `${yPercent}%`,
            transform: `scale(${transform.scale * scale.value})`,
            zIndex: transform.position.z,
            whiteSpace: "pre-line",
          },
        };
      },
    },
    webgl_canvas: {
      element: "div",
      render: (node: Tree) => {
        const transform = findComponent(node, "transform")!.data;

        const sceneComponent = findComponent(node, "scene")!.data;
        const cameraComponent = findComponent(node, "camera")!.data;

        const xPercent = (transform.position.x / 1920) * 100;
        const yPercent = (transform.position.y / 1080) * 100;

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
        }

        const context = contexts.get(node.id);

        context?.renderer.setSize(transform.width, transform.height);
        context?.renderer.setClearColor(sceneComponent.background);

        context?.camera.position.set(
          cameraComponent.x,
          cameraComponent.y,
          cameraComponent.z,
        );

        return {
          style: {
            top: `${yPercent}%`,
            left: `${xPercent}%`,
            zIndex: transform.z,
            width: `${transform.width}px`,
            height: `${transform.height}px`,
            transform: `scale(${transform.scale * scale.value})`,
          },
        };
      },
    },
    webgl_object: {
      element: "",
      render: (node: Tree) => {
        const context = contexts.get(node.parent!.id);

        if (!context) return {};

        const mesh = findComponent(node, "mesh")!.data;

        const isPrimitive = primitiveTypes.includes(mesh.type);
        const existingObject = context.objects.get(node.id);

        if (!existingObject) {
          instantiateObject(context, node, mesh);

          return {};
        }

        updateObject(existingObject, mesh);

        const needsRecreation = shouldRecreateObject(
          existingObject,
          mesh,
          isPrimitive,
        );

        if (needsRecreation) {
          disposeObject(existingObject);

          context.scene.remove(existingObject);

          instantiateObject(context, node, mesh);

          return {};
        }

        return {};
      },
    },
  };

  return {
    renderer,
    setupCanvas,
  };
}

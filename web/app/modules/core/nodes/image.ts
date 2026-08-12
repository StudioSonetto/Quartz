import { applyImageAsset } from "../components/image/apply";

const loadingStyle = {
  backgroundColor: "rgba(127, 127, 127, 0.08)",
  border: "1px dashed rgba(127, 127, 127, 0.5)",
};

export default {
  type: "core.image",
  label: "Image",
  icon: "i-carbon-image",
  accepts: [],
  parents: ["core.group"],
  sizing: "fixed",
  defaultComponents: [
    "core.base",
    { type: "core.transform", data: { size: { width: 480, height: 270 } } },
    "core.image",
  ],
  onCreate: (nodeId) => {
    const first = useAssetsStore().images[0]?.name;

    if (first) applyImageAsset([nodeId], first);
  },
  asset: {
    kind: "image",
    apply: (nodeId, name) => applyImageAsset([nodeId], name),
  },
  renderer: {
    element: "div",
    render: (node, ctx) => {
      const image = ctx.data(node, "core.image");
      const transform = ctx.data(node, "core.transform");

      return {
        style: {
          ...boxStyle(transform, ctx.scale),
          width: `${transform.size.width}px`,
          height: `${transform.size.height}px`,
          borderRadius: `${image.borderRadius}px`,
          opacity: image.opacity,
          ...(image.src
            ? backgroundStyle(
                { type: "image", value: image.src, fit: image.fit },
                ctx.assetUrl,
              )
            : loadingStyle),
        },
      };
    },
  },
} satisfies NodeTypeDef;

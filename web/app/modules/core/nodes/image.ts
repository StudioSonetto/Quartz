import { markRaw } from "vue";
import Media from "../components/image/Media.vue";
import { applyImageAsset } from "../components/image/apply";

const loadingStyle = {
  backgroundColor: "rgba(127, 127, 127, 0.08)",
  border: "1px dashed rgba(127, 127, 127, 0.5)",
};

export default {
  type: "core.image",
  label: "Media",
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
    const first = useAssetsStore().media[0]?.name;

    if (first) applyImageAsset([nodeId], first);
  },
  asset: {
    kind: ["image", "video"],
    apply: (nodeId, name) => applyImageAsset([nodeId], name),
  },
  renderer: {
    element: "div",
    render: (node, ctx) => {
      const image = ctx.data(node, "core.image");
      const transform = ctx.data(node, "core.transform");
      const url = image.src ? ctx.assetUrl(image.src) : undefined;

      return {
        style: {
          ...boxStyle(transform, ctx.scale),
          width: `${transform.size.width}px`,
          height: `${transform.size.height}px`,
          borderRadius: `${image.borderRadius}px`,
          opacity: image.opacity,
          overflow: "hidden",
          ...(url ? {} : loadingStyle),
        },
        inner: url
          ? {
              component: markRaw(Media),
              props: {
                url,
                video: assetKind(image.src) === "video",
                fit: image.fit,
                timing: image,
                presenting: ctx.presenting,
              },
            }
          : undefined,
      };
    },
  },
} satisfies NodeTypeDef;

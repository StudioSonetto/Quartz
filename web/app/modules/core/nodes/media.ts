import { markRaw } from "vue";
import Media from "../components/media/Media.vue";
import { applyMediaAsset } from "../components/media/apply";

const loadingStyle = {
  backgroundColor: "rgba(127, 127, 127, 0.08)",
  border: "1px dashed rgba(127, 127, 127, 0.5)",
};

export default {
  type: "core.media",
  label: "Media",
  icon: "i-carbon-media-library",
  accepts: [],
  parents: ["core.group"],
  sizing: "fixed",
  defaultComponents: [
    "core.base",
    { type: "core.transform", data: { size: { width: 480, height: 270 } } },
    "core.media",
  ],
  onCreate: (nodeId) => {
    const first = useAssetsStore().media[0]?.name;

    if (first) applyMediaAsset([nodeId], first);
  },
  asset: {
    kind: ["image", "video"],
    apply: (nodeId, name) => applyMediaAsset([nodeId], name),
  },
  renderer: {
    element: "div",
    render: (node, ctx) => {
      const media = ctx.data(node, "core.media");
      const transform = ctx.data(node, "core.transform");
      const url = media.src ? ctx.assetUrl(media.src) : undefined;

      return {
        style: {
          ...boxStyle(transform, ctx.scale),
          width: `${transform.size.width}px`,
          height: `${transform.size.height}px`,
          borderRadius: `${media.borderRadius}px`,
          opacity: media.opacity,
          overflow: "hidden",
          ...(url ? {} : loadingStyle),
        },
        inner: url
          ? {
              component: markRaw(Media),
              props: {
                url,
                video: assetKind(media.src) === "video",
                fit: media.fit,
                timing: media,
                presenting: ctx.presenting,
                anim: ctx.optional(node, "core.animation"),
                node: node.id,
              },
            }
          : undefined,
      };
    },
  },
} satisfies NodeTypeDef;

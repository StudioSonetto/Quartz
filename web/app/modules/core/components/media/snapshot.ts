// Safari refuses canvases over 4096².
const MAX_SIDE = 4096;

export function mediaSnapshotClone(node: string, doc: Document) {
  const media = document
    .getElementById(node)
    ?.querySelector<HTMLImageElement | HTMLVideoElement>(".element-media");
  const box = doc.getElementById(node);

  if (!media || !box) return;

  const [sw, sh] =
    media instanceof HTMLVideoElement
      ? [media.videoWidth, media.videoHeight]
      : [media.naturalWidth, media.naturalHeight];

  if (!sw || !sh) return;

  const bw = parseFloat(box.style.width);
  const bh = parseFloat(box.style.height);
  const k = Math.min(Math.max(sw / bw, sh / bh), MAX_SIDE / Math.max(bw, bh));

  const canvas = doc.createElement("canvas");
  const w = (canvas.width = Math.ceil(bw * k));
  const h = (canvas.height = Math.ceil(bh * k));

  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%";

  const ctx = canvas.getContext("2d")!;
  const fit = media.style.objectFit;
  const s = (fit === "contain" ? Math.min : Math.max)(w / sw, h / sh);
  const [dw, dh] =
    fit === "contain" || fit === "cover" ? [sw * s, sh * s] : [w, h];

  ctx.roundRect(0, 0, w, h, (parseFloat(box.style.borderRadius) || 0) * k);
  ctx.clip();
  ctx.drawImage(media, (w - dw) / 2, (h - dh) / 2, dw, dh);

  box.style.borderRadius = "0px";
  box.replaceChildren(canvas);
}

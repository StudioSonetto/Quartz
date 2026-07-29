// A drag driven by window-level pointermove/pointerup (not bound to a fixed
// element, as Marquee.vue and Selection.vue both are) leaves a synthetic
// `click` behind. That click resolves to whatever is under the cursor at
// mouseup — often the canvas `.render`, whose `@click` clears the selection.
// Call `arm()` when such a drag ends to swallow exactly that one click.
export function useSuppressClickAfterDrag() {
  let armed = false;

  // Any real press starts a new interaction, so drop a stale flag — this way
  // it can only ever swallow the synthetic post-drag click, which has no
  // pointerdown of its own and so leaves the flag armed until the click.
  useEventListener(window, "pointerdown", () => {
    armed = false;
  });

  // Capture phase runs before bubble-phase handlers like `.render`'s @click,
  // so stopping propagation here pre-empts the clear.
  useEventListener(
    window,
    "click",
    (e: MouseEvent) => {
      if (!armed) return;

      armed = false;
      e.stopPropagation();
    },
    { capture: true },
  );

  function arm() {
    armed = true;
  }

  return { arm };
}

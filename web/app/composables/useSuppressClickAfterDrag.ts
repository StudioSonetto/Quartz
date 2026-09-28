// A window-level drag leaves a click on whatever is under the cursor, often
// `.render`, whose @click clears the selection. `arm()` swallows that click.
export function useSuppressClickAfterDrag() {
  let armed = false;

  // The post-drag click has no press of its own, so a press means it's stale.
  useEventListener(window, "pointerdown", () => {
    armed = false;
  });

  // Capture phase, so it runs before `.render`'s @click.
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

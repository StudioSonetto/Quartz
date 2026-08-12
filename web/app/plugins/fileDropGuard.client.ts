export default defineNuxtPlugin(() => {
  function guard(event: DragEvent) {
    if (event.defaultPrevented) return;

    if (!hasFiles(event)) return;

    event.preventDefault();

    if (event.type === "dragover" && event.dataTransfer)
      event.dataTransfer.dropEffect = "none";
  }

  window.addEventListener("dragover", guard);
  window.addEventListener("drop", guard);
});

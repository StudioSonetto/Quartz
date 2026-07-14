export function useContextMenu() {
  const open = (event: MouseEvent, menuItems: ContextMenuItem[]) => {
    window.dispatchEvent(
      new CustomEvent("openContextMenu", {
        detail: { event, menuItems },
      })
    );
  };

  return { open };
}

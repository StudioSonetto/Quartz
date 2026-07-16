// @unocss-include

export const useAtelierStore = defineStore("atelier", () => {
  const tabs = ref([
    { name: "Editor", icon: "i-carbon-legend" },
    { name: "Assets", icon: "i-carbon-folders" },
    { name: "Exports", icon: "i-carbon-export" },
  ]);
  const activeTab = ref<number>(0);

  const canvasSize = ref<{ width: number; height: number }>({
    width: 1920,
    height: 1080,
  });

  const isDragging = ref<boolean>(false);

  const snapThreshold = ref<number>(20);

  const paletteOpen = ref<boolean>(false);

  const focus = ref<"canvas" | "hierarchy" | "inspector" | null>(null);

  const recentCommands = ref<string[]>([]);

  function setActiveTab(index: number) {
    activeTab.value = index;
  }

  function setIsDragging(value: boolean) {
    isDragging.value = value;
  }

  function closePalette() {
    paletteOpen.value = false;
  }

  function togglePalette() {
    paletteOpen.value = !paletteOpen.value;
  }

  function setFocus(f: "canvas" | "hierarchy" | "inspector" | null) {
    focus.value = f;
  }

  function pushRecentCommand(id: string) {
    recentCommands.value = [
      id,
      ...recentCommands.value.filter((c) => c !== id),
    ].slice(0, 5);
  }

  return {
    tabs,
    activeTab,
    canvasSize,
    isDragging,
    snapThreshold,
    paletteOpen,
    focus,
    recentCommands,
    setActiveTab,
    setIsDragging,
    closePalette,
    togglePalette,
    setFocus,
    pushRecentCommand,
  };
});

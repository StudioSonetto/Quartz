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

  function setActiveTab(index: number) {
    activeTab.value = index;
  }

  function setIsDragging(value: boolean) {
    isDragging.value = value;
  }

  return {
    tabs,
    activeTab,
    canvasSize,
    isDragging,
    snapThreshold,
    setActiveTab,
    setIsDragging,
  };
});

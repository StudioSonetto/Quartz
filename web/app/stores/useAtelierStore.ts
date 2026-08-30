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

  const highlightedNodeId = ref<string | null>(null);
  const hoveredNodeId = ref<string | null>(null);
  const collapsedNodeIds = ref<Set<string>>(new Set());

  const openComponentKeys = ref<Set<string>>(new Set());

  const focus = ref<AtelierFocus>(null);

  const recentCommands = ref<string[]>([]);

  const activeTool = ref<"select" | "pen" | "point">("select");
  const editingShapeId = ref<string | null>(null);
  const selectedPoints = ref<Set<number>>(new Set());

  function setActiveTool(tool: "select" | "pen" | "point") {
    activeTool.value = tool;
    selectedPoints.value = new Set();
  }

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

  function setFocus(f: AtelierFocus) {
    focus.value = f;
  }

  function setHighlighted(id: string | null) {
    highlightedNodeId.value = id;
  }

  function setHovered(id: string | null) {
    hoveredNodeId.value = id;
  }

  function isCollapsed(id: string) {
    return collapsedNodeIds.value.has(id);
  }

  function setCollapsed(id: string, value: boolean) {
    if (value) collapsedNodeIds.value.add(id);
    else collapsedNodeIds.value.delete(id);
  }

  function toggleCollapsed(id: string) {
    setCollapsed(id, !collapsedNodeIds.value.has(id));
  }

  function isComponentOpen(key: string) {
    return openComponentKeys.value.has(key);
  }

  function toggleComponentOpen(key: string) {
    const next = new Set(openComponentKeys.value);

    if (next.has(key)) next.delete(key);
    else next.add(key);

    openComponentKeys.value = next;
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
    highlightedNodeId,
    hoveredNodeId,
    collapsedNodeIds,
    openComponentKeys,
    focus,
    recentCommands,
    activeTool,
    editingShapeId,
    selectedPoints,
    setActiveTool,
    setActiveTab,
    setIsDragging,
    closePalette,
    togglePalette,
    setHighlighted,
    setHovered,
    isCollapsed,
    setCollapsed,
    toggleCollapsed,
    isComponentOpen,
    toggleComponentOpen,
    setFocus,
    pushRecentCommand,
  };
});

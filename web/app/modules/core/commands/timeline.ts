const fit: Command = {
  id: "core.timeline.fit",
  keys: ["home"],
  title: "Fit Timeline",
  category: "Timeline",
  icon: "i-carbon-fit-to-width",
  when: () => useDopesheetRows().value.length > 0,
  undoable: false,
  run: () => usePlayhead().fit(),
};

export default [fit];

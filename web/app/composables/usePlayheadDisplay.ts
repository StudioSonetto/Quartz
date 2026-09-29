export function usePlayheadDisplay(rows: () => DopesheetRow[]) {
  const { time, end, endless, beyond, nodeTime, seek } = usePlayhead();

  const loop = computed(() => {
    const [first, ...rest] = rows();
    const range = first?.loop ? keyRange(first) : undefined;

    if (!range) return undefined;

    const shared = rest.every((row) => {
      const other = keyRange(row);

      return (
        row.loop === first!.loop &&
        other?.first === range.first &&
        other?.last === range.last
      );
    });

    return shared ? first : undefined;
  });

  const overrun = computed(
    () => endless.value && !loop.value && time.value > end.value,
  );

  const shownTime = computed(() =>
    overrun.value ? end.value : nodeTime(loop.value),
  );

  // Past the timeline, pausing keeps the real time so looping media holds its frame.
  function pauseHere() {
    seek(roundTime(beyond.value ? time.value : shownTime.value));
  }

  return { shownTime, overrun, pauseHere };
}

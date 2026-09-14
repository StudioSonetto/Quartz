export function usePlayheadDisplay(rows: () => DopesheetRow[]) {
  const { time, playing, end, endless, nodeTime, seek } = usePlayhead();

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
    () =>
      endless.value && playing.value && !loop.value && time.value > end.value,
  );

  const shownTime = computed(() =>
    overrun.value ? end.value : nodeTime(loop.value),
  );

  function pauseHere() {
    seek(roundTime(shownTime.value));
  }

  return { shownTime, overrun, pauseHere };
}

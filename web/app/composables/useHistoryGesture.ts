export function useHistoryGesture(label: string) {
  const history = useHistoryStore();

  let close: (() => void) | null = null;

  onScopeDispose(() => close?.());

  return {
    start: () => (close = history.begin(label)),
    stop: () => close?.(),
  };
}

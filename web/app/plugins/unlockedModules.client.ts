export default defineNuxtPlugin({
  dependsOn: ["quartz-modules", "supabase-session"],
  setup() {
    const auth = useAuthStore();

    watch(
      () => auth.user?.id,
      async (id, _, onCleanup) => {
        if (!id) return;

        let stale = false;

        onCleanup(() => (stale = true));

        const res = await $fetch("/api/billing").catch(() => null);

        if (res && !stale) setUnlockedModules(res.unlocked);
      },
      { immediate: true },
    );
  },
});

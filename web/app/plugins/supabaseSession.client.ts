export default defineNuxtPlugin({
  name: "supabase-session",
  dependsOn: ["supabase"],
  async setup() {
    const session = useSupabaseSession();

    if (session.value) return;

    const { data } = await useSupabaseClient().auth.getSession();

    session.value = data.session;

    useSupabaseUser().value = data.session?.user ?? null;
  },
});

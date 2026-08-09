import type { User } from "@supabase/supabase-js";

export const useAuthStore = defineStore("auth", () => {
  const client = useSupabaseClient();
  const route = useRoute();
  const redirect = useSupabaseCookieRedirect();

  const user = ref<User | null>(useSupabaseUser().value);
  const isSignedIn = computed(() => !!user.value);

  client.auth.onAuthStateChange((event, session) => {
    user.value = session?.user || null;

    if (event === "SIGNED_IN" && route.path.startsWith("/auth")) {
      navigateTo(redirect.pluck() || "/atelier", { replace: true });
    } else if (event === "SIGNED_OUT") {
      navigateTo("/auth", { replace: true });
    }
  });

  async function register(
    email: string,
    password: string,
    options: { username: string },
  ) {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: options.username,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    return data;
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return data;
  }

  async function signOut() {
    await client.auth.signOut();

    user.value = null;
  }

  return { user, isSignedIn, register, signIn, signOut };
});

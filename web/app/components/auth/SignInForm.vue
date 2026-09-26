<template>
  <form @submit="onSubmit">
    <h2 class="text-center ui-text-6">Welcome back!</h2>
    <div class="whitespace"></div>
    <div class="flex gap-3">
      <UIButton
        v-for="{ provider, label, icon, disabled } in providers"
        :key="provider"
        :disabled="disabled"
        class="flex-1 px-3"
        @click="onProvider(provider)"
      >
        <div :class="icon" />
        {{ label }}
      </UIButton>
    </div>
    <p class="text-center ui-text-3 text-light-200/60 my-9">
      or sign in with email
    </p>
    <div class="flex flex-col gap-4">
      <FormInput name="email" type="email" placeholder="Email" />
      <FormInput name="password" type="password" placeholder="Password" />
    </div>
    <div class="whitespace"></div>
    <UIButton type="submit" :disabled="!meta.valid">
      Sign In
      <div class="i-carbon-login" />
    </UIButton>
    <div class="whitespace"></div>
    <p v-if="error" class="text-center text-red-500">ERROR: {{ error }}</p>
  </form>
</template>

<script setup lang="ts">
import type { Provider } from "@supabase/supabase-js";
import zod from "zod";

const loginSchema = toTypedSchema(
  zod.object({
    email: zod.string().email(),
    password: zod
      .string()
      .trim()
      .min(8, { message: "Password must be at least 8 characters long" }),
  }),
);

const { handleSubmit, meta } = useForm({
  validationSchema: loginSchema,
});

const error = ref("");

const onSubmit = handleSubmit(async (values) => {
  try {
    error.value = "";

    await useAuthStore().signIn(values.email, values.password);
  } catch (err) {
    error.value = (err as Error).message;
  }
});

const providers = [
  {
    provider: "discord",
    label: "Discord",
    icon: "i-carbon-logo-discord",
    disabled: false,
  },
  {
    provider: "google",
    label: "Google",
    icon: "i-carbon-logo-google",
    disabled: true,
  },
  {
    provider: "github",
    label: "GitHub",
    icon: "i-carbon-logo-github",
    disabled: true,
  },
] as const;

async function onProvider(provider: Provider) {
  try {
    error.value = "";

    await useAuthStore().signInWithProvider(provider);
  } catch (err) {
    error.value = (err as Error).message;
  }
}
</script>

<template>
  <form @submit="onSubmit">
    <h2 class="text-center text-3xl">Welcome back!</h2>
    <div class="whitespace"></div>
    <div class="flex flex-col gap-4">
      <FormInput name="email" type="email" placeholder="Email" />
      <FormInput name="password" type="password" placeholder="Password" />
    </div>
    <div class="whitespace"></div>
    <UIButton type="submit" size="lg" :disabled="!meta.valid">
      Sign In
      <div class="i-carbon-login" />
    </UIButton>
    <div class="whitespace"></div>
    <p v-if="error" class="text-center text-red-500">ERROR: {{ error }}</p>
  </form>
</template>

<script setup lang="ts">
import zod from "zod";

const loginSchema = toTypedSchema(
  zod.object({
    email: zod.string().email(),
    password: zod
      .string()
      .trim()
      .min(8, { message: "Password must be at least 8 characters long" }),
  })
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
</script>

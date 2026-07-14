<template>
  <form v-if="!hasRegistered" @submit="onSubmit">
    <h2 class="text-center text-3xl">New here?</h2>
    <div class="whitespace"></div>
    <div class="flex flex-col gap-4">
      <FormInput
        name="username"
        type="text"
        placeholder="Username"
        :maxlength="20"
      />
      <FormInput name="email" type="email" placeholder="Email" />
      <FormInput name="password" type="password" placeholder="Password" />
      <FormInput
        name="confirmPassword"
        type="password"
        placeholder="Confirm password"
      />
    </div>
    <div class="whitespace"></div>
    <UIButton type="submit" size="lg" :disabled="!meta.valid">
      Register
      <div class="i-carbon-login" />
    </UIButton>
    <div class="whitespace"></div>
    <p v-if="error" class="text-center text-red-500">ERROR: {{ error }}</p>
  </form>
  <div v-else class="text-center text-5">
    <p>A verification email has been sent to your email address.</p>
  </div>
</template>

<script setup lang="ts">
import zod from "zod";

const baseSchema = zod.object({
  username: zod.string().trim().min(1, { message: "Required" }),
  email: zod.string().email(),
});

const passwordSchema = zod
  .object({
    password: zod
      .string()
      .trim()
      .min(8, { message: "Password must be at least 8 characters long" }),
    confirmPassword: zod.string().trim().min(8, { message: "" }),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: "Passwords don't match",
        path: ["confirmPassword"],
      });
    }
  });

const registerSchema = toTypedSchema(
  zod.intersection(baseSchema, passwordSchema)
);

const { handleSubmit, meta } = useForm({
  validationSchema: registerSchema,
});

const error = ref("");

const hasRegistered = ref(false);

const onSubmit = handleSubmit(async (values) => {
  try {
    error.value = "";

    await useAuthStore().register(values.email, values.password, {
      username: values.username,
    });

    hasRegistered.value = true;
  } catch (err) {
    error.value = (err as Error).message;
  }
});
</script>

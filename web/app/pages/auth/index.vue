<template>
  <Title>Authenticate | Quartz</Title>
  <div class="auth">
    <section class="logo">
      <GradientShader class="border-rd-12" />
    </section>
    <section class="form">
      <Transition name="fade" mode="out-in">
        <div :key="isRegister ? 'register' : 'signin'" class="w-full max-w-md">
          <AuthSignInForm v-if="!isRegister" />
          <AuthRegisterForm v-else />
          <div class="whitespace flex justify-center">
            <button
              type="button"
              class="text-center underline text-lg"
              @click="toggleForm"
            >
              {{
                !isRegister
                  ? "Don't have an account yet?"
                  : "Already have an account?"
              }}
            </button>
          </div>
        </div>
      </Transition>
    </section>
  </div>
</template>

<style scoped lang="postcss">
.auth {
  @apply flex flex-col lg:flex-row justify-center items-center min-h-screen;

  .logo {
    @apply w-full h-[35vh] p-4 relative;
    @apply lg:flex-1 lg:max-w-[50vw] lg:h-screen lg:p-15;
  }

  .form {
    @apply w-full flex-1 flex flex-col justify-center items-center;
    @apply px-4 py-12 lg:px-0 lg:mr-15 lg:max-w-[50vw];
  }
}
</style>

<script setup lang="ts">
const isRegister = ref(false);

const toggleForm = () => {
  isRegister.value = !isRegister.value;
};
</script>

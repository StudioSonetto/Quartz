<template>
  <Title>Authenticate | Quartz</Title>
  <div class="auth">
    <section class="logo">
      <GradientShader class="border-rd-15" />
    </section>
    <section class="form">
      <Transition name="fade" mode="out-in">
        <div :key="isRegister ? 'register' : 'signin'">
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
  @apply flex justify-center items-center;

  .logo,
  .form {
    @apply flex-1 max-w-[50vw] h-screen;
  }

  .logo {
    @apply px-15 py-15 relative;
  }

  .form {
    @apply flex flex-col justify-center items-center;
    @apply mr-15;

    form {
      @apply w-[25vw];
    }
  }
}
</style>

<script setup lang="ts">
const isRegister = ref(false);

const toggleForm = () => {
  isRegister.value = !isRegister.value;
};
</script>

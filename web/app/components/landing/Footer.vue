<template>
  <footer>
    <div>
      <h1 class="font-300">Quartz</h1>
      <p class="mt-6">© {{ new Date().getFullYear() }} Sonetto</p>
    </div>
    <nav class="links">
      <NuxtLink to="/">Privacy Policy</NuxtLink>
      <NuxtLink to="/">Terms of Service</NuxtLink>
    </nav>
  </footer>
</template>

<style scoped lang="postcss">
footer {
  @apply ui-section select-none bg-dark-800;
  @apply flex flex-col gap-12 sm:flex-row sm:items-center sm:justify-between;
  @apply border-solid border-0 border-t-2 border-dark-200;

  .links {
    @apply flex items-center gap-6 sm:gap-12;
  }
}
</style>

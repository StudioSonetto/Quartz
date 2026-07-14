<template>
  <footer>
    <div>
      <h1>Quartz</h1>
      <div class="whitespace"></div>
      <p>© {{ new Date().getFullYear() }} Studio Concertos</p>
    </div>
    <div class="flex items-center gap-12">
      <NuxtLink to="/">Privacy Policy</NuxtLink>
      <NuxtLink to="/">Terms of Service</NuxtLink>
    </div>
  </footer>
</template>

<style scoped lang="postcss">
footer {
  @apply flex items-center justify-between;
  @apply bg-dark-800 px-10 py-20;
  @apply border-solid border-0 border-t-2 border-dark-200;
  @apply select-none;
}
</style>

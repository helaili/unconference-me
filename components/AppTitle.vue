<script setup lang="ts">
  const runtimeConfig = useRuntimeConfig()
  const title = ref(runtimeConfig.public.eventName || 'Unconference.me');

  async function goHome() {
    await navigateTo('/')  
  }
</script>

<template>
  <v-btn data-testid="home-button" @click="goHome()">{{ title }}</v-btn>
</template>

<style scoped></style>

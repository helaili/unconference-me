<script setup lang="ts">
  const runtimeConfig = useRuntimeConfig()
  const title = ref(runtimeConfig.public.eventName || 'Unconference.me');
  const appEnv = ref(runtimeConfig.public.appEnv || 'development')
  async function goHome() {
    await navigateTo('/')  
  }
</script>

<template>
  <v-btn v-if="appEnv === 'production'" data-testid="home-button" @click="goHome()">{{ title }}</v-btn>
  <v-btn v-else data-testid="home-button" @click="goHome()">{{ title }} - {{ appEnv }}</v-btn>
</template>

<style scoped></style>

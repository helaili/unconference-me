<script setup lang="ts">
  const title = ref('Eurocats 2025 Unconference')

  async function goHome() {
    await navigateTo('/')  
  }
</script>

<template>
  <v-btn data-testid="home-button" @click="goHome()">{{ title }}</v-btn>
</template>

<style scoped></style>

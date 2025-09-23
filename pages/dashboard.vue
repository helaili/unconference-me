<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed } from 'vue'

const { user } = useUserSession()
const isAdmin = computed(() => user.value?.role === 'Admin')

</script>

<template>
  <v-container>
    <h1>Dashboard</h1>
    <div v-if="isAdmin">
      <p>Welcome, Admin! You have full access to the dashboard features.</p>
      <!-- Admin-specific content goes here -->
    </div>
    <div v-else>
      <p>Welcome, User! You have limited access to the dashboard features.</p>
      <!-- User-specific content goes here -->
    </div>
  </v-container>
</template>

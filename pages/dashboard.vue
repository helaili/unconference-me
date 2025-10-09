<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed } from 'vue'
import type { User as UnconferenceUser }  from '~/types/user'

const { user } = useUserSession() as { user: Ref<UnconferenceUser | null> }
const isAdmin = computed(() => user.value?.role === 'Admin')

useSeoMeta({
  title: 'Dashboard',
  description: 'Your unconference dashboard'
})
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

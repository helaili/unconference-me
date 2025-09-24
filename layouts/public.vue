<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref } from 'vue'

const runtimeConfig = useRuntimeConfig()

const { clear: clearSession } = useUserSession()

const authUrl = ref(
  runtimeConfig.public.authUrl
);

async function goToDashboard() {
  await navigateTo('/dashboard')  
}

async function signIn() {
  await navigateTo(authUrl.value, { external: true })  
}
  
async function signOut() {
  await clearSession()
  await navigateTo('/')
}
</script>

<template>
  <v-app id="app">
    <v-app-bar id="app-bar">
      <v-app-bar-title data-testid="app-bar-title">
        <template #text>
          <AppTitle/>
        </template>
      </v-app-bar-title>
      <v-spacer/>
      <AuthState>
        <template #default="{ loggedIn }">
          <v-btn v-if="loggedIn" data-testid="workspace-button" append-icon="mdi-view-dashboard" @click="goToDashboard()">Dashboard</v-btn>
          <v-btn v-if="loggedIn" data-testid="logout-button" append-icon="mdi-logout" @click="signOut()">Logout</v-btn>
          <v-btn v-else  data-testid="login-button" append-icon="mdi-login" @click="signIn()">Login</v-btn>
        </template>
        <template #placeholder>
          <button disabled>Loading...</button>
        </template>
      </AuthState>
    </v-app-bar>
    <v-main class="d-flex align-center justify-center" style="min-height: 300px;">
      <slot/>
    </v-main>
  </v-app>
</template>

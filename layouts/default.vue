<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
  import { ref, reactive, computed } from 'vue'
  import type { User as UnconferenceUser }  from '~/types/user'

  interface NavItem {
    icon: string
    title: string
    to: string
    adminOnly: boolean
  }

  const { user } = useUserSession() as { user: Ref<UnconferenceUser | null> }
  const { clear: clearSession } = useUserSession()

  const drawer = ref(false)
  const navItems = reactive<NavItem[]>([
    {
      icon: 'mdi-view-dashboard',
      title: 'Dashboard',
      to: '/dashboard',
      adminOnly: false
    },
    {
      icon: 'mdi-cog',
      title: 'Settings',
      to: '/adminSettings',
      adminOnly: true
    }
  ])

  const filteredNavItems = computed<NavItem[]>(() => 
    navItems.filter(item => !item.adminOnly || user.value?.role === 'Admin')
  )

  const toggleDrawer = () => {
    drawer.value = !drawer.value
  }

  const signOut = async (callbackUrl: string) => {
    await clearSession()
    await navigateTo(callbackUrl)
  }
</script>

<template>
  <v-app id="app">
    <v-app-bar id="app-bar">
      <v-app-bar-nav-icon id="app-bar-nav-icon" @click.stop="toggleDrawer"/>
      <v-app-bar-title data-testid="app-bar-title">
        <template #text>
          <AppTitle/>
        </template>
      </v-app-bar-title>
      <v-spacer/>
      <AuthState>
        <template #default="{ loggedIn }">
          <v-btn v-if="loggedIn" data-testid="logout-button" append-icon="mdi-logout" @click="signOut('/')">Logout</v-btn>
        </template>
      </AuthState>
    </v-app-bar>
    <v-navigation-drawer 
      id="nav-drawer" 
      v-model="drawer" 
      data-testid="nav-drawer"
      :rail="true"
      expand-on-hover
    >
    <v-list-item
      v-for="(item, i) in filteredNavItems"
      :key="i"
      :to="item.to"
      :title="item.title"
      :prepend-icon="item.icon"
    />
    </v-navigation-drawer>
    <v-main class="d-flex align-center justify-center" style="min-height: 300px;">
      <slot/>
    </v-main>
  </v-app>
</template>

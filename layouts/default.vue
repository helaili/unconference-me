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
      icon: 'mdi-calendar-multiple',
      title: 'Events',
      to: '/events',
      adminOnly: true
    },
    {
      icon: 'mdi-comment-text-multiple',
      title: 'Topics',
      to: '/topics',
      adminOnly: false
    },
    {
      icon: 'mdi-account-multiple',
      title: 'Users',
      to: '/users',
      adminOnly: true
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
      <v-app-bar-nav-icon 
        id="app-bar-nav-icon" 
        style="min-width: 44px; min-height: 44px;"
        @click.stop="toggleDrawer"
      />
      <v-app-bar-title data-testid="app-bar-title">
        <template #text>
          <AppTitle/>
        </template>
      </v-app-bar-title>
      <v-spacer/>
      <AuthState>
        <template #default="{ loggedIn }">
          <v-btn 
            v-if="loggedIn" 
            data-testid="logout-button" 
            append-icon="mdi-logout" 
            style="min-height: 44px;"
            @click="signOut('/')"
          >
            Logout
          </v-btn>
        </template>
      </AuthState>
    </v-app-bar>
    <v-navigation-drawer 
      id="nav-drawer" 
      v-model="drawer" 
      data-testid="nav-drawer"
      :rail="$vuetify.display.mdAndUp"
      :expand-on-hover="$vuetify.display.mdAndUp"
      :temporary="$vuetify.display.smAndDown"
    >
      <v-list nav>
        <v-list-item
          v-for="(item, i) in filteredNavItems"
          :key="i"
          :to="item.to"
          :title="item.title"
          :prepend-icon="item.icon"
          @click="$vuetify.display.smAndDown && (drawer = false)"
        />
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <v-container fluid class="pa-2 pa-md-4">
        <slot/>
      </v-container>
    </v-main>
  </v-app>
</template>

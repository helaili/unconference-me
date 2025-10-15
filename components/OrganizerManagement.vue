<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Organizer } from '~/types/organizer'
import type { User } from '~/types/user'

interface Props {
  eventId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  refresh: []
}>()

// State
const organizers = ref<Organizer[]>([])
const users = ref<User[]>([])
const loading = ref(false)
const showAddDialog = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Form data
const newOrganizer = ref({
  email: '',
  role: 'moderator' as 'owner' | 'admin' | 'moderator'
})

const roleOptions = [
  { value: 'owner', title: 'Owner', description: 'Full control over event' },
  { value: 'admin', title: 'Admin', description: 'Can manage most aspects' },
  { value: 'moderator', title: 'Moderator', description: 'Can approve topics and participants' }
]

// Fetch organizers
const fetchOrganizers = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await $fetch(`/api/events/${props.eventId}/organizers`)
    if (response.success) {
      organizers.value = response.organizers
    }
  } catch (err: any) {
    console.error('Error fetching organizers:', err)
    error.value = err?.data?.message || 'Failed to load organizers'
  } finally {
    loading.value = false
  }
}

// Fetch users for suggestions
const fetchUsers = async () => {
  try {
    const response = await $fetch<{ users: User[] }>('/api/users')
    users.value = response.users
  } catch (err) {
    console.error('Error fetching users:', err)
  }
}

// Get role color
const getRoleColor = (role: string) => {
  const colors: Record<string, string> = {
    owner: 'purple',
    admin: 'blue',
    moderator: 'teal'
  }
  return colors[role] || 'grey'
}

// Get role icon
const getRoleIcon = (role: string) => {
  const icons: Record<string, string> = {
    owner: 'mdi-crown',
    admin: 'mdi-shield-account',
    moderator: 'mdi-account-check'
  }
  return icons[role] || 'mdi-account'
}

// Add organizer
const handleAddOrganizer = async () => {
  error.value = null
  successMessage.value = null
  
  try {
    const response = await $fetch(`/api/events/${props.eventId}/organizers`, {
      method: 'POST',
      body: newOrganizer.value
    })
    
    if (response.success) {
      successMessage.value = 'Organizer added successfully!'
      showAddDialog.value = false
      newOrganizer.value = {
        email: '',
        role: 'moderator'
      }
      await fetchOrganizers()
      emit('refresh')
      
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    }
  } catch (err: any) {
    console.error('Error adding organizer:', err)
    error.value = err?.data?.message || 'Failed to add organizer'
  }
}

// Remove organizer
const handleRemoveOrganizer = async (organizerId: string) => {
  if (!confirm('Are you sure you want to remove this organizer?')) return
  
  error.value = null
  successMessage.value = null
  
  try {
    const response = await $fetch(`/api/events/${props.eventId}/organizers/${organizerId}`, {
      method: 'DELETE'
    })
    
    if (response.success) {
      successMessage.value = 'Organizer removed successfully!'
      await fetchOrganizers()
      emit('refresh')
      
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    }
  } catch (err: any) {
    console.error('Error removing organizer:', err)
    error.value = err?.data?.message || 'Failed to remove organizer'
  }
}

// Email suggestions
const emailSuggestions = computed(() => {
  return users.value.map(u => u.email)
})

onMounted(async () => {
  await fetchOrganizers()
  await fetchUsers()
})
</script>

<template>
  <v-card :class="$vuetify.display.smAndDown ? 'mb-2' : 'mb-4'">
    <v-card-title class="d-flex justify-space-between align-center flex-wrap">
      <span :class="$vuetify.display.smAndDown ? 'text-h6' : 'text-h5'">Event Organizers</span>
      <v-btn
        color="primary"
        prepend-icon="mdi-account-plus"
        size="small"
        :block="$vuetify.display.smAndDown"
        :class="$vuetify.display.smAndDown ? 'mt-2 w-100' : ''"
        @click="showAddDialog = true"
      >
        Add Organizer
      </v-btn>
    </v-card-title>
    
    <v-card-text :class="$vuetify.display.smAndDown ? 'pa-3' : 'pa-4'">
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        closable
        class="mb-4"
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>
      
      <v-alert
        v-if="successMessage"
        type="success"
        variant="tonal"
        closable
        class="mb-4"
        @click:close="successMessage = null"
      >
        {{ successMessage }}
      </v-alert>
      
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" size="32" />
        <p class="mt-2 text-grey">Loading organizers...</p>
      </div>
      
      <div v-else-if="organizers.length === 0" class="text-center py-4">
        <v-icon size="48" color="grey">mdi-account-group</v-icon>
        <p class="mt-2 text-grey">No organizers assigned yet</p>
      </div>
      
      <v-list v-else density="comfortable">
        <v-list-item
          v-for="organizer in organizers"
          :key="organizer.id"
          :class="$vuetify.display.smAndDown ? 'px-0' : ''"
        >
          <template #prepend>
            <v-avatar :color="getRoleColor(organizer.role)" size="40">
              <v-icon :icon="getRoleIcon(organizer.role)" />
            </v-avatar>
          </template>
          
          <v-list-item-title>
            <span v-if="organizer.firstname || organizer.lastname">
              {{ organizer.firstname }} {{ organizer.lastname }}
            </span>
            <span v-else class="text-grey">
              No name
            </span>
          </v-list-item-title>
          
          <v-list-item-subtitle>
            <div>{{ organizer.email }}</div>
            <v-chip
              :color="getRoleColor(organizer.role)"
              size="x-small"
              class="mt-1"
            >
              {{ organizer.role.toUpperCase() }}
            </v-chip>
          </v-list-item-subtitle>
          
          <template #append>
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="handleRemoveOrganizer(organizer.id)"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
    
    <!-- Add Organizer Dialog -->
    <v-dialog v-model="showAddDialog" :max-width="$vuetify.display.smAndDown ? '100%' : '500'">
      <v-card>
        <v-card-title :class="$vuetify.display.smAndDown ? 'text-h6' : 'text-h5'">
          Add Organizer
        </v-card-title>
        
        <v-card-text :class="$vuetify.display.smAndDown ? 'pa-3' : 'pa-4'">
          <v-combobox
            v-model="newOrganizer.email"
            label="Email *"
            :items="emailSuggestions"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-email"
            hint="Select an existing user or enter an email"
            persistent-hint
            class="mb-4"
          />
          
          <v-select
            v-model="newOrganizer.role"
            label="Role *"
            :items="roleOptions"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item
                v-bind="itemProps"
                :prepend-icon="getRoleIcon(item.value)"
                :subtitle="item.raw.description"
              />
            </template>
          </v-select>
          
          <v-alert type="info" variant="tonal" density="compact" class="mt-4">
            <v-icon start>mdi-information</v-icon>
            Permissions will be assigned based on the selected role
          </v-alert>
        </v-card-text>
        
        <v-divider />
        
        <v-card-actions :class="$vuetify.display.smAndDown ? 'flex-column pa-3' : 'pa-4'">
          <v-spacer v-if="!$vuetify.display.smAndDown" />
          <v-btn
            variant="text"
            :block="$vuetify.display.smAndDown"
            :class="$vuetify.display.smAndDown ? 'mb-2' : 'mr-2'"
            @click="showAddDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :block="$vuetify.display.smAndDown"
            :disabled="!newOrganizer.email"
            @click="handleAddOrganizer"
          >
            Add Organizer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

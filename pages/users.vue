<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

definePageMeta({
  requiresAdmin: true
})

useSeoMeta({
  title: 'User Management',
  description: 'Manage users and participants'
})

interface User {
  id?: string
  email: string
  firstname: string
  lastname: string
  role?: string
  githubId?: number
  githubUsername?: string
  registeredAt?: Date
  lastLoginAt?: Date
  hasInvitation?: boolean
  invitationExpiry?: Date
}

const users = ref<User[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const generatingToken = ref<string | null>(null)
const invitationDialog = ref(false)
const currentInvitation = ref<{ url: string; expiresAt?: Date } | null>(null)
const organizerDialog = ref(false)
const selectedUser = ref<User | null>(null)
const organizerRole = ref<'owner' | 'admin' | 'moderator'>('moderator')
const assigningOrganizer = ref(false)

const fetchUsers = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await $fetch('/api/users')
    if (response.success) {
      users.value = response.users
    }
  } catch (err: any) {
    console.error('Error fetching users:', err)
    error.value = 'Failed to load users'
  } finally {
    loading.value = false
  }
}

const generateInvitation = async (user: User) => {
  if (!user.id) return
  
  generatingToken.value = user.id
  error.value = null
  
  try {
    const response = await $fetch(`/api/users/${user.id}/invitation`, {
      method: 'POST',
      body: {
        eventId: '1' // Default event
      }
    })
    
    if (response.success) {
      currentInvitation.value = {
        url: response.invitationUrl,
        expiresAt: response.expiresAt ? new Date(response.expiresAt) : undefined
      }
      invitationDialog.value = true
      
      // Refresh user list to update invitation status
      await fetchUsers()
    }
  } catch (err: any) {
    console.error('Error generating invitation:', err)
    error.value = err.data?.message || 'Failed to generate invitation link'
  } finally {
    generatingToken.value = null
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    successMessage.value = 'Invitation link copied to clipboard!'
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = 'Failed to copy to clipboard'
  }
}

const formatDate = (date?: Date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString()
}

const getRoleBadgeColor = (role?: string) => {
  switch (role) {
    case 'Admin':
      return 'error'
    case 'Organizer':
      return 'warning'
    case 'Participant':
      return 'info'
    default:
      return 'default'
  }
}

const openOrganizerDialog = (user: User) => {
  selectedUser.value = user
  organizerDialog.value = true
}

const assignOrganizerRole = async () => {
  if (!selectedUser.value?.id) return
  
  assigningOrganizer.value = true
  error.value = null
  
  try {
    const response = await $fetch('/api/events/1/organizers', {
      method: 'POST',
      body: {
        userId: selectedUser.value.id,
        role: organizerRole.value,
        permissions: {
          canEditEvent: organizerRole.value === 'owner' || organizerRole.value === 'admin',
          canApproveParticipants: true,
          canApproveTopics: true,
          canScheduleTopics: true,
          canManageAssignments: organizerRole.value === 'owner' || organizerRole.value === 'admin',
          canRunAutoAssignment: organizerRole.value === 'owner' || organizerRole.value === 'admin',
          canViewReports: true
        }
      }
    })
    
    if (response.success) {
      successMessage.value = 'Organizer role assigned successfully!'
      organizerDialog.value = false
      await fetchUsers()
      
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    }
  } catch (err: any) {
    console.error('Error assigning organizer role:', err)
    error.value = err.data?.message || 'Failed to assign organizer role'
  } finally {
    assigningOrganizer.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <v-container :class="$vuetify.display.smAndDown ? 'pa-2' : 'pa-4'">
    <v-row>
      <v-col cols="12">
        <h1 :class="$vuetify.display.smAndDown ? 'text-h4 mb-4' : 'text-h3 mb-6'">
          User Management
        </h1>
        
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
        
        <v-card :elevation="$vuetify.display.smAndDown ? 1 : 2">
          <v-card-title>
            <v-row align="center">
              <v-col>
                Users ({{ users.length }})
              </v-col>
              <v-col cols="auto">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-refresh"
                  @click="fetchUsers"
                  :loading="loading"
                  :size="$vuetify.display.smAndDown ? 'small' : 'default'"
                >
                  Refresh
                </v-btn>
              </v-col>
            </v-row>
          </v-card-title>
          
          <v-card-text>
            <v-progress-linear
              v-if="loading"
              indeterminate
              color="primary"
              class="mb-4"
            />
            
            <v-table v-else>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th v-if="!$vuetify.display.smAndDown">GitHub</th>
                  <th v-if="!$vuetify.display.smAndDown">Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id || user.email">
                  <td>{{ user.firstname }} {{ user.lastname }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <v-chip
                      :color="getRoleBadgeColor(user.role)"
                      size="small"
                    >
                      {{ user.role || 'User' }}
                    </v-chip>
                  </td>
                  <td v-if="!$vuetify.display.smAndDown">
                    <v-icon v-if="user.githubId" color="success" size="small">
                      mdi-check-circle
                    </v-icon>
                    <span v-else class="text-grey">—</span>
                  </td>
                  <td v-if="!$vuetify.display.smAndDown">
                    {{ formatDate(user.registeredAt) }}
                  </td>
                  <td>
                    <v-btn
                      color="primary"
                      variant="text"
                      size="small"
                      prepend-icon="mdi-email"
                      @click="generateInvitation(user)"
                      :loading="generatingToken === user.id"
                      class="mr-1"
                    >
                      <span v-if="!$vuetify.display.smAndDown">
                        {{ user.hasInvitation ? 'Regenerate' : 'Generate' }} Link
                      </span>
                      <span v-else>
                        Link
                      </span>
                    </v-btn>
                    <v-btn
                      v-if="user.role !== 'Admin'"
                      color="warning"
                      variant="text"
                      size="small"
                      prepend-icon="mdi-shield-account"
                      @click="openOrganizerDialog(user)"
                    >
                      <span v-if="!$vuetify.display.smAndDown">
                        Make Organizer
                      </span>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
            
            <v-alert
              v-if="users.length === 0 && !loading"
              type="info"
              variant="tonal"
              class="mt-4"
            >
              No users found
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Invitation Dialog -->
    <v-dialog
      v-model="invitationDialog"
      :max-width="$vuetify.display.smAndDown ? '95%' : '600'"
    >
      <v-card>
        <v-card-title>
          Invitation Link Generated
        </v-card-title>
        
        <v-card-text>
          <p class="mb-4">
            Share this invitation link with the user. The link will expire on
            {{ currentInvitation?.expiresAt ? formatDate(currentInvitation.expiresAt) : 'N/A' }}.
          </p>
          
          <v-text-field
            :model-value="currentInvitation?.url"
            readonly
            variant="outlined"
            density="comfortable"
            class="mb-2"
          >
            <template #append-inner>
              <v-btn
                icon="mdi-content-copy"
                variant="text"
                size="small"
                @click="copyToClipboard(currentInvitation?.url || '')"
              />
            </template>
          </v-text-field>
        </v-card-text>
        
        <v-card-actions class="flex-column flex-sm-row">
          <v-spacer />
          <v-btn
            color="primary"
            :block="$vuetify.display.smAndDown"
            @click="invitationDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Organizer Assignment Dialog -->
    <v-dialog
      v-model="organizerDialog"
      :max-width="$vuetify.display.smAndDown ? '95%' : '500'"
    >
      <v-card>
        <v-card-title>
          Assign Organizer Role
        </v-card-title>
        
        <v-card-text>
          <p class="mb-4">
            Assign organizer role to <strong>{{ selectedUser?.firstname }} {{ selectedUser?.lastname }}</strong>
          </p>
          
          <v-select
            v-model="organizerRole"
            :items="[
              { title: 'Moderator', value: 'moderator' },
              { title: 'Admin', value: 'admin' },
              { title: 'Owner', value: 'owner' }
            ]"
            label="Organizer Role"
            variant="outlined"
            density="comfortable"
          />
          
          <v-alert type="info" variant="tonal" class="mt-4">
            <strong>Role Permissions:</strong>
            <ul class="mt-2">
              <li v-if="organizerRole === 'owner'">Full event management access</li>
              <li v-if="organizerRole === 'admin'">Event editing and participant management</li>
              <li v-if="organizerRole === 'moderator'">Topic and participant approval</li>
            </ul>
          </v-alert>
        </v-card-text>
        
        <v-card-actions class="flex-column flex-sm-row">
          <v-spacer />
          <v-btn
            variant="outlined"
            :block="$vuetify.display.smAndDown"
            class="mb-2 mb-sm-0 mr-sm-2"
            @click="organizerDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="warning"
            :block="$vuetify.display.smAndDown"
            :loading="assigningOrganizer"
            @click="assignOrganizerRole"
          >
            Assign Role
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

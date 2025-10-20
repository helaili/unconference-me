<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { User } from '~/types/user'
import type { Participant } from '~/types/participant'
import type { Event } from '~/types/event'
import type { Invitation } from '~/types/invitation'

interface Props {
  eventId: string
  participants: Participant[]
  event: Event
}

const props = defineProps<Props>()
const emit = defineEmits<{
  invite: [userIds: string[]]
  refresh: []
}>()

const showInviteDialog = ref(false)
const selectedUserIds = ref<string[]>([])
const sending = ref(false)
const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const loadingUsers = ref(false)
const loadingInvitations = ref(false)
const availableUsers = ref<User[]>([])
const personalInvitations = ref<Invitation[]>([])

const registrationMode = computed(() => props.event.settings?.registrationMode || 'open')
const requiresPersonalCodes = computed(() => registrationMode.value === 'personal-code')

// Filter users who are not already participants
const uninvitedUsers = computed(() => {
  const participantUserIds = new Set(props.participants.map(p => p.userId).filter(Boolean))
  return availableUsers.value.filter(u => !participantUserIds.has(u.id))
})

const fetchAvailableUsers = async () => {
  loadingUsers.value = true
  try {
    const response = await $fetch('/api/users')
    if (response.success && response.users) {
      availableUsers.value = response.users as User[]
    }
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    loadingUsers.value = false
  }
}

const fetchPersonalInvitations = async () => {
  if (!requiresPersonalCodes.value) return
  
  loadingInvitations.value = true
  try {
    const response = await $fetch(`/api/events/${props.eventId}/invitations`)
    if (response.success && response.invitations) {
      personalInvitations.value = (response.invitations as Invitation[])
    }
  } catch (error) {
    console.error('Failed to fetch invitations:', error)
  } finally {
    loadingInvitations.value = false
  }
}

const openInviteDialog = async () => {
  await fetchAvailableUsers()
  if (requiresPersonalCodes.value) {
    await fetchPersonalInvitations()
  }
  selectedUserIds.value = []
  successMessage.value = null
  errorMessage.value = null
  showInviteDialog.value = true
}

const sendInvitations = async () => {
  if (selectedUserIds.value.length === 0) {
    errorMessage.value = 'Please select at least one user'
    return
  }

  sending.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    if (requiresPersonalCodes.value) {
      // Generate personal invitation codes
      const response = await $fetch(`/api/events/${props.eventId}/invitations/generate-personal`, {
        method: 'POST',
        body: { userIds: selectedUserIds.value }
      })
      
      if (response.success) {
        successMessage.value = `Personal invitation codes generated for ${selectedUserIds.value.length} user(s)`
        emit('refresh')
      }
    } else {
      // Send regular invitations
      emit('invite', selectedUserIds.value)
      successMessage.value = `Invitations sent to ${selectedUserIds.value.length} user(s)`
    }
    
    // Close dialog after 2 seconds
    setTimeout(() => {
      showInviteDialog.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to send invitations:', error)
    errorMessage.value = 'Failed to send invitations'
  } finally {
    sending.value = false
  }
}

const copyPersonalCode = async (code: string) => {
  try {
    const registrationUrl = `${window.location.origin}/events/${props.eventId}/register?personalCode=${code}`
    await navigator.clipboard.writeText(registrationUrl)
    successMessage.value = 'Registration link copied to clipboard!'
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (error) {
    console.error('Failed to copy code:', error)
  }
}

onMounted(() => {
  fetchAvailableUsers()
  if (requiresPersonalCodes.value) {
    fetchPersonalInvitations()
  }
})
</script>

<template>
  <v-card :elevation="$vuetify.display.smAndDown ? 1 : 2">
    <v-card-title class="d-flex justify-space-between align-center flex-column flex-sm-row">
      <span class="mb-2 mb-sm-0">Invitations</span>
      <v-btn
        color="primary"
        prepend-icon="mdi-email-multiple"
        :block="$vuetify.display.smAndDown"
        @click="openInviteDialog"
      >
        {{ requiresPersonalCodes ? 'Generate Personal Codes' : 'Send Invitations' }}
      </v-btn>
    </v-card-title>

    <v-card-text :class="$vuetify.display.smAndDown ? 'pa-2' : 'pa-4'">
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

      <p class="text-body-2 text-grey">
        <template v-if="requiresPersonalCodes">
          Generate personal invitation codes for users. Each user will receive a unique code that only they can use to register.
        </template>
        <template v-else>
          Send event invitations to existing users. Invited users will see pending invitations when they log in.
        </template>
      </p>

      <v-divider class="my-4" />

      <div class="d-flex align-center mb-4">
        <v-icon size="large" color="primary" class="mr-3">mdi-information</v-icon>
        <div>
          <div class="text-body-2 font-weight-medium">About Invitations</div>
          <div class="text-caption text-grey">
            Only existing users can be invited. 
            <template v-if="requiresPersonalCodes">
              Personal codes are unique and expire after 30 days.
            </template>
            <template v-else>
              Users must accept invitations to become participants.
            </template>
          </div>
        </div>
      </div>

      <!-- Show personal invitations list when in personal-code mode -->
      <div v-if="requiresPersonalCodes && personalInvitations.length > 0">
        <h4 class="text-subtitle-1 mb-3">Personal Invitation Codes</h4>
        <v-progress-circular v-if="loadingInvitations" indeterminate class="ma-4" />
        <v-list v-else>
          <v-list-item
            v-for="invitation in personalInvitations"
            :key="invitation.id"
            class="mb-2"
          >
            <template #prepend>
              <v-icon>mdi-account-key</v-icon>
            </template>
            <v-list-item-title>
              {{ invitation.userId }}
            </v-list-item-title>
            <v-list-item-subtitle>
              Code: {{ invitation.personalCode }} | Status: {{ invitation.status }}
            </v-list-item-subtitle>
            <template #append>
              <v-btn
                v-if="invitation.personalCode"
                icon="mdi-content-copy"
                variant="text"
                size="small"
                @click="copyPersonalCode(invitation.personalCode!)"
              />
            </template>
          </v-list-item>
        </v-list>
      </div>
    </v-card-text>

    <!-- Send Invitations Dialog -->
    <v-dialog
      v-model="showInviteDialog"
      :max-width="$vuetify.display.smAndDown ? '100%' : '700'"
      :fullscreen="$vuetify.display.smAndDown"
    >
      <v-card>
        <v-card-title>Send Invitations to Users</v-card-title>
        
        <v-card-text :class="$vuetify.display.smAndDown ? 'pa-3' : 'pa-4'">
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
            v-if="errorMessage"
            type="error"
            variant="tonal"
            closable
            class="mb-4"
            @click:close="errorMessage = null"
          >
            {{ errorMessage }}
          </v-alert>

          <v-progress-circular v-if="loadingUsers" indeterminate class="ma-4" />
          <div v-else>
            <p class="text-body-2 mb-4">
              Select users to invite to this event. Only users who are not already participants are shown.
            </p>
            <v-select
              v-model="selectedUserIds"
              label="Select Users"
              :items="uninvitedUsers"
              item-title="email"
              item-value="id"
              variant="outlined"
              density="comfortable"
              multiple
              chips
              closable-chips
              :disabled="uninvitedUsers.length === 0"
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps">
                  <v-list-item-title>{{ item.raw.firstname }} {{ item.raw.lastname }}</v-list-item-title>
                  <v-list-item-subtitle>{{ item.raw.email }}</v-list-item-subtitle>
                </v-list-item>
              </template>
              <template #chip="{ item }">
                <v-chip>
                  {{ item.raw.firstname }} {{ item.raw.lastname }}
                </v-chip>
              </template>
            </v-select>
            <v-alert v-if="uninvitedUsers.length === 0" type="info" variant="tonal" class="mt-4">
              All users are already participants or have pending invitations for this event
            </v-alert>
          </div>
        </v-card-text>

        <v-card-actions class="flex-column flex-sm-row">
          <v-spacer />
          <v-btn
            variant="outlined"
            :block="$vuetify.display.smAndDown"
            class="mb-2 mb-sm-0 mr-sm-2"
            :disabled="sending"
            @click="showInviteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="sending"
            :disabled="selectedUserIds.length === 0"
            :block="$vuetify.display.smAndDown"
            @click="sendInvitations"
          >
            Send {{ selectedUserIds.length }} Invitation{{ selectedUserIds.length !== 1 ? 's' : '' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

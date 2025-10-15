<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Event } from '~/types/event'
import type { Participant } from '~/types/participant'

definePageMeta({
  requiresAdmin: true
})

const route = useRoute()
const router = useRouter()
const eventId = computed(() => route.params.id as string)

interface ParticipantStats {
  total: number
  registered: number
  confirmed: number
  checkedIn: number
  cancelled: number
}

const event = ref<Event | null>(null)
const participants = ref<Participant[]>([])
const participantStats = ref<ParticipantStats | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

useSeoMeta({
  title: computed(() => event.value ? `${event.value.name} - Event Management` : 'Event Management'),
  description: 'Manage event details, participants, and invitations'
})

const fetchEventData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Fetch event details
    const eventResponse = await $fetch(`/api/events/${eventId.value}`)
    if (eventResponse.success && eventResponse.event) {
      event.value = eventResponse.event as Event
    }
    
    // Fetch participants
    const participantsResponse = await $fetch(`/api/events/${eventId.value}/participants`)
    if (participantsResponse.success) {
      participants.value = participantsResponse.participants || []
      participantStats.value = participantsResponse.stats
    }
  } catch (err) {
    console.error('Error fetching event data:', err)
    error.value = 'Failed to load event data'
  } finally {
    loading.value = false
  }
}

const cancelDialog = ref(false)

const handleEventUpdate = async (updates: Partial<Event>) => {
  error.value = null
  successMessage.value = null
  
  try {
    const response = await $fetch(`/api/events/${eventId.value}`, {
      method: 'PUT',
      body: updates
    })
    
    if (response.success && response.event) {
      event.value = response.event as Event
      successMessage.value = 'Event updated successfully!'
      
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    }
  } catch (err) {
    console.error('Error updating event:', err)
    error.value = 'Failed to update event'
  }
}

const handleChangeStatus = async (status: Event['status']) => {
  await handleEventUpdate({ status })
}

const handleCancelEvent = () => {
  cancelDialog.value = true
}

const confirmCancelEvent = async () => {
  await handleEventUpdate({ status: 'cancelled' })
  cancelDialog.value = false
}

const handleRegisterUser = async (userId: string) => {
  error.value = null
  successMessage.value = null
  
  try {
    const response = await $fetch(`/api/events/${eventId.value}/participants/register`, {
      method: 'POST',
      body: { userId }
    })
    
    if (response.success) {
      successMessage.value = 'User registered successfully!'
      await fetchEventData()
      
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    }
  } catch (err) {
    console.error('Error registering user:', err)
    error.value = 'Failed to register user'
  }
}

const handleUpdateParticipant = async (participantId: string, updates: Partial<Participant>) => {
  error.value = null
  successMessage.value = null
  
  try {
    const response = await $fetch(`/api/events/${eventId.value}/participants/${participantId}`, {
      method: 'PUT',
      body: updates
    })
    
    if (response.success) {
      successMessage.value = 'Participant updated successfully!'
      await fetchEventData()
      
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    }
  } catch (err) {
    console.error('Error updating participant:', err)
    error.value = 'Failed to update participant'
  }
}

const handleDeleteParticipant = async (participantId: string) => {
  error.value = null
  successMessage.value = null
  
  try {
    const response = await $fetch(`/api/events/${eventId.value}/participants/${participantId}`, {
      method: 'DELETE'
    })
    
    if (response.success) {
      successMessage.value = 'Participant deleted successfully!'
      await fetchEventData()
      
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    }
  } catch (err) {
    console.error('Error deleting participant:', err)
    error.value = 'Failed to delete participant'
  }
}

const handleSendInvitations = async (userIds: string[]) => {
  error.value = null
  successMessage.value = null
  
  try {
    const response = await $fetch(`/api/events/${eventId.value}/invitations`, {
      method: 'POST',
      body: { userIds }
    })
    
    if (response.success) {
      successMessage.value = `Invitations sent to ${userIds.length} user(s)!`
      
      setTimeout(() => {
        successMessage.value = null
      }, 5000)
    }
  } catch (err) {
    console.error('Error sending invitations:', err)
    error.value = 'Failed to send invitations'
  }
}

const goBack = () => {
  router.push('/events')
}

onMounted(() => {
  fetchEventData()
})
</script>

<template>
  <v-container :class="$vuetify.display.smAndDown ? 'pa-2' : 'pa-4'">
    <div class="d-flex align-center mb-4">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        :size="$vuetify.display.smAndDown ? 'small' : 'default'"
        @click="goBack"
      />
      <h1 :class="$vuetify.display.smAndDown ? 'text-h5 ml-2' : 'text-h3 ml-2'">
        {{ event?.name || 'Event Management' }}
      </h1>
    </div>

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

    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="mt-4 text-grey">Loading event data...</p>
    </div>

    <div v-else-if="event">
      <!-- Event Status -->
      <EventStatus
        :event="event"
        :participant-stats="participantStats"
        :can-manage="true"
        class="mb-4"
        @cancel-event="handleCancelEvent"
        @change-status="handleChangeStatus"
      />

      <!-- Event Configuration -->
      <EventConfiguration
        class="mb-4"
        :event="event"
        @update="handleEventUpdate"
        @save="fetchEventData"
      />

      <!-- Participant Management -->
      <ParticipantManagement
        class="mb-4"
        :event-id="eventId"
        :participants="participants"
        @register="handleRegisterUser"
        @update="handleUpdateParticipant"
        @delete="handleDeleteParticipant"
        @refresh="fetchEventData"
      />

      <!-- Invitation Management -->
      <InvitationManagement
        :event-id="eventId"
        :participants="participants"
        @invite="handleSendInvitations"
      />
    </div>

    <v-alert v-else type="info" variant="tonal">
      Event not found
    </v-alert>
    
    <!-- Cancel Event Confirmation Dialog -->
    <v-dialog v-model="cancelDialog" max-width="500">
      <v-card>
        <v-card-title :class="$vuetify.display.smAndDown ? 'text-h6' : 'text-h5'">
          Cancel Event
        </v-card-title>
        <v-card-text>
          <p>Are you sure you want to cancel this event?</p>
          <p class="mt-2 text-warning">
            <v-icon size="small" class="mr-1">mdi-alert</v-icon>
            This will set the event status to "cancelled" and notify all participants.
          </p>
        </v-card-text>
        <v-card-actions :class="$vuetify.display.smAndDown ? 'flex-column pa-3' : 'pa-4'">
          <v-spacer v-if="!$vuetify.display.smAndDown" />
          <v-btn
            variant="text"
            :block="$vuetify.display.smAndDown"
            :class="$vuetify.display.smAndDown ? 'mb-2' : 'mr-2'"
            @click="cancelDialog = false"
          >
            Keep Event
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :block="$vuetify.display.smAndDown"
            @click="confirmCancelEvent"
          >
            Cancel Event
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

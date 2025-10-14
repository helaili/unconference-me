<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { User as UnconferenceUser }  from '~/types/user'
import type { Event } from '~/types/event'
import type { ParticipantAssignment } from '~/types/participant'

const { user } = useUserSession() as { user: Ref<UnconferenceUser | null> }
const isAdmin = ref(user.value?.role === 'Admin')

const event = ref<Event | null>(null)
const assignments = ref<ParticipantAssignment[]>([])
const participantStats = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)

useSeoMeta({
  title: 'Dashboard',
  description: 'Your unconference dashboard'
})

const fetchEventData = async () => {
  if (!isAdmin.value) return
  
  loading.value = true
  error.value = null
  
  try {
    // Fetch event details
    const eventResponse = await $fetch('/api/events/1')
    if (eventResponse.success && eventResponse.event) {
      event.value = eventResponse.event as Event
    }
    
    // Fetch assignments
    const assignmentsResponse = await $fetch('/api/events/1/assignments')
    if (assignmentsResponse.success) {
      assignments.value = assignmentsResponse.assignments
    }
    
    // Fetch participant stats
    const participantsResponse = await $fetch('/api/events/1/participants')
    if (participantsResponse.success) {
      participantStats.value = participantsResponse.stats
    }
  } catch (err) {
    console.error('Error fetching event data:', err)
    error.value = 'Failed to load event data'
  } finally {
    loading.value = false
  }
}

const handleEventUpdate = async (updates: Partial<Event>) => {
  try {
    const response = await $fetch(`/api/events/${event.value?.id}`, {
      method: 'PUT',
      body: updates
    })
    
    if (response.success && response.event) {
      event.value = response.event as Event
    }
  } catch (err) {
    console.error('Error updating event:', err)
    error.value = 'Failed to update event'
  }
}

onMounted(() => {
  fetchEventData()
})
</script>

<template>
  <v-container>
    <h1 class="mb-6">{{ isAdmin ? 'Admin' : 'User' }} Dashboard</h1>
    
    <div v-if="isAdmin">
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
        <EventStatus :event="event" :participant-stats="participantStats" />
        
        <EventConfiguration
          :event="event"
          @update="handleEventUpdate"
          @save="fetchEventData"
        />
        
        <AssignmentList :assignments="assignments" />
      </div>
      
      <v-alert v-else type="info" variant="tonal" class="mt-4">
        No event data available
      </v-alert>
    </div>
    
    <div v-else>
      <!-- Pending invitations front and center for users -->
      <PendingInvitations />
      
      <p>Welcome, {{ user?.firstname }}! View your event invitations above.</p>
      <!-- Additional user-specific content goes here -->
    </div>
  </v-container>
</template>

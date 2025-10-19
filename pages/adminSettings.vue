<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Event } from '~/types/event'

useSeoMeta({
  title: 'Admin Settings',
  description: 'Administrative settings for the unconference platform'
})

const event = ref<Event | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const fetchEvent = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await $fetch('/api/events/1')
    if (response.success && response.event) {
      event.value = response.event as Event
    }
  } catch (err) {
    console.error('Error fetching event:', err)
    error.value = 'Failed to load event settings'
  } finally {
    loading.value = false
  }
}

const handleEventUpdate = async (updates: Partial<Event>) => {
  error.value = null
  successMessage.value = null
  
  try {
    const response = await $fetch(`/api/events/${event.value?.id}`, {
      method: 'PUT',
      body: updates
    })
    
    if (response.success && response.event) {
      event.value = response.event as Event
      successMessage.value = 'Settings saved successfully!'
      
      // Refresh event data after successful update
      await fetchEvent()
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    }
  } catch (err) {
    console.error('Error updating event:', err)
    error.value = 'Failed to save settings'
  }
}

onMounted(() => {
  fetchEvent()
})
</script>

<template>
  <v-container>
    <h1 class="mb-6">Event Settings</h1>
    
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
      <p class="mt-4 text-grey">Loading settings...</p>
    </div>
    
    <div v-else-if="event">
      <EventConfiguration
        :event="event"
        @update="handleEventUpdate"
      />
    </div>
    
    <v-alert v-else type="info" variant="tonal">
      No event available to configure
    </v-alert>
  </v-container>
</template>
<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Event } from '~/types/event'

definePageMeta({
  requiresAdmin: true
})

useSeoMeta({
  title: 'Events',
  description: 'Manage unconference events'
})

const events = ref<Event[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const showCreateDialog = ref(false)

const fetchEvents = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await $fetch('/api/events')
    if (response.success && response.events) {
      events.value = response.events as Event[]
    }
  } catch (err) {
    console.error('Error fetching events:', err)
    error.value = 'Failed to load events'
  } finally {
    loading.value = false
  }
}

const handleCreateEvent = async (eventData: any) => {
  error.value = null
  successMessage.value = null
  
  try {
    const response = await $fetch('/api/events', {
      method: 'POST',
      body: eventData
    })
    
    if (response.success) {
      successMessage.value = 'Event created successfully!'
      await fetchEvents()
      
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    }
  } catch (err: any) {
    console.error('Error creating event:', err)
    error.value = err?.data?.message || 'Failed to create event'
  }
}

onMounted(() => {
  fetchEvents()
})
</script>

<template>
  <v-container :class="$vuetify.display.smAndDown ? 'pa-2' : 'pa-4'">
    <div class="d-flex justify-space-between align-center flex-column flex-sm-row mb-4">
      <h1 :class="$vuetify.display.smAndDown ? 'text-h4 mb-2' : 'text-h3 mb-0'">
        Events
      </h1>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        :block="$vuetify.display.smAndDown"
        :class="$vuetify.display.smAndDown ? 'mt-2' : ''"
        @click="showCreateDialog = true"
      >
        Create Event
      </v-btn>
    </div>

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

    <EventList :events="events" :loading="loading" />
    
    <EventCreationDialog
      v-model="showCreateDialog"
      @create="handleCreateEvent"
    />
  </v-container>
</template>

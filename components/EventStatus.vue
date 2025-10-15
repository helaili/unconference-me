<script setup lang="ts">
import type { Event } from '~/types/event'

interface Props {
  event: Event
  participantStats?: {
    total: number
    registered: number
    confirmed: number
    checkedIn: number
    cancelled: number
  }
  canManage?: boolean
}

withDefaults(defineProps<Props>(), {
  canManage: false
})

const emit = defineEmits<{
  'cancel-event': []
  'change-status': [status: Event['status']]
}>()

const getStatusColor = (status: Event['status']) => {
  const colors = {
    draft: 'grey',
    published: 'blue',
    active: 'green',
    completed: 'purple',
    cancelled: 'red'
  }
  return colors[status] || 'grey'
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <v-card class="mb-4">
    <v-card-title>Event Status</v-card-title>
    
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <div class="mb-4">
            <div class="text-caption text-grey">Event Name</div>
            <div class="text-h6">{{ event.name }}</div>
          </div>
          
          <div class="mb-4">
            <div class="text-caption text-grey">Location</div>
            <div>{{ event.location || 'Not specified' }}</div>
          </div>
          
          <div class="mb-4">
            <div class="text-caption text-grey">Date</div>
            <div>{{ formatDate(event.startDate) }}</div>
          </div>
        </v-col>
        
        <v-col cols="12" md="6">
          <div class="mb-4">
            <div class="text-caption text-grey">Status</div>
            <v-chip
              :color="getStatusColor(event.status)"
              size="small"
              class="mt-1"
            >
              {{ event.status.toUpperCase() }}
            </v-chip>
          </div>
          
          <div v-if="canManage && event.status !== 'cancelled'" class="mb-4">
            <div class="text-caption text-grey mb-2">Admin Actions</div>
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  color="primary"
                  variant="tonal"
                  size="small"
                  v-bind="props"
                  prepend-icon="mdi-cog"
                >
                  Change Status
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-if="event.status !== 'draft'"
                  @click="emit('change-status', 'draft')"
                >
                  <v-list-item-title>
                    <v-icon size="small" class="mr-2">mdi-file-document</v-icon>
                    Set to Draft
                  </v-list-item-title>
                </v-list-item>
                <v-list-item
                  v-if="event.status !== 'published'"
                  @click="emit('change-status', 'published')"
                >
                  <v-list-item-title>
                    <v-icon size="small" class="mr-2">mdi-publish</v-icon>
                    Publish Event
                  </v-list-item-title>
                </v-list-item>
                <v-list-item
                  v-if="event.status !== 'active'"
                  @click="emit('change-status', 'active')"
                >
                  <v-list-item-title>
                    <v-icon size="small" class="mr-2">mdi-play</v-icon>
                    Activate Event
                  </v-list-item-title>
                </v-list-item>
                <v-list-item
                  v-if="event.status !== 'completed'"
                  @click="emit('change-status', 'completed')"
                >
                  <v-list-item-title>
                    <v-icon size="small" class="mr-2">mdi-check-circle</v-icon>
                    Mark as Completed
                  </v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item
                  @click="emit('cancel-event')"
                >
                  <v-list-item-title class="text-error">
                    <v-icon size="small" class="mr-2">mdi-cancel</v-icon>
                    Cancel Event
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
          
          <div class="mb-4">
            <div class="text-caption text-grey">Total Capacity</div>
            <div class="text-h6">
              {{ event.numberOfRounds * event.discussionsPerRound * event.idealGroupSize }} participants
            </div>
            <div class="text-caption">
              {{ event.numberOfRounds }} rounds × {{ event.discussionsPerRound }} discussions × {{ event.idealGroupSize }} people
            </div>
          </div>
        </v-col>
      </v-row>
      
      <v-divider class="my-4" />
      
      <div v-if="participantStats">
        <h3 class="text-h6 mb-3">Participant Statistics</h3>
        
        <v-row>
          <v-col cols="6" sm="3">
            <v-card variant="tonal" color="blue">
              <v-card-text class="text-center">
                <div class="text-h4">{{ participantStats.total }}</div>
                <div class="text-caption">Total</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="6" sm="3">
            <v-card variant="tonal" color="orange">
              <v-card-text class="text-center">
                <div class="text-h4">{{ participantStats.registered }}</div>
                <div class="text-caption">Registered</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="6" sm="3">
            <v-card variant="tonal" color="green">
              <v-card-text class="text-center">
                <div class="text-h4">{{ participantStats.confirmed }}</div>
                <div class="text-caption">Confirmed</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="6" sm="3">
            <v-card variant="tonal" color="purple">
              <v-card-text class="text-center">
                <div class="text-h4">{{ participantStats.checkedIn }}</div>
                <div class="text-caption">Checked In</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-card-text>
  </v-card>
</template>

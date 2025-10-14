<script setup lang="ts">
import { computed } from 'vue'
import type { Event } from '~/types/event'

interface Props {
  events: Event[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

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

const sortedEvents = computed(() => {
  return [...props.events].sort((a, b) => {
    // Active events first, then by start date
    if (a.status === 'active' && b.status !== 'active') return -1
    if (a.status !== 'active' && b.status === 'active') return 1
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  })
})
</script>

<template>
  <v-container :class="$vuetify.display.smAndDown ? 'pa-2' : 'pa-4'">
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="mt-4 text-grey">Loading events...</p>
    </div>

    <div v-else-if="events.length === 0" class="text-center py-8">
      <v-icon size="64" color="grey">mdi-calendar-blank</v-icon>
      <p class="mt-4 text-grey">No events found</p>
    </div>

    <v-row v-else>
      <v-col
        v-for="event in sortedEvents"
        :key="event.id"
        cols="12"
        :md="$vuetify.display.mdAndUp ? '6' : '12'"
        :lg="$vuetify.display.lgAndUp ? '4' : '6'"
      >
        <v-card
          :elevation="$vuetify.display.smAndDown ? 1 : 2"
          hover
          :to="`/events/${event.id}`"
          class="h-100"
        >
          <v-card-title :class="$vuetify.display.smAndDown ? 'text-h6' : 'text-h5'">
            {{ event.name }}
          </v-card-title>

          <v-card-subtitle v-if="event.location">
            <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
            {{ event.location }}
          </v-card-subtitle>

          <v-card-text :class="$vuetify.display.smAndDown ? 'pa-3' : 'pa-4'">
            <div class="mb-2">
              <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
              <span class="text-body-2">{{ formatDate(event.startDate) }}</span>
            </div>

            <div v-if="event.description" class="mb-3 text-body-2">
              {{ event.description }}
            </div>

            <v-chip
              :color="getStatusColor(event.status)"
              size="small"
              class="mr-2"
            >
              {{ event.status.toUpperCase() }}
            </v-chip>

            <v-divider class="my-3" />

            <div class="text-caption text-grey">
              <div>{{ event.numberOfRounds }} rounds</div>
              <div>{{ event.discussionsPerRound }} discussions per round</div>
              <div>{{ event.idealGroupSize }} people per group</div>
            </div>
          </v-card-text>

          <v-card-actions :class="$vuetify.display.smAndDown ? 'pa-3' : 'pa-4'">
            <v-btn
              color="primary"
              variant="tonal"
              :block="$vuetify.display.smAndDown"
              :to="`/events/${event.id}`"
            >
              Manage Event
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

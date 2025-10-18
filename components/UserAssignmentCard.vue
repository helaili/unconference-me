<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Event } from '~/types/event'

interface EnrichedAssignment {
  id: string
  participantId: string
  topicId: string
  eventId: string
  roundNumber: number
  groupNumber: number
  assignmentMethod: 'manual' | 'automatic' | 'self-selected'
  status: 'assigned' | 'confirmed' | 'declined' | 'completed'
  createdAt: Date
  updatedAt: Date
  topic: {
    id: string
    title: string
    description?: string
  } | null
}

const loading = ref(false)
const error = ref<string | null>(null)
const events = ref<Event[]>([])
const assignmentsByEvent = ref<Map<string, EnrichedAssignment[]>>(new Map())

const fetchAssignments = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Fetch all events
    const eventsResponse = await $fetch('/api/events')
    if (!eventsResponse.success || !eventsResponse.events) {
      return
    }
    
    events.value = eventsResponse.events as Event[]
    
    // Fetch assignments for each event
    for (const event of events.value) {
      try {
        const response = await $fetch(`/api/events/${event.id}/assignments/me`)
        if (response.success && response.assignments) {
          assignmentsByEvent.value.set(event.id, response.assignments as EnrichedAssignment[])
        }
      } catch {
        // No assignments for this event yet
        console.log(`No assignments for event ${event.id}`)
      }
    }
  } catch (_err) {
    console.error('Error fetching assignments:', _err)
    error.value = 'Failed to load assignments'
  } finally {
    loading.value = false
  }
}

const eventsWithAssignments = computed(() => {
  return events.value.filter(event => {
    const assignments = assignmentsByEvent.value.get(event.id)
    return assignments && assignments.length > 0
  })
})

const getAssignmentsByRound = (eventId: string) => {
  const assignments = assignmentsByEvent.value.get(eventId) || []
  const grouped = new Map<number, EnrichedAssignment[]>()
  
  for (const assignment of assignments) {
    if (!grouped.has(assignment.roundNumber)) {
      grouped.set(assignment.roundNumber, [])
    }
    grouped.get(assignment.roundNumber)!.push(assignment)
  }
  
  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([round, items]) => ({
      round,
      assignments: items.sort((a, b) => a.groupNumber - b.groupNumber)
    }))
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    assigned: 'blue',
    confirmed: 'green',
    declined: 'red',
    completed: 'purple'
  }
  return colors[status] || 'grey'
}

const getStatusIcon = (status: string) => {
  const icons: Record<string, string> = {
    assigned: 'mdi-clipboard-text-outline',
    confirmed: 'mdi-check-circle',
    declined: 'mdi-close-circle',
    completed: 'mdi-check-all'
  }
  return icons[status] || 'mdi-help-circle'
}

onMounted(() => {
  fetchAssignments()
})
</script>

<template>
  <v-card 
    class="mb-6"
    :class="$vuetify.display.smAndDown ? 'mx-2' : ''"
  >
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" :size="$vuetify.display.smAndDown ? 'default' : 'large'">
        mdi-calendar-check
      </v-icon>
      <span :class="$vuetify.display.smAndDown ? 'text-h6' : 'text-h5'">
        Your Discussion Assignments
      </span>
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
      
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" size="32" />
        <p class="mt-2 text-body-2">Loading assignments...</p>
      </div>
      
      <div v-else-if="eventsWithAssignments.length === 0">
        <v-alert type="info" variant="tonal" icon="mdi-information">
          <div class="text-body-2">
            <p class="mb-2">
              <strong>No assignments yet.</strong>
            </p>
            <p class="mb-0">
              Assignments will appear here once the event organizers have run the assignment algorithm.
              Make sure to complete your topic rankings to get better assignments!
            </p>
          </div>
        </v-alert>
      </div>
      
      <div v-else>
        <v-expansion-panels 
          variant="accordion"
          :class="$vuetify.display.smAndDown ? 'mobile-panels' : ''"
        >
          <v-expansion-panel
            v-for="event in eventsWithAssignments"
            :key="event.id"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center flex-wrap">
                <v-icon 
                  icon="mdi-calendar-star" 
                  class="mr-2" 
                  :size="$vuetify.display.smAndDown ? 'small' : 'default'"
                />
                <span :class="$vuetify.display.smAndDown ? 'text-body-2 font-weight-medium' : 'font-weight-medium'">
                  {{ event.name }}
                </span>
                <v-chip 
                  size="small" 
                  :class="$vuetify.display.smAndDown ? 'ml-2' : 'ml-3'"
                  color="primary"
                  variant="tonal"
                >
                  {{ assignmentsByEvent.get(event.id)?.length || 0 }} discussions
                </v-chip>
              </div>
            </v-expansion-panel-title>
            
            <v-expansion-panel-text>
              <div 
                v-for="{ round, assignments: roundAssignments } in getAssignmentsByRound(event.id)"
                :key="round"
                class="mb-4"
              >
                <v-card variant="outlined" :class="$vuetify.display.smAndDown ? 'pa-2' : 'pa-3'">
                  <div class="d-flex align-center mb-3">
                    <v-icon 
                      icon="mdi-numeric-{{ round }}-circle" 
                      :color="'primary'"
                      class="mr-2"
                      :size="$vuetify.display.smAndDown ? 'small' : 'default'"
                    />
                    <span :class="$vuetify.display.smAndDown ? 'text-body-2 font-weight-bold' : 'text-h6 font-weight-medium'">
                      Round {{ round }}
                    </span>
                  </div>
                  
                  <v-list :density="$vuetify.display.smAndDown ? 'compact' : 'default'">
                    <v-list-item
                      v-for="assignment in roundAssignments"
                      :key="assignment.id"
                      :class="$vuetify.display.smAndDown ? 'px-0' : 'px-2'"
                    >
                      <template #prepend>
                        <v-avatar
                          :color="getStatusColor(assignment.status)"
                          :size="$vuetify.display.smAndDown ? 32 : 40"
                        >
                          <v-icon 
                            :icon="getStatusIcon(assignment.status)"
                            :size="$vuetify.display.smAndDown ? 'small' : 'default'"
                            color="white"
                          />
                        </v-avatar>
                      </template>
                      
                      <v-list-item-title :class="$vuetify.display.smAndDown ? 'text-body-2' : ''">
                        <strong>{{ assignment.topic?.title || 'Unknown Topic' }}</strong>
                      </v-list-item-title>
                      
                      <v-list-item-subtitle :class="$vuetify.display.smAndDown ? 'text-caption' : 'text-body-2'">
                        <div v-if="assignment.topic?.description" class="mb-1">
                          {{ assignment.topic.description }}
                        </div>
                        <div class="d-flex align-center flex-wrap mt-1">
                          <v-chip 
                            size="x-small" 
                            variant="outlined" 
                            class="mr-1 mb-1"
                          >
                            <v-icon icon="mdi-account-group" size="x-small" class="mr-1" />
                            Group {{ assignment.groupNumber }}
                          </v-chip>
                          <v-chip
                            :color="getStatusColor(assignment.status)"
                            size="x-small"
                            variant="flat"
                            class="mb-1"
                          >
                            {{ assignment.status }}
                          </v-chip>
                        </div>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.mobile-panels :deep(.v-expansion-panel-title) {
  min-height: 48px !important;
  padding: 8px 12px !important;
}

.mobile-panels :deep(.v-expansion-panel-text__wrapper) {
  padding: 8px 12px !important;
}
</style>

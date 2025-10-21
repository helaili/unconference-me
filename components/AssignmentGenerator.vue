<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Event } from '~/types/event'

interface Props {
  event: Event
}

const props = defineProps<Props>()
const emit = defineEmits<{
  refresh: []
}>()

const generating = ref(false)
const clearing = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const confirmClearDialog = ref(false)
const statistics = ref<{
  totalParticipants: number
  totalAssignments: number
  participantsFullyAssigned: number
  participantsPartiallyAssigned: number
  participantsNotAssigned: number
  topicsUsed: number
  averageGroupSize: number
  roundStatistics: Array<{
    roundNumber: number
    topicsScheduled: number
    participantsAssigned: number
    groupSizes: number[]
    averageGroupSize: number
  }>
  preferredChoiceDistribution?: {
    distribution: Record<number, number>
    totalParticipantsWithRankings: number
  }
  sortedChoiceDistribution?: {
    distribution: Record<number, number>
    totalParticipantsWithRankings: number
    minTopicsToRank: number
  }
  topicOccurrenceDistribution?: {
    totalTopicsPlanned: number
    distribution: Record<number, number>
  }
} | null>(null)
const warnings = ref<string[]>([])

const canGenerate = computed(() => {
  return props.event.settings?.enableAutoAssignment === true
})

// Load existing statistics on mount
const loadStatistics = async () => {
  try {
    const response = await $fetch(`/api/events/${props.event.id}/assignments`)
    
    if (response.success && response.statistics) {
      statistics.value = response.statistics
    }
  } catch (err) {
    console.error('Error loading statistics:', err)
    // Don't show error to user - statistics are optional
  }
}

const generateAssignments = async () => {
  if (!canGenerate.value) {
    error.value = 'Automatic assignment is not enabled for this event. Enable it in event settings first.'
    return
  }

  generating.value = true
  error.value = null
  successMessage.value = null
  statistics.value = null
  warnings.value = []

  try {
    const response = await $fetch(`/api/events/${props.event.id}/assignments/generate`, {
      method: 'POST'
    })

    if (response.success) {
      successMessage.value = `Successfully generated ${response.assignments.length} assignments!`
      statistics.value = response.statistics
      warnings.value = response.warnings || []
      
      // Emit refresh event to reload assignments
      emit('refresh')
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        successMessage.value = null
      }, 5000)
    }
  } catch (err: unknown) {
    console.error('Error generating assignments:', err)
    error.value = (err as { data?: { message?: string } })?.data?.message || 'Failed to generate assignments'
  } finally {
    generating.value = false
  }
}

const clearAssignments = async () => {
  clearing.value = true
  error.value = null
  successMessage.value = null
  confirmClearDialog.value = false

  try {
    const response = await $fetch(`/api/events/${props.event.id}/assignments/clear`, {
      method: 'DELETE'
    })

    if (response.success) {
      successMessage.value = response.message
      statistics.value = null
      warnings.value = []
      
      // Emit refresh event to reload assignments
      emit('refresh')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    }
  } catch (err: unknown) {
    console.error('Error clearing assignments:', err)
    error.value = (err as { data?: { message?: string } })?.data?.message || 'Failed to clear assignments'
  } finally {
    clearing.value = false
  }
}

// Load statistics when component mounts
onMounted(() => {
  loadStatistics()
})
</script>

<template>
  <v-card 
    class="mb-6"
    :class="$vuetify.display.smAndDown ? 'mx-2' : ''"
  >
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-robot</v-icon>
      <span :class="$vuetify.display.smAndDown ? 'text-h6' : ''">
        Assignment Generator
      </span>
      <v-spacer />
      <v-chip
        v-if="!canGenerate"
        color="warning"
        size="small"
        variant="flat"
      >
        <v-icon icon="mdi-alert" size="small" class="mr-1" />
        Disabled
      </v-chip>
    </v-card-title>
    
    <v-card-text :class="$vuetify.display.smAndDown ? 'pa-3' : ''">
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
      
      <v-alert
        v-if="warnings.length > 0"
        type="warning"
        variant="tonal"
        closable
        class="mb-4"
      >
        <div class="text-body-2">
          <strong>Assignment Warnings:</strong>
          <ul class="mt-2 ml-4">
            <li v-for="(warning, index) in warnings" :key="index">
              {{ warning }}
            </li>
          </ul>
        </div>
      </v-alert>
      
      <v-alert
        v-if="!canGenerate"
        type="info"
        variant="tonal"
        class="mb-4"
      >
        <div class="text-body-2">
          <p class="mb-2">
            <strong>Automatic assignment is not enabled for this event.</strong>
          </p>
          <p class="mb-0">
            Enable it in the event settings to use the assignment generator.
          </p>
        </div>
      </v-alert>
      
      <div class="text-body-2 mb-4">
        <p class="mb-2">
          The assignment generator automatically assigns participants to discussion topics based on:
        </p>
        <ul class="ml-4">
          <li>Participant topic rankings (highest preference first)</li>
          <li>Event configuration ({{ event.numberOfRounds }} rounds, {{ event.discussionsPerRound }} discussions per round)</li>
          <li>Group size constraints (min: {{ event.minGroupSize }}, ideal: {{ event.idealGroupSize }}, max: {{ event.maxGroupSize }})</li>
          <li>Random assignment fallback for unranked topics</li>
        </ul>
      </div>
      
      <div 
        v-if="statistics"
        class="mb-4"
      >
        <v-card variant="outlined">
          <v-card-title :class="$vuetify.display.smAndDown ? 'text-body-1' : 'text-h6'">
            <v-icon icon="mdi-chart-bar" class="mr-2" />
            Assignment Statistics
          </v-card-title>
          <v-card-text>
            <v-row :dense="$vuetify.display.smAndDown">
              <v-col cols="12" sm="6" md="3">
                <v-card variant="tonal" color="primary">
                  <v-card-text :class="$vuetify.display.smAndDown ? 'pa-2' : ''">
                    <div :class="$vuetify.display.smAndDown ? 'text-h6' : 'text-h5'">
                      {{ statistics.totalAssignments }}
                    </div>
                    <div :class="$vuetify.display.smAndDown ? 'text-caption' : 'text-body-2'">
                      Total Assignments
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-card variant="tonal" color="success">
                  <v-card-text :class="$vuetify.display.smAndDown ? 'pa-2' : ''">
                    <div :class="$vuetify.display.smAndDown ? 'text-h6' : 'text-h5'">
                      {{ statistics.participantsFullyAssigned }}
                    </div>
                    <div :class="$vuetify.display.smAndDown ? 'text-caption' : 'text-body-2'">
                      Fully Assigned
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-card variant="tonal" color="info">
                  <v-card-text :class="$vuetify.display.smAndDown ? 'pa-2' : ''">
                    <div :class="$vuetify.display.smAndDown ? 'text-h6' : 'text-h5'">
                      {{ statistics.topicsUsed }}
                    </div>
                    <div :class="$vuetify.display.smAndDown ? 'text-caption' : 'text-body-2'">
                      Topics Used
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-card variant="tonal" color="secondary">
                  <v-card-text :class="$vuetify.display.smAndDown ? 'pa-2' : ''">
                    <div :class="$vuetify.display.smAndDown ? 'text-h6' : 'text-h5'">
                      {{ statistics.averageGroupSize.toFixed(1) }}
                    </div>
                    <div :class="$vuetify.display.smAndDown ? 'text-caption' : 'text-body-2'">
                      Avg Group Size
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            
            <div v-if="statistics.roundStatistics" class="mt-4">
              <v-divider class="mb-3" />
              <div :class="$vuetify.display.smAndDown ? 'text-body-2 font-weight-bold' : 'text-subtitle-1 font-weight-medium'" class="mb-2">
                Round Details
              </div>
              <v-expansion-panels variant="accordion">
                <v-expansion-panel
                  v-for="round in statistics.roundStatistics"
                  :key="round.roundNumber"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-numeric-{{ round.roundNumber }}-circle" class="mr-2" />
                      Round {{ round.roundNumber }}
                      <v-chip size="small" class="ml-3" variant="tonal">
                        {{ round.participantsAssigned }} participants
                      </v-chip>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div :class="$vuetify.display.smAndDown ? 'text-body-2' : ''">
                      <p><strong>Topics Scheduled:</strong> {{ round.topicsScheduled }}</p>
                      <p><strong>Average Group Size:</strong> {{ round.averageGroupSize.toFixed(1) }}</p>
                      <p><strong>Group Sizes:</strong> {{ round.groupSizes.join(', ') }}</p>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
            
            <!-- Preferred Choice Distribution -->
            <div v-if="statistics.preferredChoiceDistribution && statistics.preferredChoiceDistribution.totalParticipantsWithRankings > 0" class="mt-4">
              <v-divider class="mb-3" />
              <div :class="$vuetify.display.smAndDown ? 'text-body-2 font-weight-bold' : 'text-subtitle-1 font-weight-medium'" class="mb-2">
                <v-icon icon="mdi-trophy" size="small" class="mr-2" />
                Preferred Choice Success
              </div>
              <p :class="$vuetify.display.smAndDown ? 'text-caption' : 'text-body-2'" class="mb-3 text-medium-emphasis">
                Distribution of participants by how many of their top {{ event.numberOfRounds }} preferred topics they were assigned to.
              </p>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th class="text-left">Top Preferences Assigned</th>
                    <th class="text-right">Participants</th>
                    <th class="text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="count in Object.keys(statistics.preferredChoiceDistribution.distribution).map(Number).sort((a, b) => b - a)"
                    :key="count"
                  >
                    <td>
                      <v-chip 
                        size="small" 
                        :color="count === event.numberOfRounds ? 'success' : count >= event.numberOfRounds / 2 ? 'info' : 'warning'"
                        variant="tonal"
                      >
                        {{ count }} of {{ event.numberOfRounds }}
                      </v-chip>
                    </td>
                    <td class="text-right">{{ statistics.preferredChoiceDistribution.distribution[count] }}</td>
                    <td class="text-right">
                      {{ ((statistics.preferredChoiceDistribution.distribution[count] / statistics.preferredChoiceDistribution.totalParticipantsWithRankings) * 100).toFixed(1) }}%
                    </td>
                  </tr>
                </tbody>
              </v-table>
              <p :class="$vuetify.display.smAndDown ? 'text-caption' : 'text-body-2'" class="mt-2 text-medium-emphasis">
                Based on {{ statistics.preferredChoiceDistribution.totalParticipantsWithRankings }} participants with rankings
              </p>
            </div>
            
            <!-- Sorted Choice Distribution -->
            <div v-if="statistics.sortedChoiceDistribution && statistics.sortedChoiceDistribution.totalParticipantsWithRankings > 0" class="mt-4">
              <v-divider class="mb-3" />
              <div :class="$vuetify.display.smAndDown ? 'text-body-2 font-weight-bold' : 'text-subtitle-1 font-weight-medium'" class="mb-2">
                <v-icon icon="mdi-sort-ascending" size="small" class="mr-2" />
                Sorted Choice Success
              </div>
              <p :class="$vuetify.display.smAndDown ? 'text-caption' : 'text-body-2'" class="mb-3 text-medium-emphasis">
                Distribution of participants by how many of their {{ statistics.sortedChoiceDistribution.minTopicsToRank }} sorted topics they were assigned to (out of {{ event.numberOfRounds }} rounds).
              </p>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th class="text-left">Sorted Topics Assigned</th>
                    <th class="text-right">Participants</th>
                    <th class="text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="count in Object.keys(statistics.sortedChoiceDistribution.distribution).map(Number).sort((a, b) => b - a)"
                    :key="count"
                  >
                    <td>
                      <v-chip 
                        size="small" 
                        :color="count === event.numberOfRounds ? 'success' : count >= event.numberOfRounds / 2 ? 'info' : 'warning'"
                        variant="tonal"
                      >
                        {{ count }} of {{ event.numberOfRounds }}
                      </v-chip>
                    </td>
                    <td class="text-right">{{ statistics.sortedChoiceDistribution.distribution[count] }}</td>
                    <td class="text-right">
                      {{ ((statistics.sortedChoiceDistribution.distribution[count] / statistics.sortedChoiceDistribution.totalParticipantsWithRankings) * 100).toFixed(1) }}%
                    </td>
                  </tr>
                </tbody>
              </v-table>
              <p :class="$vuetify.display.smAndDown ? 'text-caption' : 'text-body-2'" class="mt-2 text-medium-emphasis">
                Based on {{ statistics.sortedChoiceDistribution.totalParticipantsWithRankings }} participants with rankings
              </p>
            </div>
            
            <!-- Topic Occurrence Distribution -->
            <div v-if="statistics.topicOccurrenceDistribution && statistics.topicOccurrenceDistribution.totalTopicsPlanned > 0" class="mt-4">
              <v-divider class="mb-3" />
              <div :class="$vuetify.display.smAndDown ? 'text-body-2 font-weight-bold' : 'text-subtitle-1 font-weight-medium'" class="mb-2">
                <v-icon icon="mdi-chart-bar" size="small" class="mr-2" />
                Topic Schedule Distribution
              </div>
              <p :class="$vuetify.display.smAndDown ? 'text-caption' : 'text-body-2'" class="mb-3 text-medium-emphasis">
                Distribution of topics by how many times they are scheduled across rounds.
              </p>
              <v-row :dense="$vuetify.display.smAndDown" class="mb-3">
                <v-col cols="12" sm="6">
                  <v-card variant="tonal" color="primary">
                    <v-card-text :class="$vuetify.display.smAndDown ? 'pa-2' : ''">
                      <div :class="$vuetify.display.smAndDown ? 'text-h6' : 'text-h5'">
                        {{ statistics.topicOccurrenceDistribution.totalTopicsPlanned }}
                      </div>
                      <div :class="$vuetify.display.smAndDown ? 'text-caption' : 'text-body-2'">
                        Total Topics Planned
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th class="text-left">Times Scheduled</th>
                    <th class="text-right">Number of Topics</th>
                    <th class="text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="occurrence in Object.keys(statistics.topicOccurrenceDistribution.distribution).map(Number).sort((a, b) => b - a)"
                    :key="occurrence"
                  >
                    <td>
                      <v-chip 
                        size="small" 
                        :color="occurrence > 1 ? 'success' : 'info'"
                        variant="tonal"
                      >
                        {{ occurrence }} {{ occurrence === 1 ? 'time' : 'times' }}
                      </v-chip>
                    </td>
                    <td class="text-right">{{ statistics.topicOccurrenceDistribution.distribution[occurrence] }}</td>
                    <td class="text-right">
                      {{ ((statistics.topicOccurrenceDistribution.distribution[occurrence] / statistics.topicOccurrenceDistribution.totalTopicsPlanned) * 100).toFixed(1) }}%
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </v-card-text>
    
    <v-card-actions :class="['flex-column flex-sm-row', $vuetify.display.smAndDown ? 'pa-3' : '']">
      <v-spacer />
      <v-btn
        variant="outlined"
        color="error"
        :block="$vuetify.display.smAndDown"
        :class="$vuetify.display.smAndDown ? 'mb-2' : 'mr-2'"
        :disabled="clearing"
        @click="confirmClearDialog = true"
      >
        <v-icon icon="mdi-delete" class="mr-2" />
        Clear Assignments
      </v-btn>
      <v-btn
        color="primary"
        :block="$vuetify.display.smAndDown"
        :disabled="!canGenerate || generating"
        :loading="generating"
        @click="generateAssignments"
      >
        <v-icon icon="mdi-robot" class="mr-2" />
        Generate Assignments
      </v-btn>
    </v-card-actions>
    
    <!-- Confirm Clear Dialog -->
    <v-dialog v-model="confirmClearDialog" max-width="500">
      <v-card>
        <v-card-title>
          <v-icon icon="mdi-alert" color="warning" class="mr-2" />
          Confirm Clear Assignments
        </v-card-title>
        <v-card-text>
          <p>
            Are you sure you want to clear all assignments for this event?
            This action cannot be undone.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="confirmClearDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="clearing"
            @click="clearAssignments"
          >
            Clear Assignments
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

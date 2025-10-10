<script setup lang="ts">
import type { ParticipantAssignment } from '~/types/participant'

interface Props {
  assignments: ParticipantAssignment[]
  loading?: boolean
}

defineProps<Props>()

const getStatusColor = (status: ParticipantAssignment['status']) => {
  const colors = {
    assigned: 'blue',
    confirmed: 'green',
    declined: 'red',
    completed: 'purple'
  }
  return colors[status] || 'grey'
}

const getMethodIcon = (method: ParticipantAssignment['assignmentMethod']) => {
  const icons = {
    manual: 'mdi-hand-back-right',
    automatic: 'mdi-robot',
    'self-selected': 'mdi-account-check'
  }
  return icons[method] || 'mdi-help'
}

// Group assignments by round
const assignmentsByRound = (assignments: ParticipantAssignment[]) => {
  const grouped = new Map<number, ParticipantAssignment[]>()
  
  for (const assignment of assignments) {
    const round = assignment.roundNumber
    if (!grouped.has(round)) {
      grouped.set(round, [])
    }
    grouped.get(round)!.push(assignment)
  }
  
  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([round, items]) => ({
      round,
      assignments: items.sort((a, b) => a.groupNumber - b.groupNumber)
    }))
}

const headers = [
  { title: 'Participant', key: 'participantId', sortable: false },
  { title: 'Topic', key: 'topicId', sortable: false },
  { title: 'Group', key: 'groupNumber', sortable: true },
  { title: 'Method', key: 'assignmentMethod', sortable: false },
  { title: 'Status', key: 'status', sortable: false }
]
</script>

<template>
  <v-card>
    <v-card-title>Current Assignments</v-card-title>
    
    <v-card-text>
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" />
      </div>
      
      <div v-else-if="assignments.length === 0" class="text-center py-4 text-grey">
        No assignments yet
      </div>
      
      <div v-else>
        <v-expansion-panels variant="accordion">
          <v-expansion-panel
            v-for="{ round, assignments: roundAssignments } in assignmentsByRound(assignments)"
            :key="round"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-icon icon="mdi-clock-outline" class="mr-2" />
                <span class="font-weight-medium">Round {{ round }}</span>
                <v-chip size="small" class="ml-3">
                  {{ roundAssignments.length }} assignments
                </v-chip>
              </div>
            </v-expansion-panel-title>
            
            <v-expansion-panel-text>
              <v-data-table
                :headers="headers"
                :items="roundAssignments"
                density="compact"
                :items-per-page="10"
              >
                <template #item.participantId="{ item }">
                  <span class="text-caption">{{ item.participantId }}</span>
                </template>
                
                <template #item.topicId="{ item }">
                  <span class="text-caption">{{ item.topicId }}</span>
                </template>
                
                <template #item.groupNumber="{ item }">
                  <v-chip size="small" variant="tonal">
                    Group {{ item.groupNumber }}
                  </v-chip>
                </template>
                
                <template #item.assignmentMethod="{ item }">
                  <v-tooltip location="top">
                    <template #activator="{ props: tooltipProps }">
                      <v-icon
                        :icon="getMethodIcon(item.assignmentMethod)"
                        v-bind="tooltipProps"
                        size="small"
                      />
                    </template>
                    <span>{{ item.assignmentMethod }}</span>
                  </v-tooltip>
                </template>
                
                <template #item.status="{ item }">
                  <v-chip
                    :color="getStatusColor(item.status)"
                    size="small"
                    variant="flat"
                  >
                    {{ item.status }}
                  </v-chip>
                </template>
              </v-data-table>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </v-card-text>
  </v-card>
</template>

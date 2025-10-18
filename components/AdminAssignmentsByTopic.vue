<script setup lang="ts">
import { computed } from 'vue'
import type { ParticipantAssignment } from '~/types/participant'
import type { Topic } from '~/types/topic'
import type { Participant } from '~/types/participant'

interface Props {
  assignments: ParticipantAssignment[]
  topics: Topic[]
  participants: Participant[]
  loading?: boolean
  numberOfRounds: number
}

const props = defineProps<Props>()

// Create lookup maps for efficient data access
const topicMap = computed(() => {
  const map = new Map<string, Topic>()
  for (const topic of props.topics) {
    map.set(topic.id, topic)
  }
  return map
})

const participantMap = computed(() => {
  const map = new Map<string, Participant>()
  for (const participant of props.participants) {
    map.set(participant.id, participant)
  }
  return map
})

// Group assignments by round and topic
interface TopicAssignmentGroup {
  topic: Topic
  groupNumber: number
  participants: Array<{
    participant: Participant
    assignment: ParticipantAssignment
  }>
}

interface RoundAssignments {
  round: number
  topicGroups: TopicAssignmentGroup[]
}

const assignmentsByRound = computed((): RoundAssignments[] => {
  // Initialize structure for all rounds
  const rounds: RoundAssignments[] = []
  
  for (let i = 1; i <= props.numberOfRounds; i++) {
    rounds.push({
      round: i,
      topicGroups: []
    })
  }
  
  // Group assignments by round and topic
  const roundMap = new Map<number, Map<string, Map<number, ParticipantAssignment[]>>>()
  
  for (const assignment of props.assignments) {
    const round = assignment.roundNumber
    const topicId = assignment.topicId
    const groupNumber = assignment.groupNumber
    
    if (!roundMap.has(round)) {
      roundMap.set(round, new Map())
    }
    
    const topicMap = roundMap.get(round)!
    if (!topicMap.has(topicId)) {
      topicMap.set(topicId, new Map())
    }
    
    const groupMap = topicMap.get(topicId)!
    if (!groupMap.has(groupNumber)) {
      groupMap.set(groupNumber, [])
    }
    
    groupMap.get(groupNumber)!.push(assignment)
  }
  
  // Convert to structured format
  for (const [roundNum, topicGroups] of roundMap.entries()) {
    const roundData = rounds.find(r => r.round === roundNum)
    if (!roundData) continue
    
    for (const [topicId, groupMap] of topicGroups.entries()) {
      const topic = topicMap.value.get(topicId)
      if (!topic) continue
      
      for (const [groupNumber, assignments] of groupMap.entries()) {
        const participants = assignments
          .map(assignment => {
            const participant = participantMap.value.get(assignment.participantId)
            return participant ? { participant, assignment } : null
          })
          .filter((p): p is { participant: Participant; assignment: ParticipantAssignment } => p !== null)
          .sort((a, b) => a.participant.lastname.localeCompare(b.participant.lastname))
        
        roundData.topicGroups.push({
          topic,
          groupNumber,
          participants
        })
      }
    }
    
    // Sort topic groups by topic title
    roundData.topicGroups.sort((a, b) => {
      const titleCompare = a.topic.title.localeCompare(b.topic.title)
      if (titleCompare !== 0) return titleCompare
      return a.groupNumber - b.groupNumber
    })
  }
  
  return rounds
})

const getStatusColor = (status: ParticipantAssignment['status']) => {
  const colors = {
    assigned: 'blue',
    confirmed: 'green',
    declined: 'red',
    completed: 'purple'
  }
  return colors[status] || 'grey'
}

const getTopicStatusColor = (status: Topic['status']) => {
  const colors = {
    proposed: 'grey',
    approved: 'green',
    scheduled: 'blue',
    completed: 'teal',
    rejected: 'red'
  }
  return colors[status] || 'grey'
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-format-list-bulleted" class="mr-2" />
      Assignments by Topic
    </v-card-title>
    
    <v-card-text>
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" />
      </div>
      
      <div v-else-if="assignments.length === 0" class="text-center py-4 text-grey">
        No assignments yet
      </div>
      
      <div v-else>
        <v-expansion-panels variant="accordion" multiple>
          <v-expansion-panel
            v-for="roundData in assignmentsByRound"
            :key="roundData.round"
            :value="roundData.round"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-icon icon="mdi-clock-outline" class="mr-2" />
                <span class="font-weight-medium">Round {{ roundData.round }}</span>
                <v-chip size="small" class="ml-3" color="primary" variant="tonal">
                  {{ roundData.topicGroups.length }} {{ roundData.topicGroups.length === 1 ? 'topic' : 'topics' }}
                </v-chip>
              </div>
            </v-expansion-panel-title>
            
            <v-expansion-panel-text>
              <div v-if="roundData.topicGroups.length === 0" class="text-center py-4 text-grey">
                No topics assigned for this round
              </div>
              
              <v-list v-else density="compact" class="py-0">
                <template
                  v-for="(topicGroup, index) in roundData.topicGroups"
                  :key="`${topicGroup.topic.id}-${topicGroup.groupNumber}`"
                >
                  <v-divider v-if="index > 0" class="my-2" />
                  
                  <v-list-item class="px-0">
                    <v-card variant="outlined" class="w-100">
                      <v-card-title class="d-flex align-center flex-wrap">
                        <v-tooltip location="bottom">
                          <template #activator="{ props: tooltipProps }">
                            <span class="flex-grow-1 text-truncate mr-2" v-bind="tooltipProps">
                              {{ topicGroup.topic.title }}
                            </span>
                          </template>
                          {{ topicGroup.topic.title }}
                        </v-tooltip>
                        
                        <div class="d-flex align-center flex-wrap gap-2">
                          <v-chip
                            :color="getTopicStatusColor(topicGroup.topic.status)"
                            size="small"
                            variant="flat"
                          >
                            {{ topicGroup.topic.status }}
                          </v-chip>
                          
                          <v-chip
                            size="small"
                            variant="tonal"
                            color="blue"
                          >
                            Group {{ topicGroup.groupNumber }}
                          </v-chip>
                          
                          <v-chip
                            size="small"
                            variant="tonal"
                            color="green"
                          >
                            {{ topicGroup.participants.length }} {{ topicGroup.participants.length === 1 ? 'participant' : 'participants' }}
                          </v-chip>
                        </div>
                      </v-card-title>
                      
                      <v-card-text v-if="topicGroup.topic.description" class="text-caption text-grey">
                        {{ topicGroup.topic.description }}
                      </v-card-text>
                      
                      <v-card-text>
                        <div class="text-subtitle-2 mb-2">Participants:</div>
                        <v-list density="compact" class="bg-transparent">
                          <v-list-item
                            v-for="({ participant, assignment }) in topicGroup.participants"
                            :key="assignment.id"
                            class="px-2"
                          >
                            <template #prepend>
                              <v-avatar
                                color="primary"
                                size="32"
                                class="mr-2"
                              >
                                <span class="text-caption">
                                  {{ participant.firstname[0] }}{{ participant.lastname[0] }}
                                </span>
                              </v-avatar>
                            </template>
                            
                            <v-list-item-title>
                              {{ participant.firstname }} {{ participant.lastname }}
                            </v-list-item-title>
                            
                            <v-list-item-subtitle class="text-caption">
                              {{ participant.email }}
                            </v-list-item-subtitle>
                            
                            <template #append>
                              <v-chip
                                :color="getStatusColor(assignment.status)"
                                size="x-small"
                                variant="flat"
                              >
                                {{ assignment.status }}
                              </v-chip>
                            </template>
                          </v-list-item>
                        </v-list>
                      </v-card-text>
                    </v-card>
                  </v-list-item>
                </template>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </v-card-text>
  </v-card>
</template>

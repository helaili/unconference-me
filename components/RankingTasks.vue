<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Event } from '~/types/event'
import type { Participant } from '~/types/participant'
import type { Topic } from '~/types/topic'
import type { TopicRanking } from '~/types/topicRanking'

interface RankingTask {
  event: Event
  participant: Participant
  ranking: TopicRanking | null
  topics: Topic[]
  newTopicsCount: number
  isComplete: boolean
  needsAttention: boolean
}

const tasks = ref<RankingTask[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const { user } = useUserSession()

const fetchRankingTasks = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Fetch all events
    const eventsResponse = await $fetch('/api/events')
    if (!eventsResponse.success || !eventsResponse.events) {
      return
    }
    
    const events = eventsResponse.events as Event[]
    
    // Process each event
    for (const event of events) {
      // Skip if ranking is not enabled
      if (!event.settings?.enableTopicRanking) continue
      
      // Fetch participants to find current user
      const participantsResponse = await $fetch(`/api/events/${event.id}/participants`)
      if (!participantsResponse.success || !participantsResponse.participants) continue
      
      const participants = participantsResponse.participants as Participant[]
      const participant = participants.find(p => p.email === user.value?.email)
      
      if (!participant) continue
      
      // Fetch topics
      const topicsResponse = await $fetch(`/api/events/${event.id}/topics`)
      if (!topicsResponse.success) continue
      
      const topics = (topicsResponse.topics as Topic[]).filter(
        t => t.status === 'approved' || t.proposedBy === participant.id
      )
      
      // Fetch ranking
      let ranking: TopicRanking | null = null
      try {
        const rankingResponse = await $fetch(`/api/events/${event.id}/rankings`)
        if (rankingResponse.success && rankingResponse.ranking) {
          ranking = rankingResponse.ranking as TopicRanking
        }
      } catch (err) {
        // No ranking exists yet
      }
      
      // Calculate new topics count
      let newTopicsCount = 0
      if (ranking?.lastViewedAt) {
        const lastViewed = new Date(ranking.lastViewedAt)
        newTopicsCount = topics.filter(t => {
          const created = new Date(t.createdAt)
          const updated = new Date(t.updatedAt)
          return created > lastViewed || updated > lastViewed
        }).length
      } else if (topics.length > 0) {
        // If never viewed, all topics are new
        newTopicsCount = topics.length
      }
      
      // Determine if task is complete
      const minRanking = event.settings?.minTopicsToRank || 3
      const isComplete = ranking?.rankedTopicIds && ranking.rankedTopicIds.length >= minRanking
      
      // Task needs attention if incomplete or there are new topics
      const needsAttention = !isComplete || newTopicsCount > 0
      
      tasks.value.push({
        event,
        participant,
        ranking,
        topics,
        newTopicsCount,
        isComplete: isComplete || false,
        needsAttention
      })
    }
  } catch (err) {
    console.error('Error fetching ranking tasks:', err)
    error.value = 'Failed to load ranking tasks'
  } finally {
    loading.value = false
  }
}

const hasPendingTasks = computed(() => {
  return tasks.value.some(t => t.needsAttention)
})

onMounted(() => {
  fetchRankingTasks()
})
</script>

<template>
  <v-card class="mb-6">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-sort</v-icon>
      Topic Ranking Tasks
      <v-chip 
        v-if="hasPendingTasks && !loading"
        color="warning"
        size="small"
        class="ml-2"
      >
        Action Required
      </v-chip>
    </v-card-title>
    
    <v-card-text>
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
      </div>
      
      <div v-else-if="tasks.length === 0">
        <v-alert type="info" variant="tonal">
          No ranking tasks available. Topic ranking may not be enabled for your events.
        </v-alert>
      </div>
      
      <v-list v-else>
        <v-list-item
          v-for="task in tasks"
          :key="task.event.id"
          :to="`/rankings/${task.event.id}`"
          :class="{ 'needs-attention': task.needsAttention }"
        >
          <template #prepend>
            <v-icon
              :color="task.isComplete ? 'success' : 'warning'"
            >
              {{ task.isComplete ? 'mdi-check-circle' : 'mdi-alert-circle' }}
            </v-icon>
          </template>
          
          <v-list-item-title>
            {{ task.event.name }}
          </v-list-item-title>
          
          <v-list-item-subtitle>
            <div v-if="!task.isComplete">
              <v-icon size="small" class="mr-1">mdi-alert</v-icon>
              Please rank at least {{ task.event.settings?.minTopicsToRank || 3 }} topics
            </div>
            <div v-else-if="task.newTopicsCount > 0">
              <v-icon size="small" class="mr-1">mdi-new-box</v-icon>
              {{ task.newTopicsCount }} new or updated topic{{ task.newTopicsCount !== 1 ? 's' : '' }} since your last visit
            </div>
            <div v-else>
              <v-icon size="small" class="mr-1">mdi-check</v-icon>
              Ranking complete
            </div>
          </v-list-item-subtitle>
          
          <template #append>
            <v-btn
              variant="text"
              color="primary"
              size="small"
            >
              {{ task.isComplete ? 'Update' : 'Rank' }}
            </v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.v-list-item.needs-attention {
  border-left: 4px solid rgb(var(--v-theme-warning));
  background-color: rgba(var(--v-theme-warning), 0.05);
}
</style>

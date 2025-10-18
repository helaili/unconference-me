<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Event } from '~/types/event'
import type { Participant } from '~/types/participant'
import type { Topic } from '~/types/topic'
import type { TopicRanking } from '~/types/topicRanking'

interface EventRankings {
  event: Event
  participant: Participant
  ranking: TopicRanking | null
  topRankedTopics: Topic[]
  minRanking: number
}

const emit = defineEmits<{
  hasRankings: [hasRankings: boolean]
}>()

const eventRankings = ref<EventRankings[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const fetchUserTopRankings = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Fetch all events
    const eventsResponse = await $fetch('/api/events')
    if (!eventsResponse.success || !eventsResponse.events) {
      return
    }
    
    const events = eventsResponse.events as unknown as Event[]
    
    // Process each event
    for (const event of events) {
      // Skip if ranking is not enabled
      if (!event.settings?.enableTopicRanking) continue
      
      // Fetch current user's participant record for this event
      let participant: Participant | null = null
      try {
        const participantResponse: any = await $fetch(`/api/events/${event.id}/participants/me`)
        if (participantResponse.success && participantResponse.participant) {
          participant = participantResponse.participant as Participant
        }
      } catch (err) {
        // User is not a participant for this event
        continue
      }
      
      if (!participant) continue
      
      // Fetch ranking
      let ranking: TopicRanking | null = null
      try {
        const rankingResponse = await $fetch(`/api/events/${event.id}/rankings`)
        if (rankingResponse.success && rankingResponse.ranking) {
          ranking = rankingResponse.ranking as unknown as TopicRanking
        }
      } catch (err) {
        // No ranking exists yet
        continue
      }
      
      // Skip if no ranking or no ranked topics
      if (!ranking || !ranking.rankedTopicIds || ranking.rankedTopicIds.length === 0) {
        continue
      }
      
      // Get minRanking from event settings
      const minRanking = event.settings?.minTopicsToRank || 6
      
      // Get the top N topic IDs
      const topTopicIds = ranking.rankedTopicIds.slice(0, minRanking)
      
      // Fetch topics to get their details
      const topicsResponse = await $fetch(`/api/events/${event.id}/topics`)
      if (!topicsResponse.success) continue
      
      const allTopics = topicsResponse.topics as unknown as Topic[]
      
      // Get the topics that match our top ranked IDs, in ranked order
      const topRankedTopics: Topic[] = []
      for (const topicId of topTopicIds) {
        const topic = allTopics.find(t => t.id === topicId)
        if (topic) {
          topRankedTopics.push(topic)
        }
      }
      
      eventRankings.value.push({
        event,
        participant,
        ranking,
        topRankedTopics,
        minRanking
      })
    }
  } catch (err) {
    console.error('Error fetching user top rankings:', err)
    error.value = 'Failed to load your top ranked topics'
  } finally {
    loading.value = false
    // Emit whether we have any rankings
    emit('hasRankings', eventRankings.value.length > 0)
  }
}

// Watch for changes in eventRankings and emit the state
watch(() => eventRankings.value.length, (newLength) => {
  emit('hasRankings', newLength > 0)
})

onMounted(() => {
  fetchUserTopRankings()
})
</script>

<template>
  <v-card class="mb-6">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-star</v-icon>
      Your Top Ranked Topics
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
      
      <div v-else-if="eventRankings.length === 0">
        <v-alert type="info" variant="tonal">
          No ranked topics yet. Start ranking topics to see your top preferences here!
        </v-alert>
      </div>
      
      <div v-else>
        <div
          v-for="eventRanking in eventRankings"
          :key="eventRanking.event.id"
          class="mb-6"
        >
          <div class="d-flex align-center mb-3">
            <h3 class="text-h6">
              {{ eventRanking.event.name }}
            </h3>
            <v-chip
              size="small"
              color="primary"
              class="ml-2"
            >
              Top {{ eventRanking.minRanking }}
            </v-chip>
          </div>
          
          <v-list
            v-if="eventRanking.topRankedTopics.length > 0"
            density="compact"
            class="mb-4"
          >
            <v-list-item
              v-for="(topic, index) in eventRanking.topRankedTopics"
              :key="topic.id"
              :to="`/events/${eventRanking.event.id}`"
            >
              <template #prepend>
                <v-avatar
                  :color="index === 0 ? 'primary' : 'grey-lighten-1'"
                  size="32"
                  class="mr-3"
                >
                  <span class="text-white font-weight-bold">
                    {{ index + 1 }}
                  </span>
                </v-avatar>
              </template>
              
              <v-list-item-title class="font-weight-medium">
                {{ topic.title }}
              </v-list-item-title>
              
              <v-list-item-subtitle v-if="topic.description" class="text-wrap mt-1">
                {{ topic.description }}
              </v-list-item-subtitle>
              
              <template #append>
                <v-chip
                  size="x-small"
                  :color="topic.status === 'approved' ? 'success' : 
                         topic.status === 'scheduled' ? 'info' : 
                         topic.status === 'completed' ? 'grey' : 'warning'"
                  variant="flat"
                >
                  {{ topic.status }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
          
          <v-alert
            v-else
            type="info"
            variant="tonal"
            density="compact"
          >
            No topics found for your top rankings
          </v-alert>
          
          <v-divider v-if="eventRanking !== eventRankings[eventRankings.length - 1]" class="mt-4" />
        </div>
        
        <v-btn
          v-if="eventRankings.length > 0 && eventRankings[0]"
          variant="outlined"
          color="primary"
          block
          :to="`/rankings/${eventRankings[0].event.id}`"
          prepend-icon="mdi-pencil"
        >
          Update Your Rankings
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.v-list-item-subtitle.text-wrap {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
}
</style>

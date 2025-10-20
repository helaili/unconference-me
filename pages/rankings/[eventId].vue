<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { User as UnconferenceUser } from '~/types/user'
import type { Event } from '~/types/event'
import type { Topic } from '~/types/topic'
import type { Participant } from '~/types/participant'
import type { TopicRanking } from '~/types/topicRanking'

const route = useRoute()
const router = useRouter()
const { user } = useUserSession() as { user: Ref<UnconferenceUser | null> }
const isAdmin = computed(() => user.value?.role === 'Admin')

// State
const topics = ref<Topic[]>([])
const event = ref<Event | null>(null)
const participant = ref<Participant | null>(null)
const ranking = ref<TopicRanking | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Get event ID from route
const eventId = computed(() => route.params.eventId as string)

useSeoMeta({
  title: 'Rank Topics',
  description: 'Rank your preferred discussion topics'
})

// Computed properties
const minTopicsToRank = computed(() => {
  return event.value?.settings?.minTopicsToRank || 3
})

const rankableTopics = computed(() => {
  // Filter topics to show only approved topics or topics proposed by the user (excluding rejected topics)
  return topics.value.filter(topic => {
    // Never show rejected topics regardless of user role
    if (topic.status === 'rejected') {
      return false
    }
    
    // Admins can see all approved topics
    if (isAdmin.value) {
      return topic.status === 'approved'
    }
    
    // Regular participants can see approved topics or their own non-rejected topics
    return topic.status === 'approved' || 
           (participant.value && topic.proposedBy === participant.value.id)
  })
})

// Fetch data
const fetchData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Fetch event details
    const eventResponse = await $fetch(`/api/events/${eventId.value}`)
    if (eventResponse.success && eventResponse.event) {
      event.value = eventResponse.event as Event
    }
    
    // Check if topic ranking is enabled
    if (!event.value?.settings?.enableTopicRanking) {
      error.value = 'Topic ranking is not enabled for this event'
      return
    }
    
    // Fetch current user's participant record for this event
    try {
      const participantResponse: any = await $fetch(`/api/events/${eventId.value}/participants/me`)
      if (participantResponse.success && participantResponse.participant) {
        participant.value = participantResponse.participant as Participant
      } else {
        participant.value = null
      }
    } catch (err) {
      // User is not a participant for this event
      participant.value = null
    }
    
    // Non-admin users must be participants
    if (!participant.value && !isAdmin.value) {
      error.value = 'You must be registered as a participant for this event to rank topics'
      return
    }
    
    // Fetch topics
    const topicsResponse = await $fetch(`/api/events/${eventId.value}/topics`)
    if (topicsResponse.success) {
      topics.value = topicsResponse.topics
    }
    
    // Fetch existing ranking if it exists
    try {
      const rankingResponse = await $fetch(`/api/events/${eventId.value}/rankings`)
      if (rankingResponse.success && rankingResponse.ranking) {
        ranking.value = rankingResponse.ranking as TopicRanking
      }
    } catch (err) {
      // No ranking exists yet, that's okay
      console.log('No existing ranking found')
    }
    
    // Update last viewed timestamp
    await $fetch(`/api/events/${eventId.value}/rankings/view`, {
      method: 'POST'
    })
  } catch (err: any) {
    console.error('Error fetching data:', err)
    error.value = err?.data?.message || 'Failed to load ranking data'
  } finally {
    loading.value = false
  }
}

// Handle ranking save
const handleSave = async (rankedTopicIds: string[]) => {
  error.value = null
  successMessage.value = null
  
  try {
    const response = await $fetch(`/api/events/${eventId.value}/rankings`, {
      method: 'POST',
      body: { rankedTopicIds }
    })
    
    if (response.success) {
      ranking.value = response.ranking as TopicRanking
      successMessage.value = 'Your topic ranking has been saved successfully!'
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }
  } catch (err: any) {
    console.error('Error saving ranking:', err)
    error.value = err?.data?.message || 'Failed to save ranking'
  }
}

// Initialize
onMounted(async () => {
  await fetchData()
})
</script>

<template>
  <v-container :class="$vuetify.display.smAndDown ? 'pa-2' : ''">
    <!-- Mobile: Stack title and buttons vertically -->
    <div v-if="$vuetify.display.smAndDown" class="mb-4">
      <h1 class="text-h4 mb-3">Rank Discussion Topics</h1>
      <v-btn
        variant="outlined"
        prepend-icon="mdi-view-list"
        color="primary"
        :block="true"
        class="mb-2"
        @click="router.push('/topics')"
      >
        View All Topics
      </v-btn>
      <v-btn
        variant="text"
        prepend-icon="mdi-arrow-left"
        :block="true"
        @click="router.push('/dashboard')"
      >
        Back to Dashboard
      </v-btn>
    </div>
    
    <!-- Desktop: Horizontal layout -->
    <div v-else class="d-flex align-center mb-6">
      <h1>Rank Discussion Topics</h1>
      <v-spacer />
      <v-btn
        variant="outlined"
        prepend-icon="mdi-view-list"
        color="primary"
        class="mr-2"
        @click="router.push('/topics')"
      >
        View All Topics
      </v-btn>
      <v-btn
        variant="text"
        prepend-icon="mdi-arrow-left"
        @click="router.push('/dashboard')"
      >
        Back to Dashboard
      </v-btn>
    </div>
    
    <!-- Alerts -->
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
    
    <!-- Loading state -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="mt-4 text-grey">Loading topics...</p>
    </div>
    
    <!-- Main content -->
    <div v-else-if="!error && rankableTopics.length > 0">
      <v-alert
        v-if="event"
        type="info"
        variant="tonal"
        class="mb-4"
      >
        <strong>{{ event.name }}</strong>
      </v-alert>
      
      <TopicRanking
        :topics="rankableTopics"
        :ranking="ranking"
        :min-ranking="minTopicsToRank"
        :is-admin="isAdmin"
        :participant-id="participant?.id"
        @save="handleSave"
      />
    </div>
    
    <!-- No topics available -->
    <v-alert
      v-else-if="!error && rankableTopics.length === 0"
      type="info"
      variant="tonal"
    >
      No topics are available for ranking yet. Please check back later.
    </v-alert>
  </v-container>
</template>

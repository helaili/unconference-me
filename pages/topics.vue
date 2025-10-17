<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { User as UnconferenceUser } from '~/types/user'
import type { Event } from '~/types/event'
import type { Topic } from '~/types/topic'
import type { Participant } from '~/types/participant'

const { user } = useUserSession() as { user: Ref<UnconferenceUser | null> }
const isAdmin = computed(() => user.value?.role === 'Admin')

// State
const topics = ref<Topic[]>([])
const event = ref<Event | null>(null)
const participant = ref<Participant | null>(null)
const ranking = ref<any>(null)
const loading = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const editingTopic = ref<Topic | null>(null)
const deleteDialog = ref(false)
const topicToDelete = ref<string | null>(null)

// Default event ID (in production, this might come from route params or context)
const eventId = '1'

useSeoMeta({
  title: 'Topics',
  description: 'Submit and view unconference topics'
})

// Computed properties
const maxTopicsPerParticipant = computed(() => {
  return event.value?.settings?.maxTopicsPerParticipant || 3
})

const userTopicCount = computed(() => {
  if (!participant.value) return 0
  return topics.value.filter(
    t => t.proposedBy === participant.value?.id && t.status !== 'rejected'
  ).length
})

const participantId = computed(() => participant.value?.id)

const rankingEnabled = computed(() => {
  return event.value?.settings?.enableTopicRanking || false
})

// Fetch data
const fetchTopics = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await $fetch(`/api/events/${eventId}/topics`)
    if (response.success) {
      topics.value = response.topics.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt)
      }))
    }
  } catch (err: any) {
    console.error('Error fetching topics:', err)
    error.value = err?.data?.message || 'Failed to load topics'
  } finally {
    loading.value = false
  }
}

const fetchEventData = async () => {
  try {
    const eventResponse = await $fetch(`/api/events/${eventId}`)
    if (eventResponse.success && eventResponse.event) {
      // Convert date strings to Date objects for type safety
      const rawEvent = eventResponse.event
      event.value = {
        ...rawEvent,
        startDate: rawEvent.startDate ? new Date(rawEvent.startDate) : undefined,
        endDate: rawEvent.endDate ? new Date(rawEvent.endDate) : undefined,
        createdAt: rawEvent.createdAt ? new Date(rawEvent.createdAt) : undefined,
        updatedAt: rawEvent.updatedAt ? new Date(rawEvent.updatedAt) : undefined
      } as Event
    }
    
    // Fetch participants to find current user's participant ID
    const participantsResponse = await $fetch(`/api/events/${eventId}/participants`)
    if (participantsResponse.success && participantsResponse.participants) {
      const participants = (participantsResponse.participants as any[]).map((p: any) => ({
        ...p,
        registrationDate: p.registrationDate ? new Date(p.registrationDate) : undefined,
        createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined
      })) as Participant[]
      participant.value = participants.find(p => p.email === user.value?.email) || null
    }
    
    // Fetch ranking if enabled
    if (event.value?.settings?.enableTopicRanking && participant.value) {
      try {
        const rankingResponse = await $fetch(`/api/events/${eventId}/rankings`)
        if (rankingResponse.success && rankingResponse.ranking) {
          ranking.value = rankingResponse.ranking
        }
      } catch (err) {
        // No ranking exists yet, that's okay
        console.log('No existing ranking found')
      }
    }
  } catch (err) {
    console.error('Error fetching event data:', err)
  }
}

const handleLikeTopic = async (topicId: string) => {
  if (!participant.value) return
  
  try {
    // Get current ranking or create new one
    const currentRankedIds = ranking.value?.rankedTopicIds || []
    
    // Check if already liked
    if (currentRankedIds.includes(topicId)) {
      successMessage.value = 'This topic is already in your favorites!'
      setTimeout(() => { successMessage.value = null }, 3000)
      return
    }
    
    // Add to end of ranking
    const newRankedIds = [...currentRankedIds, topicId]
    
    const response = await $fetch(`/api/events/${eventId}/rankings`, {
      method: 'POST',
      body: { rankedTopicIds: newRankedIds }
    })
    
    if (response.success) {
      ranking.value = response.ranking
      successMessage.value = 'Topic added to your favorites!'
      setTimeout(() => { successMessage.value = null }, 3000)
    }
  } catch (err: any) {
    console.error('Error liking topic:', err)
    error.value = err?.data?.message || 'Failed to add topic to favorites'
  }
}

const handleUnlikeTopic = async (topicId: string) => {
  if (!participant.value) return
  
  try {
    // Get current ranking
    const currentRankedIds = ranking.value?.rankedTopicIds || []
    
    // Check if topic is actually liked
    if (!currentRankedIds.includes(topicId)) {
      successMessage.value = 'This topic is not in your favorites!'
      setTimeout(() => { successMessage.value = null }, 3000)
      return
    }
    
    // Remove from ranking
    const newRankedIds = currentRankedIds.filter((id: string) => id !== topicId)
    
    const response = await $fetch(`/api/events/${eventId}/rankings`, {
      method: 'POST',
      body: { rankedTopicIds: newRankedIds }
    })
    
    if (response.success) {
      ranking.value = response.ranking
      successMessage.value = 'Topic removed from your favorites!'
      setTimeout(() => { successMessage.value = null }, 3000)
    }
  } catch (err: any) {
    console.error('Error unliking topic:', err)
    error.value = err?.data?.message || 'Failed to remove topic from favorites'
  }
}

// Handle topic submission
const handleSubmit = async (data: { title: string; description?: string; tags?: string[] }) => {
  submitting.value = true
  error.value = null
  successMessage.value = null
  
  try {
    if (editingTopic.value) {
      // Update existing topic
      const response = await $fetch(`/api/events/${eventId}/topics/${editingTopic.value.id}`, {
        method: 'PUT',
        body: data
      })
      
      if (response.success) {
        successMessage.value = 'Topic updated successfully!'
        editingTopic.value = null
        await fetchTopics()
      }
    } else {
      // Create new topic
      const response = await $fetch(`/api/events/${eventId}/topics`, {
        method: 'POST',
        body: data
      })
      
      if (response.success) {
        successMessage.value = 'Topic submitted successfully!'
        await fetchTopics()
      }
    }
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err: any) {
    console.error('Error submitting topic:', err)
    error.value = err?.data?.message || 'Failed to submit topic'
  } finally {
    submitting.value = false
  }
}

// Handle topic edit
const handleEdit = (topic: Topic) => {
  editingTopic.value = topic
  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Handle topic delete
const handleDelete = (topicId: string) => {
  topicToDelete.value = topicId
  deleteDialog.value = true
}

const confirmDelete = async () => {
  if (!topicToDelete.value) return
  
  error.value = null
  successMessage.value = null
  
  try {
    const response = await $fetch(`/api/events/${eventId}/topics/${topicToDelete.value}`, {
      method: 'DELETE'
    })
    
    if (response.success) {
      successMessage.value = 'Topic deleted successfully!'
      await fetchTopics()
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    }
  } catch (err: any) {
    console.error('Error deleting topic:', err)
    error.value = err?.data?.message || 'Failed to delete topic'
  } finally {
    deleteDialog.value = false
    topicToDelete.value = null
  }
}

const handleChangeStatus = async (topicId: string, status: Topic['status']) => {
  error.value = null
  successMessage.value = null
  
  try {
    const response = await $fetch(`/api/events/${eventId}/topics/${topicId}`, {
      method: 'PUT',
      body: { status }
    })
    
    if (response.success) {
      successMessage.value = `Topic status changed to ${status}!`
      await fetchTopics()
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    }
  } catch (err: any) {
    console.error('Error changing topic status:', err)
    error.value = err?.data?.message || 'Failed to change topic status'
  }
}

const cancelEdit = () => {
  editingTopic.value = null
}

// Initialize
onMounted(async () => {
  await fetchEventData()
  await fetchTopics()
})
</script>

<template>
  <v-container>
    <div class="d-flex align-center mb-6">
      <h1 class="mr-4">Discussion Topics</h1>
      <v-spacer />
      <v-btn
        v-if="rankingEnabled && (participant || isAdmin)"
        color="primary"
        variant="elevated"
        prepend-icon="mdi-sort"
        :to="`/rankings/${eventId}`"
      >
        Rank Topics
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
    
    <!-- Submission Form -->
    <div v-if="participant || isAdmin" class="mb-6">
      <TopicSubmissionForm
        :max-topics-per-participant="maxTopicsPerParticipant"
        :current-topic-count="userTopicCount"
        :editing-topic="editingTopic"
        :is-admin="isAdmin"
        @submit="handleSubmit"
        @cancel="cancelEdit"
      />
    </div>
    
    <v-alert v-else type="warning" variant="tonal" class="mb-6">
      You must be registered as a participant for this event to submit topics.
    </v-alert>
    
    <!-- Topics List -->
    <TopicList
      :topics="topics"
      :user-participant-id="participantId"
      :is-admin="isAdmin"
      :loading="loading"
      :ranking="ranking"
      :ranking-enabled="rankingEnabled"
      @edit="handleEdit"
      @delete="handleDelete"
      @like="handleLikeTopic"
      @unlike="handleUnlikeTopic"
      @change-status="handleChangeStatus"
    />
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title>Delete Topic</v-card-title>
        <v-card-text>
          Are you sure you want to delete this topic? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" variant="flat" @click="confirmDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

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

// Fetch data
const fetchTopics = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await $fetch(`/api/events/${eventId}/topics`)
    if (response.success) {
      topics.value = response.topics
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
      event.value = eventResponse.event as Event
    }
    
    // Fetch participants to find current user's participant ID
    const participantsResponse = await $fetch(`/api/events/${eventId}/participants`)
    if (participantsResponse.success && participantsResponse.participants) {
      const participants = participantsResponse.participants as Participant[]
      participant.value = participants.find(p => p.email === user.value?.email) || null
    }
  } catch (err) {
    console.error('Error fetching event data:', err)
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
    <h1 class="mb-6">Discussion Topics</h1>
    
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
      @edit="handleEdit"
      @delete="handleDelete"
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

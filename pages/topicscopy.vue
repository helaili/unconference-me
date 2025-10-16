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
  return 3
})

const userTopicCount = computed(() => {
  return 4
})

const participantId = computed(() => participant.value?.id)

const rankingEnabled = computed(() => {
  return event.value?.settings?.enableTopicRanking || false
})

// Fetch data
const fetchTopics = async () => {
  loading.value = false
  error.value = null
  topics.value = []
}

const fetchEventData = async () => {
  
}

const handleLikeTopic = async (topicId: string) => {
  
}

const handleUnlikeTopic = async (topicId: string) => {
  
}

// Handle topic submission
const handleSubmit = async (data: { title: string; description?: string; tags?: string[] }) => {
  
}

// Handle topic edit
const handleEdit = (topic: Topic) => {
  
}

// Handle topic delete
const handleDelete = (topicId: string) => {
  
}

const confirmDelete = async () => {
 
}

const handleChangeStatus = async (topicId: string, status: Topic['status']) => {
  
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

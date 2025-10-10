<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Topic } from '~/types/topic'

interface Props {
  topics: Topic[]
  userParticipantId?: string
  isAdmin?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  isAdmin: false
})

const emit = defineEmits<{
  edit: [topic: Topic]
  delete: [topicId: string]
}>()

const searchQuery = ref('')
const statusFilter = ref<string>('all')
const showMyTopicsOnly = ref(false)

const statusOptions = [
  { value: 'all', title: 'All Topics' },
  { value: 'proposed', title: 'Proposed' },
  { value: 'approved', title: 'Approved' },
  { value: 'scheduled', title: 'Scheduled' },
  { value: 'completed', title: 'Completed' }
]

const filteredTopics = computed(() => {
  let filtered = [...props.topics]
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.metadata?.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }
  
  // Filter by status
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(t => t.status === statusFilter.value)
  }
  
  // Filter to show only user's topics
  if (showMyTopicsOnly.value && props.userParticipantId) {
    filtered = filtered.filter(t => t.proposedBy === props.userParticipantId)
  }
  
  // Don't show rejected topics to regular users
  if (!props.isAdmin) {
    filtered = filtered.filter(t => t.status !== 'rejected')
  }
  
  // Sort by creation date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  return filtered
})

const handleEdit = (topic: Topic) => {
  emit('edit', topic)
}

const handleDelete = (topicId: string) => {
  emit('delete', topicId)
}
</script>

<template>
  <v-card>
    <v-card-title>
      <div class="d-flex align-center w-100">
        <span>Topics</span>
        <v-spacer />
        <v-chip color="primary" variant="tonal">
          {{ filteredTopics.length }} {{ filteredTopics.length === 1 ? 'topic' : 'topics' }}
        </v-chip>
      </div>
    </v-card-title>
    
    <v-card-text>
      <!-- Filters -->
      <v-row class="mb-4">
        <v-col cols="12" md="6">
          <v-text-field
            v-model="searchQuery"
            label="Search topics"
            placeholder="Search by title, description, or tags"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
        </v-col>
        
        <v-col cols="12" md="4">
          <v-select
            v-model="statusFilter"
            :items="statusOptions"
            label="Filter by status"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>
        
        <v-col cols="12" md="2" class="d-flex align-center">
          <v-checkbox
            v-if="userParticipantId"
            v-model="showMyTopicsOnly"
            label="My Topics"
            density="comfortable"
            hide-details
          />
        </v-col>
      </v-row>
      
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="mt-4 text-grey">Loading topics...</p>
      </div>
      
      <!-- Empty State -->
      <v-alert
        v-else-if="filteredTopics.length === 0"
        type="info"
        variant="tonal"
        class="mt-4"
      >
        <template v-if="searchQuery || statusFilter !== 'all' || showMyTopicsOnly">
          No topics found matching your filters.
        </template>
        <template v-else>
          No topics have been submitted yet. Be the first to propose a topic!
        </template>
      </v-alert>
      
      <!-- Topics Grid -->
      <v-row v-else>
        <v-col
          v-for="topic in filteredTopics"
          :key="topic.id"
          cols="12"
          md="6"
          lg="4"
          class="d-flex"
        >
          <TopicCard
            :topic="topic"
            :user-participant-id="userParticipantId"
            :is-admin="isAdmin"
            @edit="handleEdit"
            @delete="handleDelete"
            class="flex-grow-1"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

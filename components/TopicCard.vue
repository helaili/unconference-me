<script setup lang="ts">
import { ref } from 'vue'
import type { Topic } from '~/types/topic'
import type { User as UnconferenceUser } from '~/types/user'

interface Props {
  topic: Topic
  userParticipantId?: string
  isAdmin?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  edit: [topic: Topic]
  delete: [topicId: string]
}>()

const canEdit = ref(props.isAdmin || props.topic.proposedBy === props.userParticipantId)
const canDelete = ref(props.isAdmin || props.topic.proposedBy === props.userParticipantId)

const statusColor = (status: string) => {
  const colors: Record<string, string> = {
    proposed: 'grey',
    approved: 'green',
    scheduled: 'blue',
    completed: 'teal',
    rejected: 'red'
  }
  return colors[status] || 'grey'
}

const statusIcon = (status: string) => {
  const icons: Record<string, string> = {
    proposed: 'mdi-clock-outline',
    approved: 'mdi-check-circle',
    scheduled: 'mdi-calendar-check',
    completed: 'mdi-checkbox-marked-circle',
    rejected: 'mdi-close-circle'
  }
  return icons[status] || 'mdi-help-circle'
}

const handleEdit = () => {
  emit('edit', props.topic)
}

const handleDelete = () => {
  emit('delete', props.topic.id)
}
</script>

<template>
  <v-card class="d-flex flex-column" height="100%">
    <v-card-title class="d-flex align-center">
      <v-icon :icon="statusIcon(topic.status)" :color="statusColor(topic.status)" class="mr-2" />
      {{ topic.title }}
      <v-spacer />
      <v-chip :color="statusColor(topic.status)" variant="tonal" size="small">
        {{ topic.status }}
      </v-chip>
    </v-card-title>
    
    <v-card-text class="flex-grow-1">
      <p v-if="topic.description" class="mb-3">
        {{ topic.description }}
      </p>
      
      <div v-if="topic.metadata?.tags && topic.metadata.tags.length > 0" class="mb-2">
        <v-chip
          v-for="tag in topic.metadata.tags"
          :key="tag"
          size="small"
          class="mr-1 mb-1"
          variant="outlined"
        >
          {{ tag }}
        </v-chip>
      </div>
      
      <div class="text-caption text-grey">
        Proposed: {{ new Date(topic.createdAt).toLocaleDateString() }}
        <span v-if="topic.updatedAt !== topic.createdAt">
          • Updated: {{ new Date(topic.updatedAt).toLocaleDateString() }}
        </span>
      </div>
    </v-card-text>
    
    <v-card-actions v-if="canEdit || canDelete">
      <v-spacer />
      <v-btn
        v-if="canEdit && topic.status !== 'rejected'"
        variant="text"
        color="primary"
        @click="handleEdit"
      >
        <v-icon start>mdi-pencil</v-icon>
        Edit
      </v-btn>
      <v-btn
        v-if="canDelete && topic.status !== 'rejected'"
        variant="text"
        color="error"
        @click="handleDelete"
      >
        <v-icon start>mdi-delete</v-icon>
        Delete
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

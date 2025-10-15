<script setup lang="ts">
import { ref } from 'vue'
import type { Topic } from '~/types/topic'
import type { User as UnconferenceUser } from '~/types/user'

interface Props {
  topic: Topic
  userParticipantId?: string
  isAdmin?: boolean
  rank?: number | null
  rankingEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rankingEnabled: false
})

const emit = defineEmits<{
  edit: [topic: Topic]
  delete: [topicId: string]
  like: [topicId: string]
  'change-status': [topicId: string, status: Topic['status']]
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

const handleLike = () => {
  emit('like', props.topic.id)
}

const handleChangeStatus = (status: Topic['status']) => {
  emit('change-status', props.topic.id, status)
}
</script>

<template>
  <v-card class="d-flex flex-column" height="100%">
    <v-card-title class="d-flex align-center">
      <v-icon :icon="statusIcon(topic.status)" :color="statusColor(topic.status)" class="mr-2" />
      <span class="flex-grow-1">{{ topic.title }}</span>
      <v-chip
        v-if="rank"
        color="primary"
        variant="elevated"
        size="small"
        class="mr-2"
      >
        #{{ rank }}
      </v-chip>
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
    
    <v-card-actions>
      <v-btn
        v-if="rankingEnabled && !rank"
        variant="text"
        color="primary"
        @click="handleLike"
      >
        <v-icon start>mdi-heart-outline</v-icon>
        Like
      </v-btn>
      <v-btn
        v-if="rankingEnabled && rank"
        variant="text"
        color="primary"
        disabled
      >
        <v-icon start>mdi-heart</v-icon>
        Liked
      </v-btn>
    </v-card-actions>
    <v-card-actions v-if="canEdit || canDelete || isAdmin">
      <v-menu v-if="isAdmin" :close-on-content-click="true">
        <template #activator="{ props: menuProps }">
          <v-btn
            variant="tonal"
            color="primary"
            size="small"
            v-bind="menuProps"
          >
            <v-icon start>mdi-cog</v-icon>
            Status
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            v-if="topic.status !== 'proposed'"
            @click="handleChangeStatus('proposed')"
          >
            <v-list-item-title>
              <v-icon size="small" class="mr-2">mdi-clock-outline</v-icon>
              Mark as Proposed
            </v-list-item-title>
          </v-list-item>
          <v-list-item
            v-if="topic.status !== 'approved'"
            @click="handleChangeStatus('approved')"
          >
            <v-list-item-title>
              <v-icon size="small" class="mr-2">mdi-check-circle</v-icon>
              Approve Topic
            </v-list-item-title>
          </v-list-item>
          <v-list-item
            v-if="topic.status !== 'scheduled'"
            @click="handleChangeStatus('scheduled')"
          >
            <v-list-item-title>
              <v-icon size="small" class="mr-2">mdi-calendar-check</v-icon>
              Mark as Scheduled
            </v-list-item-title>
          </v-list-item>
          <v-list-item
            v-if="topic.status !== 'completed'"
            @click="handleChangeStatus('completed')"
          >
            <v-list-item-title>
              <v-icon size="small" class="mr-2">mdi-checkbox-marked-circle</v-icon>
              Mark as Completed
            </v-list-item-title>
          </v-list-item>
          <v-divider v-if="topic.status !== 'rejected'" />
          <v-list-item
            v-if="topic.status !== 'rejected'"
            @click="handleChangeStatus('rejected')"
          >
            <v-list-item-title class="text-error">
              <v-icon size="small" class="mr-2">mdi-close-circle</v-icon>
              Reject Topic
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      
      <v-spacer />
      <v-btn
        v-if="canEdit && topic.status !== 'rejected'"
        variant="text"
        color="primary"
        size="small"
        @click="handleEdit"
      >
        <v-icon start>mdi-pencil</v-icon>
        <span v-if="!$vuetify.display.smAndDown">Edit</span>
      </v-btn>
      <v-btn
        v-if="canDelete && topic.status !== 'rejected'"
        variant="text"
        color="error"
        size="small"
        @click="handleDelete"
      >
        <v-icon start>mdi-delete</v-icon>
        <span v-if="!$vuetify.display.smAndDown">Delete</span>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

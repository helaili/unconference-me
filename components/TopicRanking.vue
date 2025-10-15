<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Topic } from '~/types/topic'
import type { TopicRanking as TopicRankingType, TopicUpdate } from '~/types/topicRanking'

interface Props {
  topics: Topic[]
  ranking: TopicRankingType | null
  minRanking?: number
  isAdmin?: boolean
  participantId?: string
}

const props = withDefaults(defineProps<Props>(), {
  minRanking: 3,
  isAdmin: false
})

const emit = defineEmits<{
  save: [rankedTopicIds: string[]]
}>()

// State
const rankedTopics = ref<Topic[]>([])
const draggedItem = ref<Topic | null>(null)
const draggedIndex = ref<number>(-1)
const focusedIndex = ref<number>(-1)
const saving = ref(false)

// Computed
const minRankingMet = computed(() => {
  return rankedTopics.value.length >= props.minRanking
})

const newOrUpdatedTopics = computed((): Set<string> => {
  if (!props.ranking?.lastViewedAt) return new Set()
  
  const lastViewed = new Date(props.ranking.lastViewedAt)
  const newTopics = new Set<string>()
  
  props.topics.forEach(topic => {
    const topicUpdated = new Date(topic.updatedAt)
    const topicCreated = new Date(topic.createdAt)
    
    if (topicCreated > lastViewed || topicUpdated > lastViewed) {
      newTopics.add(topic.id)
    }
  })
  
  return newTopics
})

const isTopicHighlighted = (topicId: string): boolean => {
  return newOrUpdatedTopics.value.has(topicId)
}

// Initialize ranked topics from existing ranking
onMounted(() => {
  if (props.ranking?.rankedTopicIds) {
    // Restore the order from the ranking
    rankedTopics.value = props.ranking.rankedTopicIds
      .map(id => props.topics.find(t => t.id === id))
      .filter((t): t is Topic => t !== undefined)
    
    // Add any new topics that weren't in the ranking
    const rankedIds = new Set(props.ranking.rankedTopicIds)
    const newTopics = props.topics.filter(t => !rankedIds.has(t.id))
    rankedTopics.value.push(...newTopics)
  } else {
    rankedTopics.value = [...props.topics]
  }
})

// Drag and drop handlers
const handleDragStart = (event: DragEvent, topic: Topic, index: number) => {
  draggedItem.value = topic
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', (event.target as HTMLElement).innerHTML)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleDrop = (event: DragEvent, dropIndex: number) => {
  event.preventDefault()
  
  if (draggedIndex.value === -1 || draggedIndex.value === dropIndex) return
  
  const newRanked = [...rankedTopics.value]
  const [removed] = newRanked.splice(draggedIndex.value, 1)
  if (removed) {
    newRanked.splice(dropIndex, 0, removed)
  }
  
  rankedTopics.value = newRanked
  draggedIndex.value = -1
  draggedItem.value = null
}

const handleDragEnd = () => {
  draggedIndex.value = -1
  draggedItem.value = null
}

// Keyboard navigation
const moveUp = (index: number) => {
  if (index > 0) {
    const newRanked = [...rankedTopics.value]
    const temp = newRanked[index]
    newRanked[index] = newRanked[index - 1]!
    newRanked[index - 1] = temp!
    rankedTopics.value = newRanked
    focusedIndex.value = index - 1
  }
}

const moveDown = (index: number) => {
  if (index < rankedTopics.value.length - 1) {
    const newRanked = [...rankedTopics.value]
    const temp = newRanked[index]
    newRanked[index] = newRanked[index + 1]!
    newRanked[index + 1] = temp!
    rankedTopics.value = newRanked
    focusedIndex.value = index + 1
  }
}

const handleKeyDown = (event: KeyboardEvent, index: number) => {
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveUp(index)
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveDown(index)
  } else if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    focusedIndex.value = focusedIndex.value === index ? -1 : index
  }
}

// Save ranking
const saveRanking = async () => {
  saving.value = true
  try {
    const rankedTopicIds = rankedTopics.value.map(t => t.id)
    emit('save', rankedTopicIds)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-sort</v-icon>
      Rank Your Topic Preferences
    </v-card-title>
    
    <v-card-text>
      <v-alert 
        type="info" 
        variant="tonal" 
        class="mb-4"
        icon="mdi-information"
      >
        <div class="text-body-2">
          <p class="mb-2">
            <strong>Drag and drop</strong> topics to rank them in order of your preference 
            (top = most interested).
          </p>
          <p class="mb-2">
            <strong>Keyboard users:</strong> Use Tab to navigate, Space/Enter to select, 
            and Arrow keys to move topics up or down.
          </p>
          <p v-if="minRanking > 0" class="mb-0">
            <strong>You must rank at least {{ minRanking }} topics</strong> before saving.
          </p>
        </div>
      </v-alert>
      
      <v-alert 
        v-if="newOrUpdatedTopics.size > 0"
        type="warning"
        variant="tonal"
        class="mb-4"
        icon="mdi-new-box"
      >
        {{ newOrUpdatedTopics.size }} topic(s) have been added or updated since you last viewed this page.
        They are highlighted below.
      </v-alert>
      
      <div class="ranking-list">
        <v-list>
          <v-list-item
            v-for="(topic, index) in rankedTopics"
            :key="topic.id"
            :class="{
              'dragging': draggedIndex === index,
              'highlighted-topic': isTopicHighlighted(topic.id),
              'focused': focusedIndex === index
            }"
            draggable="true"
            :tabindex="0"
            @dragstart="handleDragStart($event, topic, index)"
            @dragover="handleDragOver"
            @drop="handleDrop($event, index)"
            @dragend="handleDragEnd"
            @keydown="handleKeyDown($event, index)"
            role="button"
            :aria-label="`Topic ${index + 1} of ${rankedTopics.length}: ${topic.title}. Press space to select, then use arrow keys to reorder.`"
          >
            <template #prepend>
              <div class="rank-number">
                <v-chip
                  :color="index < minRanking ? 'primary' : 'default'"
                  size="small"
                  class="mr-2"
                >
                  {{ index + 1 }}
                </v-chip>
                <v-icon class="drag-handle">mdi-drag-vertical</v-icon>
              </div>
            </template>
            
            <v-list-item-title class="d-flex align-center">
              <span>{{ topic.title }}</span>
              <v-chip
                v-if="isTopicHighlighted(topic.id)"
                color="warning"
                size="x-small"
                class="ml-2"
              >
                NEW
              </v-chip>
            </v-list-item-title>
            
            <v-list-item-subtitle v-if="topic.description">
              {{ topic.description }}
            </v-list-item-subtitle>
            
            <template #append>
              <div class="keyboard-controls">
                <v-btn
                  icon="mdi-arrow-up"
                  size="small"
                  variant="text"
                  :disabled="index === 0"
                  @click.stop="moveUp(index)"
                  aria-label="Move up"
                />
                <v-btn
                  icon="mdi-arrow-down"
                  size="small"
                  variant="text"
                  :disabled="index === rankedTopics.length - 1"
                  @click.stop="moveDown(index)"
                  aria-label="Move down"
                />
              </div>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </v-card-text>
    
    <v-card-actions>
      <v-spacer />
      <v-alert 
        v-if="!minRankingMet"
        type="warning"
        variant="text"
        density="compact"
        class="mr-2"
      >
        Rank at least {{ minRanking }} topics
      </v-alert>
      <v-btn
        color="primary"
        :disabled="!minRankingMet || saving"
        :loading="saving"
        @click="saveRanking"
      >
        Save Ranking
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.ranking-list {
  max-height: 600px;
  overflow-y: auto;
}

.v-list-item {
  cursor: move;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  margin-bottom: 8px;
  background-color: rgb(var(--v-theme-surface));
}

.v-list-item:hover {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgb(var(--v-theme-surface-variant));
}

.v-list-item.dragging {
  opacity: 0.5;
}

.v-list-item.focused {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.3);
}

.v-list-item.highlighted-topic {
  border-left: 4px solid rgb(var(--v-theme-warning));
  background-color: rgba(var(--v-theme-warning), 0.05);
}

.rank-number {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drag-handle {
  cursor: grab;
  opacity: 0.6;
}

.drag-handle:active {
  cursor: grabbing;
}

.keyboard-controls {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Mobile responsive */
@media (max-width: 600px) {
  .ranking-list {
    max-height: 500px;
  }
  
  .keyboard-controls {
    flex-direction: row;
  }
}
</style>

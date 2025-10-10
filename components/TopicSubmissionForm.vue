<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Topic } from '~/types/topic'

interface Props {
  maxTopicsPerParticipant?: number
  currentTopicCount?: number
  editingTopic?: Topic | null
}

const props = withDefaults(defineProps<Props>(), {
  maxTopicsPerParticipant: 3,
  currentTopicCount: 0,
  editingTopic: null
})

const emit = defineEmits<{
  submit: [data: { title: string; description?: string; tags?: string[] }]
  cancel: []
}>()

const expanded = ref<number | undefined>(undefined) // undefined = collapsed, 0 = expanded
const title = ref(props.editingTopic?.title || '')
const description = ref(props.editingTopic?.description || '')
const tagInput = ref('')
const tags = ref<string[]>(props.editingTopic?.metadata?.tags || [])

const isEditing = computed(() => props.editingTopic !== null)
const canSubmitMore = computed(() => {
  return isEditing.value || props.currentTopicCount < props.maxTopicsPerParticipant
})

const remainingTopics = computed(() => {
  return props.maxTopicsPerParticipant - props.currentTopicCount
})

const isValid = computed(() => {
  return title.value.trim().length > 0 && title.value.length <= 200
})

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag)
    tagInput.value = ''
  }
}

const removeTag = (tag: string) => {
  tags.value = tags.value.filter(t => t !== tag)
}

const handleSubmit = () => {
  if (!isValid.value) return
  
  emit('submit', {
    title: title.value.trim(),
    description: description.value.trim() || undefined,
    tags: tags.value.length > 0 ? tags.value : undefined
  })
  
  if (!isEditing.value) {
    // Reset form after submit (for new topics)
    title.value = ''
    description.value = ''
    tags.value = []
    tagInput.value = ''
  }
}

const handleCancel = () => {
  emit('cancel')
  title.value = ''
  description.value = ''
  tags.value = []
  tagInput.value = ''
}

// Watch for editing topic changes
watch(() => props.editingTopic, (newTopic) => {
  if (newTopic) {
    title.value = newTopic.title
    description.value = newTopic.description || ''
    tags.value = newTopic.metadata?.tags || []
    expanded.value = 0 // Expand when editing
  }
})
</script>

<template>
  <v-expansion-panels v-model="expanded">
    <v-expansion-panel>
      <v-expansion-panel-title>
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-plus-circle</v-icon>
          <span class="text-h6">{{ isEditing ? 'Edit Topic' : 'Submit New Topic' }}</span>
        </div>
      </v-expansion-panel-title>
      
      <v-expansion-panel-text>
        <v-card flat>
          <v-card-text>
            <v-alert
              v-if="!canSubmitMore"
              type="warning"
              variant="tonal"
              class="mb-4"
            >
              You have reached the maximum number of topics ({{ maxTopicsPerParticipant }}) for this event.
            </v-alert>
            
            <v-alert
              v-else-if="!isEditing && remainingTopics > 0"
              type="info"
              variant="tonal"
              class="mb-4"
            >
              You can submit {{ remainingTopics }} more {{ remainingTopics === 1 ? 'topic' : 'topics' }}.
            </v-alert>
            
            <v-form @submit.prevent="handleSubmit">
              <v-text-field
                v-model="title"
                label="Topic Title"
                placeholder="Enter a concise title for your topic"
                :rules="[
                  v => !!v || 'Title is required',
                  v => v.length <= 200 || 'Title must be 200 characters or less'
                ]"
                counter="200"
                variant="outlined"
                required
                class="mb-3"
                :disabled="!canSubmitMore && !isEditing"
              />
              
              <v-textarea
                v-model="description"
                label="Description (optional)"
                placeholder="Provide more details about what you'd like to discuss"
                variant="outlined"
                rows="4"
                class="mb-3"
                :disabled="!canSubmitMore && !isEditing"
              />
              
              <div class="mb-3">
                <v-text-field
                  v-model="tagInput"
                  label="Add Tags (optional)"
                  placeholder="Enter a tag and press Enter"
                  variant="outlined"
                  @keydown.enter.prevent="addTag"
                  :disabled="!canSubmitMore && !isEditing"
                >
                  <template #append>
                    <v-btn
                      icon="mdi-plus"
                      size="small"
                      variant="text"
                      @click="addTag"
                      :disabled="!tagInput.trim()"
                    />
                  </template>
                </v-text-field>
                
                <div v-if="tags.length > 0" class="mt-2">
                  <v-chip
                    v-for="tag in tags"
                    :key="tag"
                    closable
                    @click:close="removeTag(tag)"
                    class="mr-1 mb-1"
                    size="small"
                  >
                    {{ tag }}
                  </v-chip>
                </div>
              </div>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer />
            <v-btn
              v-if="isEditing"
              variant="outlined"
              @click="handleCancel"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              :disabled="!isValid || (!canSubmitMore && !isEditing)"
              @click="handleSubmit"
            >
              {{ isEditing ? 'Update Topic' : 'Submit Topic' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

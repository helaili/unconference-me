<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Event } from '~/types/event'

interface Props {
  event: Event
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: [event: Partial<Event>]
  save: []
}>()

// Local editable state
const editMode = ref(false)
const localEvent = ref({ ...props.event })
const saving = ref(false)

// Validation
const isValid = computed(() => {
  return (
    localEvent.value.minGroupSize <= localEvent.value.idealGroupSize &&
    localEvent.value.idealGroupSize <= localEvent.value.maxGroupSize &&
    localEvent.value.numberOfRounds > 0 &&
    localEvent.value.discussionsPerRound > 0
  )
})

const toggleEditMode = () => {
  if (editMode.value) {
    // Cancel - reset to original values
    localEvent.value = { ...props.event }
  }
  editMode.value = !editMode.value
}

const saveChanges = async () => {
  if (!isValid.value) {
    return
  }
  
  saving.value = true
  try {
    emit('update', localEvent.value)
    emit('save')
    editMode.value = false
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Event Configuration</span>
      <v-btn
        v-if="!editMode"
        size="small"
        variant="outlined"
        color="primary"
        @click="toggleEditMode"
      >
        Edit
      </v-btn>
    </v-card-title>
    
    <v-card-text>
      <v-form @submit.prevent="saveChanges">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="localEvent.numberOfRounds"
              label="Number of Rounds"
              type="number"
              :readonly="!editMode"
              :variant="editMode ? 'outlined' : 'plain'"
              min="1"
              required
            />
          </v-col>
          
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="localEvent.discussionsPerRound"
              label="Discussions per Round"
              type="number"
              :readonly="!editMode"
              :variant="editMode ? 'outlined' : 'plain'"
              min="1"
              required
            />
          </v-col>
          
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="localEvent.minGroupSize"
              label="Minimum Group Size"
              type="number"
              :readonly="!editMode"
              :variant="editMode ? 'outlined' : 'plain'"
              min="1"
              required
            />
          </v-col>
          
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="localEvent.idealGroupSize"
              label="Ideal Group Size"
              type="number"
              :readonly="!editMode"
              :variant="editMode ? 'outlined' : 'plain'"
              :min="localEvent.minGroupSize"
              :max="localEvent.maxGroupSize"
              required
            />
          </v-col>
          
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="localEvent.maxGroupSize"
              label="Maximum Group Size"
              type="number"
              :readonly="!editMode"
              :variant="editMode ? 'outlined' : 'plain'"
              :min="localEvent.idealGroupSize"
              required
            />
          </v-col>
        </v-row>
        
        <v-divider class="my-4" />
        
        <h3 class="text-h6 mb-3">Event Settings</h3>
        
        <v-row v-if="localEvent.settings">
          <v-col cols="12" md="6">
            <v-switch
              v-model="localEvent.settings.enableTopicRanking"
              label="Enable Topic Ranking"
              :readonly="!editMode"
              color="primary"
            />
          </v-col>
          
          <v-col cols="12" md="6">
            <v-switch
              v-model="localEvent.settings.enableAutoAssignment"
              label="Enable Auto Assignment"
              :readonly="!editMode"
              color="primary"
            />
          </v-col>
          
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="localEvent.settings.maxTopicsPerParticipant"
              label="Max Topics per Participant"
              type="number"
              :readonly="!editMode"
              :variant="editMode ? 'outlined' : 'plain'"
              min="1"
            />
          </v-col>
          
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="localEvent.settings.maxParticipants"
              label="Max Participants"
              type="number"
              :readonly="!editMode"
              :variant="editMode ? 'outlined' : 'plain'"
              min="1"
            />
          </v-col>
          
          <v-col cols="12" md="6">
            <v-switch
              v-model="localEvent.settings.requireApproval"
              label="Require Registration Approval"
              :readonly="!editMode"
              color="primary"
            />
          </v-col>
        </v-row>
        
        <v-alert
          v-if="editMode && !isValid"
          type="error"
          variant="tonal"
          class="mt-4"
        >
          Please ensure: Min Group Size ≤ Ideal Group Size ≤ Max Group Size
        </v-alert>
        
        <v-card-actions v-if="editMode" class="px-0 pt-4">
          <v-btn
            color="primary"
            :disabled="!isValid || saving"
            :loading="saving"
            type="submit"
          >
            Save Changes
          </v-btn>
          <v-btn
            variant="outlined"
            @click="toggleEditMode"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card-text>
  </v-card>
</template>

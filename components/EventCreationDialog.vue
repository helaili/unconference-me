<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'create': [eventData: any]
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Form data
const formData = ref({
  name: '',
  description: '',
  location: '',
  startDate: '',
  endDate: '',
  numberOfRounds: 3,
  discussionsPerRound: 5,
  idealGroupSize: 8,
  minGroupSize: 5,
  maxGroupSize: 10,
  status: 'draft' as 'draft' | 'published' | 'active' | 'completed' | 'cancelled',
  settings: {
    enableTopicRanking: true,
    enableAutoAssignment: false,
    maxTopicsPerParticipant: 3,
    requireApproval: false,
    maxParticipants: undefined as number | undefined
  }
})

const statusOptions = [
  { value: 'draft', title: 'Draft' },
  { value: 'published', title: 'Published' },
  { value: 'active', title: 'Active' }
]

// Validation
const formValid = ref(false)
const nameRules = [
  (v: string) => !!v || 'Event name is required',
  (v: string) => v.length <= 200 || 'Event name must be 200 characters or less'
]
const dateRules = [
  (v: string) => !!v || 'Date is required'
]
const numberRules = [
  (v: number) => v > 0 || 'Must be greater than 0'
]

// Computed validations
const dateRangeValid = computed(() => {
  if (!formData.value.startDate || !formData.value.endDate) return true
  return new Date(formData.value.endDate) > new Date(formData.value.startDate)
})

const groupSizeValid = computed(() => {
  return formData.value.minGroupSize <= formData.value.idealGroupSize &&
         formData.value.idealGroupSize <= formData.value.maxGroupSize
})

const canSubmit = computed(() => {
  return formValid.value && dateRangeValid.value && groupSizeValid.value
})

// Methods
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    numberOfRounds: 3,
    discussionsPerRound: 5,
    idealGroupSize: 8,
    minGroupSize: 5,
    maxGroupSize: 10,
    status: 'draft',
    settings: {
      enableTopicRanking: true,
      enableAutoAssignment: false,
      maxTopicsPerParticipant: 3,
      requireApproval: false,
      maxParticipants: undefined
    }
  }
}

const handleSubmit = () => {
  if (!canSubmit.value) return
  
  // Convert dates to ISO strings
  const eventData = {
    ...formData.value,
    startDate: new Date(formData.value.startDate).toISOString(),
    endDate: new Date(formData.value.endDate).toISOString()
  }
  
  emit('create', eventData)
  resetForm()
  dialog.value = false
}

const handleCancel = () => {
  resetForm()
  dialog.value = false
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="800" scrollable>
    <v-card>
      <v-card-title :class="$vuetify.display.smAndDown ? 'text-h6' : 'text-h5'">
        Create New Event
      </v-card-title>
      
      <v-divider />
      
      <v-card-text :class="$vuetify.display.smAndDown ? 'pa-3' : 'pa-6'">
        <v-form v-model="formValid">
          <!-- Basic Information -->
          <h3 class="text-h6 mb-4">Basic Information</h3>
          
          <v-text-field
            v-model="formData.name"
            label="Event Name *"
            variant="outlined"
            density="comfortable"
            :rules="nameRules"
            counter="200"
            class="mb-4"
          />
          
          <v-textarea
            v-model="formData.description"
            label="Description"
            variant="outlined"
            density="comfortable"
            rows="3"
            class="mb-4"
          />
          
          <v-text-field
            v-model="formData.location"
            label="Location"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-map-marker"
            class="mb-4"
          />
          
          <!-- Dates -->
          <h3 class="text-h6 mb-4">Event Dates</h3>
          
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.startDate"
                label="Start Date & Time *"
                type="datetime-local"
                variant="outlined"
                density="comfortable"
                :rules="dateRules"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.endDate"
                label="End Date & Time *"
                type="datetime-local"
                variant="outlined"
                density="comfortable"
                :rules="dateRules"
              />
            </v-col>
          </v-row>
          
          <v-alert v-if="!dateRangeValid" type="error" variant="tonal" class="mb-4">
            End date must be after start date
          </v-alert>
          
          <!-- Event Configuration -->
          <h3 class="text-h6 mb-4">Event Configuration</h3>
          
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.numberOfRounds"
                label="Number of Rounds *"
                type="number"
                variant="outlined"
                density="comfortable"
                :rules="numberRules"
                min="1"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.discussionsPerRound"
                label="Discussions per Round *"
                type="number"
                variant="outlined"
                density="comfortable"
                :rules="numberRules"
                min="1"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="formData.status"
                label="Status *"
                :items="statusOptions"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>
          
          <!-- Group Sizes -->
          <h3 class="text-h6 mb-4">Group Size Settings</h3>
          
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.minGroupSize"
                label="Minimum Group Size *"
                type="number"
                variant="outlined"
                density="comfortable"
                :rules="numberRules"
                min="2"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.idealGroupSize"
                label="Ideal Group Size *"
                type="number"
                variant="outlined"
                density="comfortable"
                :rules="numberRules"
                min="2"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.maxGroupSize"
                label="Maximum Group Size *"
                type="number"
                variant="outlined"
                density="comfortable"
                :rules="numberRules"
                min="2"
              />
            </v-col>
          </v-row>
          
          <v-alert v-if="!groupSizeValid" type="error" variant="tonal" class="mb-4">
            Group sizes must follow: Min ≤ Ideal ≤ Max
          </v-alert>
          
          <!-- Settings -->
          <h3 class="text-h6 mb-4">Additional Settings</h3>
          
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.settings.maxTopicsPerParticipant"
                label="Max Topics per Participant"
                type="number"
                variant="outlined"
                density="comfortable"
                min="1"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.settings.maxParticipants"
                label="Max Participants (optional)"
                type="number"
                variant="outlined"
                density="comfortable"
                min="1"
              />
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12" md="6">
              <v-checkbox
                v-model="formData.settings.enableTopicRanking"
                label="Enable Topic Ranking"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-checkbox
                v-model="formData.settings.enableAutoAssignment"
                label="Enable Auto Assignment"
                density="comfortable"
              />
            </v-col>
          </v-row>
          
          <v-checkbox
            v-model="formData.settings.requireApproval"
            label="Require Participant Approval"
            density="comfortable"
          />
        </v-form>
      </v-card-text>
      
      <v-divider />
      
      <v-card-actions :class="$vuetify.display.smAndDown ? 'flex-column pa-3' : 'pa-4'">
        <v-spacer v-if="!$vuetify.display.smAndDown" />
        <v-btn
          variant="text"
          :block="$vuetify.display.smAndDown"
          :class="$vuetify.display.smAndDown ? 'mb-2' : 'mr-2'"
          @click="handleCancel"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :block="$vuetify.display.smAndDown"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          Create Event
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

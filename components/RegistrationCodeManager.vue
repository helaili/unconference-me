<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Event } from '~/types/event'

interface Props {
  event: Event
  eventId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  refresh: []
}>()

const generatingGeneric = ref(false)
const copySuccess = ref(false)
const errorMessage = ref<string | null>(null)

const registrationMode = computed(() => props.event.settings?.registrationMode || 'open')
const genericCode = computed(() => props.event.settings?.genericInvitationCode)

const genericInvitationUrl = computed(() => {
  if (!genericCode.value) return ''
  const baseUrl = window.location.origin
  return `${baseUrl}/register?eventId=${props.eventId}&code=${genericCode.value}`
})

const generateGenericCode = async () => {
  generatingGeneric.value = true
  errorMessage.value = null
  
  try {
    const response = await $fetch(`/api/events/${props.eventId}/invitations/generate-generic`, {
      method: 'POST'
    })
    
    if (response.success) {
      emit('refresh')
    }
  } catch (error: any) {
    errorMessage.value = error?.data?.message || 'Failed to generate generic invitation code'
    console.error('Error generating generic code:', error)
  } finally {
    generatingGeneric.value = false
  }
}

const copyGenericUrl = async () => {
  try {
    await navigator.clipboard.writeText(genericInvitationUrl.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('Failed to copy URL:', error)
  }
}
</script>

<template>
  <v-card v-if="registrationMode === 'generic-code'" class="mb-4">
    <v-card-title>
      <v-icon class="mr-2">mdi-link-variant</v-icon>
      Generic Invitation Code
    </v-card-title>
    
    <v-card-text>
      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        closable
        class="mb-4"
        @click:close="errorMessage = null"
      >
        {{ errorMessage }}
      </v-alert>

      <v-alert
        v-if="!genericCode"
        type="info"
        variant="tonal"
        class="mb-4"
      >
        No generic invitation code has been generated yet. Generate one to create a shareable registration link.
      </v-alert>

      <div v-if="genericCode" class="mb-4">
        <v-text-field
          :model-value="genericCode"
          label="Generic Invitation Code"
          readonly
          variant="outlined"
          density="comfortable"
        >
          <template #append-inner>
            <v-btn
              icon="mdi-content-copy"
              variant="text"
              size="small"
              @click="copyGenericUrl"
            />
          </template>
        </v-text-field>

        <v-text-field
          :model-value="genericInvitationUrl"
          label="Shareable Registration Link"
          readonly
          variant="outlined"
          density="comfortable"
          class="mt-2"
        >
          <template #append-inner>
            <v-btn
              icon="mdi-content-copy"
              variant="text"
              size="small"
              @click="copyGenericUrl"
            />
          </template>
        </v-text-field>

        <v-alert
          v-if="copySuccess"
          type="success"
          variant="tonal"
          class="mt-2"
        >
          Registration link copied to clipboard!
        </v-alert>

        <v-alert
          type="warning"
          variant="tonal"
          class="mt-4"
        >
          <v-icon class="mr-2">mdi-information</v-icon>
          Share this link with users who should be able to register for this event. 
          Users must already exist in the database to register using this code.
        </v-alert>
      </div>

      <v-btn
        color="primary"
        :loading="generatingGeneric"
        :disabled="generatingGeneric"
        @click="generateGenericCode"
      >
        <v-icon class="mr-2">mdi-refresh</v-icon>
        {{ genericCode ? 'Regenerate' : 'Generate' }} Generic Code
      </v-btn>
    </v-card-text>
  </v-card>
</template>

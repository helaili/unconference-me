<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Invitation } from '~/types/invitation'
import type { Event } from '~/types/event'

interface EnrichedInvitation extends Invitation {
  event?: Event
}

const invitations = ref<EnrichedInvitation[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const respondingTo = ref<string | null>(null)
const showRespondDialog = ref(false)
const selectedInvitation = ref<EnrichedInvitation | null>(null)
const response = ref<'accept' | 'decline'>('accept')
const comment = ref('')

const fetchInvitations = async () => {
  loading.value = true
  error.value = null
  
  try {
    const result = await $fetch('/api/invitations/mine')
    if (result.success) {
      invitations.value = result.invitations as EnrichedInvitation[]
    }
  } catch (err) {
    console.error('Error fetching invitations:', err)
    error.value = 'Failed to load invitations'
  } finally {
    loading.value = false
  }
}

const openRespondDialog = (invitation: EnrichedInvitation, responseType: 'accept' | 'decline') => {
  selectedInvitation.value = invitation
  response.value = responseType
  comment.value = ''
  showRespondDialog.value = true
}

const respondToInvitation = async () => {
  if (!selectedInvitation.value) return
  
  respondingTo.value = selectedInvitation.value.id
  
  try {
    const result = await $fetch(`/api/invitations/${selectedInvitation.value.id}/respond`, {
      method: 'POST',
      body: {
        response: response.value,
        comment: comment.value || undefined
      }
    })
    
    if (result.success) {
      // Remove from list
      invitations.value = invitations.value.filter(i => i.id !== selectedInvitation.value!.id)
      showRespondDialog.value = false
    }
  } catch (err) {
    console.error('Error responding to invitation:', err)
    error.value = 'Failed to respond to invitation'
  } finally {
    respondingTo.value = null
  }
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  fetchInvitations()
})
</script>

<template>
  <v-card v-if="loading || invitations.length > 0" :elevation="$vuetify.display.smAndDown ? 1 : 2" class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="primary">mdi-email-receive</v-icon>
      <span>Pending Invitations</span>
      <v-chip v-if="invitations.length > 0" class="ml-2" color="primary" size="small">
        {{ invitations.length }}
      </v-chip>
    </v-card-title>

    <v-card-text :class="$vuetify.display.smAndDown ? 'pa-2' : 'pa-4'">
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

      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-4 text-grey">Loading invitations...</p>
      </div>

      <div v-else-if="invitations.length === 0" class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1">mdi-mailbox-open-outline</v-icon>
        <p class="mt-4 text-grey">No pending invitations</p>
      </div>

      <v-list v-else class="pa-0">
        <v-list-item
          v-for="invitation in invitations"
          :key="invitation.id"
          class="mb-2"
          :class="$vuetify.display.smAndDown ? 'px-2' : 'px-4'"
        >
          <template #prepend>
            <v-avatar color="primary" class="mr-3">
              <v-icon>mdi-calendar-star</v-icon>
            </v-avatar>
          </template>

          <v-list-item-title class="mb-1">
            <strong>{{ invitation.event?.name || 'Event' }}</strong>
          </v-list-item-title>
          
          <v-list-item-subtitle class="mb-2">
            <div v-if="invitation.event?.location" class="mb-1">
              <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
              {{ invitation.event.location }}
            </div>
            <div v-if="invitation.event?.startDate">
              <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
              {{ formatDate(invitation.event.startDate) }}
            </div>
            <div class="text-caption mt-1">
              Invited {{ formatDate(invitation.invitedAt) }}
            </div>
          </v-list-item-subtitle>

          <template #append>
            <div class="d-flex flex-column flex-sm-row ga-2">
              <v-btn
                color="success"
                variant="tonal"
                size="small"
                prepend-icon="mdi-check"
                :loading="respondingTo === invitation.id"
                :block="$vuetify.display.smAndDown"
                @click="openRespondDialog(invitation, 'accept')"
              >
                Accept
              </v-btn>
              <v-btn
                color="error"
                variant="tonal"
                size="small"
                prepend-icon="mdi-close"
                :loading="respondingTo === invitation.id"
                :block="$vuetify.display.smAndDown"
                @click="openRespondDialog(invitation, 'decline')"
              >
                Decline
              </v-btn>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>

    <!-- Respond Dialog -->
    <v-dialog
      v-model="showRespondDialog"
      :max-width="$vuetify.display.smAndDown ? '100%' : '500'"
      :fullscreen="$vuetify.display.smAndDown"
    >
      <v-card>
        <v-card-title>
          {{ response === 'accept' ? 'Accept' : 'Decline' }} Invitation
        </v-card-title>
        
        <v-card-text>
          <p v-if="selectedInvitation" class="mb-4">
            <strong>{{ selectedInvitation.event?.name }}</strong>
          </p>
          
          <v-textarea
            v-model="comment"
            label="Add a comment (optional)"
            variant="outlined"
            density="comfortable"
            rows="3"
            :hint="response === 'accept' ? 'Share why you\'re excited to attend' : 'Share why you can\'t attend'"
          />
        </v-card-text>

        <v-card-actions class="flex-column flex-sm-row">
          <v-spacer />
          <v-btn
            variant="outlined"
            :block="$vuetify.display.smAndDown"
            class="mb-2 mb-sm-0 mr-sm-2"
            @click="showRespondDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            :color="response === 'accept' ? 'success' : 'error'"
            :loading="respondingTo !== null"
            :block="$vuetify.display.smAndDown"
            @click="respondToInvitation"
          >
            {{ response === 'accept' ? 'Accept' : 'Decline' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

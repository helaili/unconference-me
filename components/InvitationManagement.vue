<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  eventId: string
}

defineProps<Props>()
const emit = defineEmits<{
  invite: [emails: string[]]
}>()

const showInviteDialog = ref(false)
const emailInput = ref('')
const emailList = ref<string[]>([])
const sending = ref(false)
const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

const parseEmails = (input: string): string[] => {
  // Support comma, semicolon, space, or newline-separated emails
  return input
    .split(/[,;\s\n]+/)
    .map(email => email.trim())
    .filter(email => email.length > 0)
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const addEmailsFromInput = () => {
  const emails = parseEmails(emailInput.value)
  const validEmails = emails.filter(isValidEmail)
  
  emailList.value = [...new Set([...emailList.value, ...validEmails])]
  emailInput.value = ''
}

const removeEmail = (email: string) => {
  emailList.value = emailList.value.filter(e => e !== email)
}

const openInviteDialog = () => {
  emailList.value = []
  emailInput.value = ''
  successMessage.value = null
  errorMessage.value = null
  showInviteDialog.value = true
}

const sendInvitations = async () => {
  if (emailList.value.length === 0) {
    errorMessage.value = 'Please add at least one email address'
    return
  }

  sending.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    emit('invite', emailList.value)
    successMessage.value = `Invitations sent to ${emailList.value.length} recipient(s)`
    
    // Close dialog after 2 seconds
    setTimeout(() => {
      showInviteDialog.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to send invitations:', error)
    errorMessage.value = 'Failed to send invitations'
  } finally {
    sending.value = false
  }
}

const importFromCSV = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    const lines = text.split('\n')
    
    // Parse CSV - assume first line is header or email column
    const emails: string[] = []
    lines.forEach(line => {
      const cells = line.split(',').map(cell => cell.trim())
      // Try to find email in any column
      cells.forEach(cell => {
        if (isValidEmail(cell)) {
          emails.push(cell)
        }
      })
    })
    
    emailList.value = [...new Set([...emailList.value, ...emails])]
  }
  
  reader.readAsText(file)
  
  // Reset input to allow re-selecting same file
  target.value = ''
}
</script>

<template>
  <v-card :elevation="$vuetify.display.smAndDown ? 1 : 2">
    <v-card-title class="d-flex justify-space-between align-center flex-column flex-sm-row">
      <span class="mb-2 mb-sm-0">Invitations</span>
      <v-btn
        color="primary"
        prepend-icon="mdi-email-multiple"
        :block="$vuetify.display.smAndDown"
        @click="openInviteDialog"
      >
        Send Invitations
      </v-btn>
    </v-card-title>

    <v-card-text :class="$vuetify.display.smAndDown ? 'pa-2' : 'pa-4'">
      <p class="text-body-2 text-grey">
        Send event invitations to participants via email. You can enter multiple email addresses 
        or import them from a CSV file.
      </p>

      <v-divider class="my-4" />

      <div class="d-flex align-center">
        <v-icon size="large" color="primary" class="mr-3">mdi-information</v-icon>
        <div>
          <div class="text-body-2 font-weight-medium">Quick Tips</div>
          <div class="text-caption text-grey">
            Invitations include event details and a registration link
          </div>
        </div>
      </div>
    </v-card-text>

    <!-- Send Invitations Dialog -->
    <v-dialog
      v-model="showInviteDialog"
      :max-width="$vuetify.display.smAndDown ? '100%' : '700'"
      :fullscreen="$vuetify.display.smAndDown"
    >
      <v-card>
        <v-card-title>Send Invitations</v-card-title>
        
        <v-card-text :class="$vuetify.display.smAndDown ? 'pa-3' : 'pa-4'">
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

          <v-textarea
            v-model="emailInput"
            label="Email Addresses"
            hint="Enter email addresses separated by commas, spaces, or new lines"
            variant="outlined"
            density="comfortable"
            rows="3"
            class="mb-2"
            @keyup.enter.prevent="addEmailsFromInput"
          />

          <div class="d-flex flex-column flex-sm-row ga-2 mb-4">
            <v-btn
              variant="outlined"
              prepend-icon="mdi-plus"
              :block="$vuetify.display.smAndDown"
              @click="addEmailsFromInput"
            >
              Add Emails
            </v-btn>

            <v-btn
              variant="outlined"
              prepend-icon="mdi-file-upload"
              :block="$vuetify.display.smAndDown"
              @click="() => ($refs.csvInput as HTMLInputElement)?.click()"
            >
              Import CSV
            </v-btn>
            <input
              ref="csvInput"
              type="file"
              accept=".csv"
              style="display: none"
              @change="importFromCSV"
            >
          </div>

          <v-divider class="my-4" />

          <div v-if="emailList.length > 0">
            <div class="text-subtitle-2 mb-2">
              Recipients ({{ emailList.length }})
            </div>
            
            <v-chip
              v-for="email in emailList"
              :key="email"
              closable
              class="ma-1"
              @click:close="removeEmail(email)"
            >
              {{ email }}
            </v-chip>
          </div>

          <div v-else class="text-center py-4">
            <v-icon size="48" color="grey">mdi-email-outline</v-icon>
            <p class="text-grey mt-2">No recipients added yet</p>
          </div>
        </v-card-text>

        <v-card-actions class="flex-column flex-sm-row">
          <v-spacer />
          <v-btn
            variant="outlined"
            :block="$vuetify.display.smAndDown"
            class="mb-2 mb-sm-0 mr-sm-2"
            :disabled="sending"
            @click="showInviteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="sending"
            :disabled="emailList.length === 0"
            :block="$vuetify.display.smAndDown"
            @click="sendInvitations"
          >
            Send {{ emailList.length }} Invitation{{ emailList.length !== 1 ? 's' : '' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

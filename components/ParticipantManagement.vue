<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Participant } from '~/types/participant'
import type { User } from '~/types/user'

interface Props {
  eventId: string
  participants: Participant[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  refresh: []
  register: [userId: string]
  update: [id: string, updates: Partial<Participant>]
  delete: [id: string]
}>()

const search = ref('')
const showRegisterDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedParticipant = ref<Participant | null>(null)
const saving = ref(false)
const loadingUsers = ref(false)

// Available users to register
const availableUsers = ref<User[]>([])
const selectedUserId = ref<string | null>(null)

const editForm = ref({
  status: 'registered' as const
})

const filteredParticipants = computed(() => {
  if (!search.value) return props.participants
  
  const searchLower = search.value.toLowerCase()
  return props.participants.filter(p => 
    p.firstname.toLowerCase().includes(searchLower) ||
    p.lastname.toLowerCase().includes(searchLower) ||
    p.email.toLowerCase().includes(searchLower)
  )
})

// Filter users that are not already participants
const unregisteredUsers = computed(() => {
  const participantUserIds = new Set(props.participants.map(p => p.userId).filter(Boolean))
  return availableUsers.value.filter(u => !participantUserIds.has(u.id))
})

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Registered', key: 'registrationDate', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const }
]

const participantItems = computed(() => {
  return filteredParticipants.value.map(p => ({
    ...p,
    name: `${p.firstname} ${p.lastname}`
  }))
})

const fetchAvailableUsers = async () => {
  loadingUsers.value = true
  try {
    const response = await $fetch('/api/users')
    if (response.success && response.users) {
      availableUsers.value = response.users as User[]
    }
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    loadingUsers.value = false
  }
}

const openRegisterDialog = async () => {
  await fetchAvailableUsers()
  selectedUserId.value = null
  showRegisterDialog.value = true
}

const openEditDialog = (participant: Participant) => {
  selectedParticipant.value = participant
  editForm.value = {
    status: participant.status
  }
  showEditDialog.value = true
}

const openDeleteDialog = (participant: Participant) => {
  selectedParticipant.value = participant
  showDeleteDialog.value = true
}

const registerUser = async () => {
  if (!selectedUserId.value) return
  
  saving.value = true
  try {
    emit('register', selectedUserId.value)
    showRegisterDialog.value = false
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchAvailableUsers()
})

const updateParticipant = async () => {
  if (!selectedParticipant.value) return
  
  saving.value = true
  try {
    emit('update', selectedParticipant.value.id, editForm.value)
    showEditDialog.value = false
  } finally {
    saving.value = false
  }
}

const deleteParticipant = async () => {
  if (!selectedParticipant.value) return
  
  saving.value = true
  try {
    emit('delete', selectedParticipant.value.id)
    showDeleteDialog.value = false
  } finally {
    saving.value = false
  }
}

const getStatusColor = (status: string) => {
  const colors = {
    registered: 'blue',
    confirmed: 'green',
    'checked-in': 'purple',
    cancelled: 'red'
  }
  return colors[status as keyof typeof colors] || 'grey'
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<template>
  <v-card :elevation="$vuetify.display.smAndDown ? 1 : 2">
    <v-card-title class="d-flex justify-space-between align-center flex-column flex-sm-row">
      <span class="mb-2 mb-sm-0">Participants</span>
      <v-btn
        color="primary"
        prepend-icon="mdi-account-plus"
        :block="$vuetify.display.smAndDown"
        @click="openRegisterDialog"
      >
        Register User
      </v-btn>
    </v-card-title>

    <v-card-text :class="$vuetify.display.smAndDown ? 'pa-2' : 'pa-4'">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search participants"
        variant="outlined"
        density="comfortable"
        clearable
        class="mb-4"
      />

      <v-data-table
        :headers="headers"
        :items="participantItems"
        :search="search"
        :mobile-breakpoint="$vuetify.display.smAndDown ? 960 : 0"
        density="comfortable"
      >
        <template #[`item.status`]="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <template #[`item.registrationDate`]="{ item }">
          {{ formatDate(item.registrationDate) }}
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="d-flex justify-end ga-2">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="openEditDialog(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="openDeleteDialog(item)"
            />
          </div>
        </template>

        <template #[`no-data`]>
          <div class="text-center py-4">
            <v-icon size="48" color="grey">mdi-account-off</v-icon>
            <p class="text-grey mt-2">No participants found</p>
          </div>
        </template>
      </v-data-table>
    </v-card-text>

    <!-- Register User Dialog -->
    <v-dialog
      v-model="showRegisterDialog"
      :max-width="$vuetify.display.smAndDown ? '100%' : '600'"
      :fullscreen="$vuetify.display.smAndDown"
    >
      <v-card>
        <v-card-title>Register User to Event</v-card-title>
        <v-card-text>
          <v-progress-circular v-if="loadingUsers" indeterminate class="ma-4" />
          <div v-else>
            <p class="text-body-2 mb-4">
              Select an existing user to register for this event. Only users who are not already registered are shown.
            </p>
            <v-select
              v-model="selectedUserId"
              label="Select User"
              :items="unregisteredUsers"
              item-title="email"
              item-value="id"
              variant="outlined"
              density="comfortable"
              :disabled="unregisteredUsers.length === 0"
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps">
                  <v-list-item-title>{{ item.raw.firstname }} {{ item.raw.lastname }}</v-list-item-title>
                  <v-list-item-subtitle>{{ item.raw.email }}</v-list-item-subtitle>
                </v-list-item>
              </template>
              <template #selection="{ item }">
                {{ item.raw.firstname }} {{ item.raw.lastname }} ({{ item.raw.email }})
              </template>
            </v-select>
            <v-alert v-if="unregisteredUsers.length === 0" type="info" variant="tonal" class="mt-4">
              All users are already registered for this event
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions class="flex-column flex-sm-row">
          <v-spacer />
          <v-btn
            variant="outlined"
            :block="$vuetify.display.smAndDown"
            class="mb-2 mb-sm-0 mr-sm-2"
            @click="showRegisterDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!selectedUserId"
            :block="$vuetify.display.smAndDown"
            @click="registerUser"
          >
            Register
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Participant Dialog -->
    <v-dialog
      v-model="showEditDialog"
      :max-width="$vuetify.display.smAndDown ? '100%' : '500'"
      :fullscreen="$vuetify.display.smAndDown"
    >
      <v-card>
        <v-card-title>Update Participant Status</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="updateParticipant">
            <p v-if="selectedParticipant" class="text-body-2 mb-4">
              <strong>{{ selectedParticipant.firstname }} {{ selectedParticipant.lastname }}</strong><br>
              {{ selectedParticipant.email }}
            </p>
            <v-select
              v-model="editForm.status"
              label="Status"
              :items="['registered', 'confirmed', 'checked-in', 'cancelled']"
              variant="outlined"
              density="comfortable"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="flex-column flex-sm-row">
          <v-spacer />
          <v-btn
            variant="outlined"
            :block="$vuetify.display.smAndDown"
            class="mb-2 mb-sm-0 mr-sm-2"
            @click="showEditDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :block="$vuetify.display.smAndDown"
            @click="updateParticipant"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Participant Dialog -->
    <v-dialog
      v-model="showDeleteDialog"
      :max-width="$vuetify.display.smAndDown ? '100%' : '400'"
    >
      <v-card>
        <v-card-title>Delete Participant</v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete this participant?</p>
          <p v-if="selectedParticipant" class="font-weight-bold mt-2">
            {{ selectedParticipant.firstname }} {{ selectedParticipant.lastname }}
          </p>
        </v-card-text>
        <v-card-actions class="flex-column flex-sm-row">
          <v-spacer />
          <v-btn
            variant="outlined"
            :block="$vuetify.display.smAndDown"
            class="mb-2 mb-sm-0 mr-sm-2"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="saving"
            :block="$vuetify.display.smAndDown"
            @click="deleteParticipant"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

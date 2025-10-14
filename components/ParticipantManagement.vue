<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Participant } from '~/types/participant'

interface Props {
  eventId: string
  participants: Participant[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  refresh: []
  add: [participant: Omit<Participant, 'id' | 'eventId' | 'createdAt' | 'updatedAt'>]
  update: [id: string, updates: Partial<Participant>]
  delete: [id: string]
}>()

const search = ref('')
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedParticipant = ref<Participant | null>(null)
const saving = ref(false)

// Form state
const newParticipant = ref({
  email: '',
  firstname: '',
  lastname: '',
  status: 'registered' as const
})

const editForm = ref({
  email: '',
  firstname: '',
  lastname: '',
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

const openAddDialog = () => {
  newParticipant.value = {
    email: '',
    firstname: '',
    lastname: '',
    status: 'registered'
  }
  showAddDialog.value = true
}

const openEditDialog = (participant: Participant) => {
  selectedParticipant.value = participant
  editForm.value = {
    email: participant.email,
    firstname: participant.firstname,
    lastname: participant.lastname,
    status: participant.status
  }
  showEditDialog.value = true
}

const openDeleteDialog = (participant: Participant) => {
  selectedParticipant.value = participant
  showDeleteDialog.value = true
}

const addParticipant = async () => {
  saving.value = true
  try {
    emit('add', {
      ...newParticipant.value,
      registrationDate: new Date()
    })
    showAddDialog.value = false
  } finally {
    saving.value = false
  }
}

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
        @click="openAddDialog"
      >
        Add Participant
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
        <template #item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <template #item.registrationDate="{ item }">
          {{ formatDate(item.registrationDate) }}
        </template>

        <template #item.actions="{ item }">
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

        <template #no-data>
          <div class="text-center py-4">
            <v-icon size="48" color="grey">mdi-account-off</v-icon>
            <p class="text-grey mt-2">No participants found</p>
          </div>
        </template>
      </v-data-table>
    </v-card-text>

    <!-- Add Participant Dialog -->
    <v-dialog
      v-model="showAddDialog"
      :max-width="$vuetify.display.smAndDown ? '100%' : '600'"
      :fullscreen="$vuetify.display.smAndDown"
    >
      <v-card>
        <v-card-title>Add Participant</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="addParticipant">
            <v-text-field
              v-model="newParticipant.firstname"
              label="First Name"
              variant="outlined"
              density="comfortable"
              required
              class="mb-2"
            />
            <v-text-field
              v-model="newParticipant.lastname"
              label="Last Name"
              variant="outlined"
              density="comfortable"
              required
              class="mb-2"
            />
            <v-text-field
              v-model="newParticipant.email"
              label="Email"
              type="email"
              variant="outlined"
              density="comfortable"
              required
              class="mb-2"
            />
            <v-select
              v-model="newParticipant.status"
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
            @click="showAddDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :block="$vuetify.display.smAndDown"
            @click="addParticipant"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Participant Dialog -->
    <v-dialog
      v-model="showEditDialog"
      :max-width="$vuetify.display.smAndDown ? '100%' : '600'"
      :fullscreen="$vuetify.display.smAndDown"
    >
      <v-card>
        <v-card-title>Edit Participant</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="updateParticipant">
            <v-text-field
              v-model="editForm.firstname"
              label="First Name"
              variant="outlined"
              density="comfortable"
              required
              class="mb-2"
            />
            <v-text-field
              v-model="editForm.lastname"
              label="Last Name"
              variant="outlined"
              density="comfortable"
              required
              class="mb-2"
            />
            <v-text-field
              v-model="editForm.email"
              label="Email"
              type="email"
              variant="outlined"
              density="comfortable"
              required
              class="mb-2"
            />
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

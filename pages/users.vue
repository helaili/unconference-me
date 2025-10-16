<script setup lang="ts">
import type { User } from '~/types/user'

definePageMeta({
  layout: 'default',
  requiresAdmin: true
})

useSeoMeta({
  title: 'User Management',
  description: 'Manage users and participants'
})

const users = ref<User[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const showAddDialog = ref(false)
const showCsvDialog = ref(false)
const showLinkDialog = ref(false)
const selectedUser = ref<User | null>(null)
const generatedLink = ref('')

const newUser = reactive({
  firstname: '',
  lastname: '',
  email: '',
  role: 'Participant' as 'Admin' | 'Organizer' | 'Participant'
})

const csvData = ref('')

// Load users
async function loadUsers() {
  isLoading.value = true
  error.value = null
  try {
    const response = await $fetch<{ users: User[] }>('/api/users')
    users.value = response.users
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to load users'
  } finally {
    isLoading.value = false
  }
}

// Add single user
async function addUser() {
  try {
    await $fetch('/api/users', {
      method: 'POST',
      body: newUser
    })
    showAddDialog.value = false
    newUser.firstname = ''
    newUser.lastname = ''
    newUser.email = ''
    newUser.role = 'Participant'
    await loadUsers()
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to add user'
  }
}

// Import users from CSV
async function importCsv() {
  try {
    const response = await $fetch<{ imported: number }>('/api/users/import-csv', {
      method: 'POST',
      body: { csvData: csvData.value }
    })
    showCsvDialog.value = false
    csvData.value = ''
    await loadUsers()
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to import users'
  }
}

// Generate registration link
async function generateLink(user: User) {
  try {
    const response = await $fetch<{ link: string; token: string }>('/api/users/generate-link', {
      method: 'POST',
      body: { email: user.email }
    })
    selectedUser.value = user
    generatedLink.value = response.link
    showLinkDialog.value = true
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to generate link'
  }
}

// Copy link to clipboard
async function copyLink() {
  try {
    await navigator.clipboard.writeText(generatedLink.value)
  } catch (e) {
    console.error('Failed to copy link:', e)
  }
}

// Delete user
async function deleteUser(email: string) {
  if (!confirm('Are you sure you want to delete this user?')) return
  
  try {
    await $fetch(`/api/users/${encodeURIComponent(email)}`, {
      method: 'DELETE'
    })
    await loadUsers()
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to delete user'
  }
}

onMounted(() => {
  loadUsers()
})

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'role' },
  { title: 'Registered', key: 'registered' },
  { title: 'Actions', key: 'actions', sortable: false }
]

const userItems = computed(() => {
  return users.value.map(user => ({
    name: `${user.firstname} ${user.lastname}`,
    email: user.email,
    role: user.role || 'Participant',
    registered: user.password ? 'Yes' : 'No',
    user
  }))
})
</script>

<template>
  <v-container :class="$vuetify.display.smAndDown ? 'pa-2' : 'pa-4'">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center flex-wrap">
            <span :class="$vuetify.display.smAndDown ? 'text-h6' : 'text-h5'">User Management</span>
            <div class="d-flex ga-2" :class="$vuetify.display.smAndDown ? 'mt-2' : ''">
              <v-btn
                color="primary"
                @click="showAddDialog = true"
              >
                <v-icon left>mdi-account-plus</v-icon>
                Add User
              </v-btn>
              <v-btn
                color="secondary"
                @click="showCsvDialog = true"
              >
                <v-icon left>mdi-file-upload</v-icon>
                Import CSV
              </v-btn>
            </div>
          </v-card-title>

          <v-card-text>
            <v-alert v-if="error" type="error" dismissible @click:close="error = null">
              {{ error }}
            </v-alert>

            <v-data-table
              :headers="headers"
              :items="userItems"
              :loading="isLoading"
              :mobile-breakpoint="$vuetify.display.thresholds.sm"
            >
              <template #item.actions="{ item }">
                <div class="d-flex flex-column flex-sm-row ga-2">
                  <v-btn
                    size="small"
                    color="primary"
                    variant="text"
                    @click="generateLink(item.user)"
                  >
                    <v-icon>mdi-link</v-icon>
                    <span v-if="!$vuetify.display.smAndDown">Link</span>
                  </v-btn>
                  <v-btn
                    size="small"
                    color="error"
                    variant="text"
                    @click="deleteUser(item.user.email)"
                  >
                    <v-icon>mdi-delete</v-icon>
                    <span v-if="!$vuetify.display.smAndDown">Delete</span>
                  </v-btn>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add User Dialog -->
    <v-dialog v-model="showAddDialog" :max-width="$vuetify.display.smAndDown ? '100%' : '500'">
      <v-card>
        <v-card-title>Add User</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newUser.firstname"
            label="First Name"
            required
          />
          <v-text-field
            v-model="newUser.lastname"
            label="Last Name"
            required
          />
          <v-text-field
            v-model="newUser.email"
            label="Email"
            type="email"
            required
          />
          <v-select
            v-model="newUser.role"
            label="Role"
            :items="['Admin', 'Organizer', 'Participant']"
            required
          />
        </v-card-text>
        <v-card-actions class="flex-column flex-sm-row">
          <v-spacer />
          <v-btn
            variant="text"
            :block="$vuetify.display.smAndDown"
            class="mb-2 mb-sm-0"
            @click="showAddDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :block="$vuetify.display.smAndDown"
            @click="addUser"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- CSV Import Dialog -->
    <v-dialog v-model="showCsvDialog" :max-width="$vuetify.display.smAndDown ? '100%' : '600'">
      <v-card>
        <v-card-title>Import Users from CSV</v-card-title>
        <v-card-text>
          <p class="mb-4">
            Upload a CSV file with columns: firstname, lastname, email
          </p>
          <v-textarea
            v-model="csvData"
            label="CSV Data"
            placeholder="firstname,lastname,email&#10;John,Doe,john@example.com&#10;Jane,Smith,jane@example.com"
            rows="10"
            required
          />
        </v-card-text>
        <v-card-actions class="flex-column flex-sm-row">
          <v-spacer />
          <v-btn
            variant="text"
            :block="$vuetify.display.smAndDown"
            class="mb-2 mb-sm-0"
            @click="showCsvDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :block="$vuetify.display.smAndDown"
            @click="importCsv"
          >
            Import
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Registration Link Dialog -->
    <v-dialog v-model="showLinkDialog" :max-width="$vuetify.display.smAndDown ? '100%' : '600'">
      <v-card>
        <v-card-title>Registration Link</v-card-title>
        <v-card-text>
          <p class="mb-4">
            Send this link to {{ selectedUser?.firstname }} {{ selectedUser?.lastname }}:
          </p>
          <v-text-field
            v-model="generatedLink"
            label="Registration Link"
            readonly
            :append-icon="'mdi-content-copy'"
            @click:append="copyLink"
          />
        </v-card-text>
        <v-card-actions class="flex-column flex-sm-row">
          <v-spacer />
          <v-btn
            color="primary"
            :block="$vuetify.display.smAndDown"
            class="mb-2 mb-sm-0 mr-sm-2"
            @click="copyLink"
          >
            <v-icon left>mdi-content-copy</v-icon>
            Copy Link
          </v-btn>
          <v-btn
            variant="text"
            :block="$vuetify.display.smAndDown"
            @click="generateLink(selectedUser!)"
          >
            <v-icon left>mdi-refresh</v-icon>
            Regenerate
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

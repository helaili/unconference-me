<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'public'
})

useSeoMeta({
  title: 'Register',
  description: 'Register for the unconference'
})

const route = useRoute()
const router = useRouter()

const form = ref({
  email: '',
  firstname: '',
  lastname: '',
  password: '',
  confirmPassword: '',
  invitationToken: ''
})

const loading = ref(false)
const error = ref<string | null>(null)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Extract token and email from URL query parameters
onMounted(() => {
  const token = route.query.token as string
  const email = route.query.email as string
  
  if (token) {
    form.value.invitationToken = token
  }
  if (email) {
    form.value.email = email
  }
})

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 8 || 'Password must be at least 8 characters'
]

const confirmPasswordRules = [
  (v: string) => !!v || 'Please confirm your password',
  (v: string) => v === form.value.password || 'Passwords do not match'
]

const handleRegister = async () => {
  error.value = null
  
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }
  
  loading.value = true
  
  try {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        email: form.value.email,
        firstname: form.value.firstname,
        lastname: form.value.lastname,
        password: form.value.password,
        invitationToken: form.value.invitationToken || undefined,
        eventId: route.query.eventId as string || undefined
      }
    })
    
    if (response.success) {
      // Redirect to dashboard
      await router.push('/dashboard')
    }
  } catch (err: any) {
    console.error('Registration error:', err)
    error.value = err.data?.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container :class="$vuetify.display.smAndDown ? 'pa-2' : 'pa-4'">
    <v-row justify="center">
      <v-col cols="12" md="6" lg="4">
        <v-card :elevation="$vuetify.display.smAndDown ? 1 : 2">
          <v-card-title :class="$vuetify.display.smAndDown ? 'text-h5' : 'text-h4'">
            Register
          </v-card-title>
          
          <v-card-text :class="$vuetify.display.smAndDown ? 'pa-3' : 'pa-6'">
            <v-alert
              v-if="form.invitationToken"
              type="info"
              variant="tonal"
              class="mb-4"
            >
              You have been invited to register for this event
            </v-alert>
            
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
            
            <v-form @submit.prevent="handleRegister">
              <v-text-field
                v-model="form.email"
                label="Email"
                type="email"
                :readonly="!!form.invitationToken"
                variant="outlined"
                density="comfortable"
                required
                class="mb-2"
              />
              
              <v-text-field
                v-model="form.firstname"
                label="First Name"
                variant="outlined"
                density="comfortable"
                required
                class="mb-2"
              />
              
              <v-text-field
                v-model="form.lastname"
                label="Last Name"
                variant="outlined"
                density="comfortable"
                required
                class="mb-2"
              />
              
              <v-text-field
                v-model="form.password"
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                variant="outlined"
                density="comfortable"
                :rules="passwordRules"
                required
                class="mb-2"
              />
              
              <v-text-field
                v-model="form.confirmPassword"
                label="Confirm Password"
                :type="showConfirmPassword ? 'text' : 'password'"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
                variant="outlined"
                density="comfortable"
                :rules="confirmPasswordRules"
                required
                class="mb-4"
              />
              
              <v-btn
                type="submit"
                color="primary"
                :loading="loading"
                :block="$vuetify.display.smAndDown"
                size="large"
              >
                Register
              </v-btn>
            </v-form>
            
            <v-divider class="my-4" />
            
            <p class="text-center text-body-2">
              Already have an account?
              <NuxtLink to="/login" class="text-primary">
                Login here
              </NuxtLink>
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

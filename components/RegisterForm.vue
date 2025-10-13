<script setup lang="ts">
    import { userService } from '~/services/userService'
    
    const runtimeConfig = useRuntimeConfig()
    const useGitHubAuth = runtimeConfig.public.authUrl === '/auth/github'
    const route = useRoute()
    
    const registrationData = reactive({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        confirmPassword: '',
        token: route.query.token as string || ''
    })
    
    const registerError = ref(false)
    const registerErrorMessage = ref('')
    const formValid = ref(false)
    const isLoading = ref(false)
    const userDataLoaded = ref(false)

    // Pre-fill form if token is present and user data exists
    onMounted(async () => {
        if (registrationData.token) {
            try {
                const response = await $fetch<{ 
                    success: boolean
                    user?: { firstname: string; lastname: string; email: string }
                }>(`/api/auth/check-token?token=${registrationData.token}`)
                
                if (response.success && response.user) {
                    registrationData.firstname = response.user.firstname || ''
                    registrationData.lastname = response.user.lastname || ''
                    registrationData.email = response.user.email || ''
                    userDataLoaded.value = true
                }
            } catch (error) {
                console.error('Error checking token:', error)
            }
        }
    })

    async function register() {
        registerError.value = false
        registerErrorMessage.value = ''
        isLoading.value = true
        
        try {
            if (useGitHubAuth) {
                // Redirect to GitHub OAuth with registration token
                const params = new URLSearchParams()
                if (registrationData.token) {
                    params.append('token', registrationData.token)
                }
                if (registrationData.firstname) {
                    params.append('firstname', registrationData.firstname)
                }
                if (registrationData.lastname) {
                    params.append('lastname', registrationData.lastname)
                }
                if (registrationData.email) {
                    params.append('email', registrationData.email)
                }
                
                const redirectUrl = `/auth/github?${params.toString()}`
                await navigateTo(redirectUrl, { external: true })
            } else {
                // Local registration
                const res = await $fetch<{
                    success?: boolean
                    error?: boolean
                    message: string
                }>('/api/auth/register', {
                    method: 'POST',
                    body: {
                        firstname: registrationData.firstname,
                        lastname: registrationData.lastname,
                        email: registrationData.email,
                        password: registrationData.password,
                        token: registrationData.token
                    }
                })

                if (res?.success) {
                    // Redirect to login page on successful registration
                    await navigateTo('/login')
                } else {
                    registerError.value = true
                    registerErrorMessage.value = res?.message || 'Registration failed. Please try again.'
                }
            }
        } catch (error: any) {
            registerError.value = true
            registerErrorMessage.value = error?.data?.message || error?.message || 'Registration failed. Please try again.'
        } finally {
            if (!useGitHubAuth) {
                isLoading.value = false
            }
        }
    }

    const passwordMatch = computed(() => {
        if (!registrationData.password || !registrationData.confirmPassword) return true
        return registrationData.password === registrationData.confirmPassword
    })
</script>

<template>
    <v-card class="pa-5" :class="$vuetify.display.smAndDown ? 'mx-2' : ''" max-width="500" min-width="300">
        <v-card-title class="text-h5 mb-4">Register for Event</v-card-title>
        <v-form ref="registerForm" v-model="formValid" @submit.prevent="register">
            <v-text-field
                v-model="registrationData.firstname"
                label="First Name"
                data-testid="firstname-input"
                placeholder="First Name"
                required
                :rules="[(v: string) => !!v || 'First name is required']"
                class="mb-2"
            />
            <v-text-field
                v-model="registrationData.lastname"
                label="Last Name"
                data-testid="lastname-input"
                placeholder="Last Name"
                required
                :rules="[(v: string) => !!v || 'Last name is required']"
                class="mb-2"
            />
            <v-text-field
                v-model="registrationData.email"
                label="Email"
                type="email"
                data-testid="email-input"
                placeholder="Email"
                required
                :disabled="userDataLoaded"
                :rules="[(v: string) => !!v || 'Email is required', (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid']"
                class="mb-2"
            />
            <template v-if="!useGitHubAuth">
                <v-text-field
                    v-model="registrationData.password"
                    label="Password"
                    type="password"
                    data-testid="password-input"
                    placeholder="Password"
                    required
                    :rules="[(v: string) => !!v || 'Password is required', (v: string) => v.length >= 8 || 'Password must be at least 8 characters']"
                    class="mb-2"
                />
                <v-text-field
                    v-model="registrationData.confirmPassword"
                    label="Confirm Password"
                    type="password"
                    data-testid="confirm-password-input"
                    placeholder="Confirm Password"
                    required
                    :rules="[
                        (v: string) => !!v || 'Please confirm your password',
                        () => passwordMatch || 'Passwords must match'
                    ]"
                    class="mb-4"
                />
            </template>
            <v-btn 
                :disabled="!formValid || isLoading || (!useGitHubAuth && !passwordMatch)" 
                :loading="isLoading"
                type="submit" 
                data-testid="register-submit-button"
                color="primary" 
                :block="$vuetify.display.smAndDown"
                class="mb-4"
            >
                {{ useGitHubAuth ? 'Register with GitHub' : 'Register' }}
            </v-btn>
        </v-form>
        <v-alert
            v-if="registerError"
            type="error"
            variant="tonal"
            class="mt-2 mb-4"
            data-testid="register-error"
            :text="registerErrorMessage"
        />
        <div class="text-center mt-2">
            <p>
                Already have an account? 
                <a :href="useGitHubAuth ? '/auth/github' : '/login'" class="text-primary" data-testid="login-link">
                    Login here
                </a>
            </p>
        </div>
    </v-card>
</template>

<script setup lang="ts">
    const runtimeConfig = useRuntimeConfig()
    const devMode = ref(runtimeConfig.public.devMode);
    const defaultUserName = ref(runtimeConfig.public.defaultUserName);
    const defaultUserPassword = ref(runtimeConfig.public.defaultUserPassword);

    const { loggedIn, user, fetch: refreshSession } = useUserSession()
    const credentials = reactive({
        email: devMode.value ? defaultUserName.value : '',
        password: devMode.value ? defaultUserPassword.value : '',
    })
    const loginError = ref(false)
    const formValid = ref(false)

    async function login() {
        useFetch('/api/auth/login', {
            method: 'POST',
            body: credentials
        }).then(async () => {
            // Refresh the session on client-side and redirect to the home page
            await refreshSession()
            await navigateTo('/dashboard')
        }).catch((error) => {
            loginError.value = true
            console.error('Login failed', error)
        })
    }
</script>

<template>
    <v-card class="pa-5" max-width="400" min-width="300">
        <v-form ref="loginForm" v-model="formValid" @submit.prevent="login">
            <v-text-field
                v-model="credentials.email"
                label="Email"
                type="email"
                data-testid="email-input"
                placeholder="Email"
                required
                :rules="[(v: string) => !!v || 'Email is required', (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid']"
                class="mb-4"
            />
            <v-text-field
                v-model="credentials.password"
                label="Password"
                type="password"
                data-testid="password-input"
                placeholder="Password"
                required
                :rules="[(v: string) => !!v || 'Password is required', (v: string) => v.length >= 6 || 'Password must be at least 6 characters']"
                class="mb-4"
            />
            <v-btn 
                :disabled="!formValid" 
                type="submit" 
                data-testid="login-submit-button"
                color="primary" 
                block
            >
                Login
            </v-btn>
        </v-form>
        <div v-if="loginError" class="error mt-4 text-center">Login failed</div>
        <div v-else-if="loggedIn" class="mt-4 text-center">
            <p>Welcome, {{ (user as any)?.name }}</p>
        </div>
        <div v-else class="mt-4 text-center">
            <p>Please log in</p>
        </div>
    </v-card>
</template>

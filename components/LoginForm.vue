<script setup lang="ts">
    const runtimeConfig = useRuntimeConfig()
    const devMode = ref(runtimeConfig.public.devMode);

    const { loggedIn, user, fetch: refreshSession } = useUserSession()
    const credentials = reactive({
        email: devMode.value ? 'helaili@github.com' : '',
        password: devMode.value ? 'Eurocats2025' : '',
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
        <v-form @submit.prevent="login" ref="loginForm" v-model="formValid">
            <v-text-field
                v-model="credentials.email"
                label="Email"
                type="email"
                data-testid="email-input"
                placeholder="Email"
                required
                :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'E-mail must be valid']"
                class="mb-4"
            ></v-text-field>
            <v-text-field
                v-model="credentials.password"
                label="Password"
                type="password"
                data-testid="password-input"
                placeholder="Password"
                required
                :rules="[v => !!v || 'Password is required', v => v.length >= 6 || 'Password must be at least 6 characters']"
                class="mb-4"
            ></v-text-field>
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

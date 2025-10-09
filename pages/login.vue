<script setup lang="ts">
    definePageMeta({
        layout: 'public'
    })

    useSeoMeta({
        title: 'Login',
        description: 'Login to access your unconference dashboard'
    })
</script>

<template>
    <div class="d-flex flex-column align-center justify-center" style="min-height: 100vh;">
        <LoginForm />
    </div>
</template>

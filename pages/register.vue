<script setup lang="ts">
    definePageMeta({
        layout: 'public'
    })

    useSeoMeta({
        title: 'Register',
        description: 'Register for the unconference event'
    })
</script>

<template>
    <div class="d-flex flex-column align-center justify-center" style="min-height: 100vh;">
        <RegisterForm />
    </div>
</template>

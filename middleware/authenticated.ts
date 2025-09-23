interface User {
    name: string;
    email: string;
    role?: string;
}

export default defineNuxtRouteMiddleware((to) => {
    const { loggedIn, user } = useUserSession()
    
    // redirect the user to the login screen if they're not authenticated
    if (!loggedIn.value) {
        return navigateTo('/login')
    }

    // check if the page requires admin role
    if (to.meta.requiresAdmin && (user.value as User)?.role !== 'Admin') {
        // if user is not an admin, redirect to dashboard or show access denied
        return navigateTo('/dashboard')
    }
})

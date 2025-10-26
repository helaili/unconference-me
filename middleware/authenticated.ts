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
    if (to.meta.requiresAdmin) {
        const userRole = (user.value as User)?.role
        // Allow both Admin and Organizer roles for admin pages
        if (userRole !== 'Admin' && userRole !== 'Organizer') {
            // if user is not an admin or organizer, redirect to dashboard or show access denied
            return navigateTo('/dashboard')
        }
    }
})

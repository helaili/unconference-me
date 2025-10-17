import { eventService } from '../../services'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const session = await requireUserSession(event)
    
    console.log('Fetching events list for authenticated user', { user: session.user })
    
    // Get events using the service layer (automatically uses CosmosDB or mock data based on environment)
    const events = await eventService.findAll()
    
    return {
      success: true,
      events
    }
  } catch (error) {
    console.error('Error fetching events:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch events',
      data: { 
        success: false, 
        message: 'An error occurred while fetching events'
      }
    })
  }
})

import { BaseService } from './baseService'
import { mockData } from '../../tests/helpers/mock-manager'
import type { Event } from '../../types/event'

export class EventService extends BaseService<Event> {
  protected readonly containerName = 'events'
  protected readonly partitionKey = '/id'

  async findAll(): Promise<Event[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Event>('SELECT * FROM c')
      } else {
        return mockData.getEvents()
      }
    } catch (error) {
      console.error('Failed to fetch all events', error)
      throw error
    }
  }

  async findById(id: string): Promise<Event | null> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.cosmosReadById(id, id)
      } else {
        return mockData.getEventById(id) || null
      }
    } catch (error) {
      console.error('Failed to fetch event by id', { id, error })
      throw error
    }
  }

  async findByStatus(status: string): Promise<Event[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Event>(
          'SELECT * FROM c WHERE c.status = @status',
          [{ name: '@status', value: status }]
        )
      } else {
        return mockData.getEvents().filter(event => event.status === status)
      }
    } catch (error) {
      console.error('Failed to fetch events by status', { status, error })
      throw error
    }
  }

  async create(eventData: Omit<Event, 'id'>): Promise<Event> {
    try {
      const event: Event = {
        ...eventData,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (await this.isUsingCosmosDB()) {
        return await this.cosmosUpsert(event)
      } else {
        mockData.addEvent(event)
        return event
      }
    } catch (error) {
      console.error('Failed to create event', { eventData, error })
      throw error
    }
  }

  async update(id: string, updates: Partial<Event>): Promise<Event> {
    try {
      if (await this.isUsingCosmosDB()) {
        console.log('Updating event in CosmosDB', { id, updates })
        const existingEvent = await this.findById(id)
        if (!existingEvent) {
          throw new Error(`Event with id ${id} not found`)
        }

        // Deep merge settings object if it exists in updates
        const mergedSettings = updates.settings 
          ? { ...existingEvent.settings, ...updates.settings }
          : existingEvent.settings

        const updatedEvent: Event = {
          ...existingEvent,
          ...updates,
          settings: mergedSettings,
          id, // Ensure id doesn't change
          updatedAt: new Date()
        }

        return await this.cosmosUpsert(updatedEvent)
      } else {
        console.log('Updating event in Mock Data', { id, updates })
        const success = mockData.updateEvent(id, { ...updates, updatedAt: new Date() })
        if (!success) {
          throw new Error(`Event with id ${id} not found`)
        }
        
        const updatedEvent = mockData.getEventById(id)
        if (!updatedEvent) {
          throw new Error('Failed to retrieve updated event')
        }
        return updatedEvent
      }
    } catch (error) {
      console.error('Failed to update event', { id, updates, error })
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.cosmosDelete(id, id)
      } else {
        return mockData.removeEvent(id)
      }
    } catch (error) {
      console.error('Failed to delete event', { id, error })
      throw error
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const event = await this.findById(id)
      return event !== null
    } catch (error) {
      console.error('Failed to check if event exists', { id, error })
      throw error
    }
  }

  /**
   * Generate a unique generic invitation code for an event
   */
  generateGenericCode(): string {
    // Generate a random 12-character code (alphanumeric, mixed case)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let code = ''
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * Update event with new generic invitation code
   */
  async updateGenericInvitationCode(eventId: string): Promise<Event> {
    const genericCode = this.generateGenericCode()
    return await this.update(eventId, {
      settings: {
        genericInvitationCode: genericCode
      }
    })
  }

  /**
   * Validate generic invitation code for an event
   */
  async validateGenericCode(eventId: string, code: string): Promise<{
    valid: boolean
    event?: Event
    reason?: string
  }> {
    try {
      const event = await this.findById(eventId)
      
      if (!event) {
        return { valid: false, reason: 'Event not found' }
      }

      if (!event.settings?.registrationMode || event.settings.registrationMode === 'open') {
        return { valid: true, event } // Open registration, no code needed
      }

      if (event.settings.registrationMode === 'generic-code') {
        if (!event.settings.genericInvitationCode) {
          return { valid: false, reason: 'Event does not have a generic invitation code configured' }
        }

        if (event.settings.genericInvitationCode !== code) {
          return { valid: false, reason: 'Invalid invitation code' }
        }
      }

      return { valid: true, event }
    } catch (error) {
      console.error('Error validating generic code', { eventId, error })
      return { valid: false, reason: 'Failed to validate invitation code' }
    }
  }

  private generateId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const eventService = new EventService()
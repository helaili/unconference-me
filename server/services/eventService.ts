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

  private generateId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const eventService = new EventService()
import { BaseService } from './baseService'
import { mockData } from '../../tests/helpers/mock-manager'
import type { Organizer } from '../../types/organizer'

export class OrganizerService extends BaseService<Organizer> {
  protected readonly containerName = 'organizers'
  protected readonly partitionKey = '/eventId'

  async findAll(): Promise<Organizer[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Organizer>('SELECT * FROM c')
      } else {
        return mockData.getOrganizers()
      }
    } catch (error) {
      console.error('Failed to fetch all organizers', { error })
      throw error
    }
  }

  async findById(id: string): Promise<Organizer | null> {
    try {
      if (await this.isUsingCosmosDB()) {
        // For organizers, we need to find by id but partition key is eventId
        // So we need to query instead of direct read
        const organizers = await this.executeCosmosQuery<Organizer>(
          'SELECT * FROM c WHERE c.id = @id',
          [{ name: '@id', value: id }]
        )
        return organizers.length > 0 ? organizers[0]! : null
      } else {
        return mockData.getOrganizerById(id) || null
      }
    } catch (error) {
      console.error('Failed to fetch organizer by id', { id, error })
      throw error
    }
  }

  async findByEventId(eventId: string): Promise<Organizer[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Organizer>(
          'SELECT * FROM c WHERE c.eventId = @eventId',
          [{ name: '@eventId', value: eventId }]
        )
      } else {
        return mockData.getOrganizersByEventId(eventId)
      }
    } catch (error) {
      console.error('Failed to fetch organizers by event id', { eventId, error })
      throw error
    }
  }

  async findByUserId(userId: string): Promise<Organizer[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Organizer>(
          'SELECT * FROM c WHERE c.userId = @userId',
          [{ name: '@userId', value: userId }]
        )
      } else {
        return mockData.getOrganizersByUserId(userId)
      }
    } catch (error) {
      console.error('Failed to fetch organizers by user id', { userId, error })
      throw error
    }
  }

  async findByEmail(email: string): Promise<Organizer[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Organizer>(
          'SELECT * FROM c WHERE c.email = @email',
          [{ name: '@email', value: email }]
        )
      } else {
        return mockData.getOrganizers().filter(o => o.email === email)
      }
    } catch (error) {
      console.error('Failed to fetch organizers by email', { email, error })
      throw error
    }
  }

  async findByStatus(status: string): Promise<Organizer[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Organizer>(
          'SELECT * FROM c WHERE c.status = @status',
          [{ name: '@status', value: status }]
        )
      } else {
        return mockData.getOrganizers().filter(o => o.status === status)
      }
    } catch (error) {
      console.error('Failed to fetch organizers by status', { status, error })
      throw error
    }
  }

  /**
   * Check if a user is an organizer for a specific event
   */
  async isOrganizer(eventId: string, userId?: string, email?: string): Promise<boolean> {
    try {
      if (!userId && !email) {
        return false
      }

      const organizers = await this.findByEventId(eventId)
      return organizers.some(o => 
        o.status === 'active' && 
        ((userId && o.userId === userId) || (email && o.email === email))
      )
    } catch (error) {
      console.error('Failed to check if user is organizer', { eventId, userId, email, error })
      return false
    }
  }

  /**
   * Get organizer for a specific event and user
   */
  async getOrganizerForEvent(eventId: string, userId?: string, email?: string): Promise<Organizer | null> {
    try {
      if (!userId && !email) {
        return null
      }

      const organizers = await this.findByEventId(eventId)
      return organizers.find(o => 
        o.status === 'active' && 
        ((userId && o.userId === userId) || (email && o.email === email))
      ) || null
    } catch (error) {
      console.error('Failed to get organizer for event', { eventId, userId, email, error })
      return null
    }
  }

  async create(organizerData: Omit<Organizer, 'id'>): Promise<Organizer> {
    try {
      const organizer: Organizer = {
        ...organizerData,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (await this.isUsingCosmosDB()) {
        return await this.cosmosUpsert(organizer)
      } else {
        mockData.addOrganizer(organizer)
        return organizer
      }
    } catch (error) {
      console.error('Failed to create organizer', { organizerData, error })
      throw error
    }
  }

  async update(id: string, updates: Partial<Organizer>): Promise<Organizer> {
    try {
      if (await this.isUsingCosmosDB()) {
        const existingOrganizer = await this.findById(id)
        if (!existingOrganizer) {
          throw new Error(`Organizer with id ${id} not found`)
        }

        const updatedOrganizer: Organizer = {
          ...existingOrganizer,
          ...updates,
          id, // Ensure id doesn't change
          updatedAt: new Date()
        }

        return await this.cosmosUpsert(updatedOrganizer)
      } else {
        const success = mockData.updateOrganizer(id, { ...updates, updatedAt: new Date() })
        if (!success) {
          throw new Error(`Organizer with id ${id} not found`)
        }
        
        const updatedOrganizer = mockData.getOrganizerById(id)
        if (!updatedOrganizer) {
          throw new Error('Failed to retrieve updated organizer')
        }
        return updatedOrganizer
      }
    } catch (error) {
      console.error('Failed to update organizer', { id, updates, error })
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (await this.isUsingCosmosDB()) {
        // For organizers, we need to find the organizer first to get the partition key
        const organizer = await this.findById(id)
        if (!organizer) {
          return false
        }
        return await this.cosmosDelete(id, organizer.eventId)
      } else {
        return mockData.removeOrganizer(id)
      }
    } catch (error) {
      console.error('Failed to delete organizer', { id, error })
      throw error
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const organizer = await this.findById(id)
      return organizer !== null
    } catch (error) {
      console.error('Failed to check if organizer exists', { id, error })
      throw error
    }
  }

  private generateId(): string {
    return `organizer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const organizerService = new OrganizerService()

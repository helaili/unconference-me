import { BaseService } from './baseService'
import { mockData } from '../../tests/helpers/mock-manager'
import type { Participant } from '../../types/participant'

export class ParticipantService extends BaseService<Participant> {
  protected readonly containerName = 'participants'
  protected readonly partitionKey = '/eventId'

  async findAll(): Promise<Participant[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Participant>('SELECT * FROM c')
      } else {
        return mockData.getParticipants()
      }
    } catch (error) {
      console.error('Failed to fetch all participants', { error })
      throw error
    }
  }

  async findById(id: string): Promise<Participant | null> {
    try {
      if (await this.isUsingCosmosDB()) {
        // For participants, we need to find by id but partition key is eventId
        // So we need to query instead of direct read
        const participants = await this.executeCosmosQuery<Participant>(
          'SELECT * FROM c WHERE c.id = @id',
          [{ name: '@id', value: id }]
        )
        return participants.length > 0 ? participants[0]! : null
      } else {
        return mockData.getParticipants().find(p => p.id === id) || null
      }
    } catch (error) {
      console.error('Failed to fetch participant by id', { id, error })
      throw error
    }
  }

  async findByEventId(eventId: string): Promise<Participant[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Participant>(
          'SELECT * FROM c WHERE c.eventId = @eventId',
          [{ name: '@eventId', value: eventId }]
        )
      } else {
        return mockData.getParticipants().filter(p => p.eventId === eventId)
      }
    } catch (error) {
      console.error('Failed to fetch participants by event id', { eventId, error })
      throw error
    }
  }

  async findByUserId(userId: string): Promise<Participant[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Participant>(
          'SELECT * FROM c WHERE c.userId = @userId',
          [{ name: '@userId', value: userId }]
        )
      } else {
        return mockData.getParticipants().filter(p => p.userId === userId)
      }
    } catch (error) {
      console.error('Failed to fetch participants by user id', { userId, error })
      throw error
    }
  }

  async findByEventIdAndEmail(eventId: string, email: string): Promise<Participant | null> {
    try {
      if (await this.isUsingCosmosDB()) {
        const participants = await this.executeCosmosQuery<Participant>(
          'SELECT * FROM c WHERE c.eventId = @eventId AND c.email = @email',
          [
            { name: '@eventId', value: eventId },
            { name: '@email', value: email }
          ]
        )
        return participants.length > 0 ? participants[0]! : null
      } else {
        return mockData.getParticipants().find(p => p.eventId === eventId && p.email === email) || null
      }
    } catch (error) {
      console.error('Failed to fetch participant by event id and email', { eventId, email, error })
      throw error
    }
  }

  async findByStatus(status: string): Promise<Participant[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Participant>(
          'SELECT * FROM c WHERE c.status = @status',
          [{ name: '@status', value: status }]
        )
      } else {
        return mockData.getParticipants().filter(p => p.status === status)
      }
    } catch (error) {
      console.error('Failed to fetch participants by status', { status, error })
      throw error
    }
  }

  async create(participantData: Omit<Participant, 'id'>): Promise<Participant> {
    try {
      const participant: Participant = {
        ...participantData,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (await this.isUsingCosmosDB()) {
        return await this.cosmosUpsert(participant)
      } else {
        mockData.addParticipant(participant)
        return participant
      }
    } catch (error) {
      console.error('Failed to create participant', { participantData, error })
      throw error
    }
  }

  async update(id: string, updates: Partial<Participant>): Promise<Participant> {
    try {
      if (await this.isUsingCosmosDB()) {
        const existingParticipant = await this.findById(id)
        if (!existingParticipant) {
          throw new Error(`Participant with id ${id} not found`)
        }

        const updatedParticipant: Participant = {
          ...existingParticipant,
          ...updates,
          id, // Ensure id doesn't change
          updatedAt: new Date()
        }

        return await this.cosmosUpsert(updatedParticipant)
      } else {
        const success = mockData.updateParticipant(id, { ...updates, updatedAt: new Date() })
        if (!success) {
          throw new Error(`Participant with id ${id} not found`)
        }
        
        const updatedParticipant = mockData.getParticipants().find(p => p.id === id)
        if (!updatedParticipant) {
          throw new Error('Failed to retrieve updated participant')
        }
        return updatedParticipant
      }
    } catch (error) {
      console.error('Failed to update participant', { id, updates, error })
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (await this.isUsingCosmosDB()) {
        // For participants, we need to find the participant first to get the partition key
        const participant = await this.findById(id)
        if (!participant) {
          return false
        }
        return await this.cosmosDelete(id, participant.eventId)
      } else {
        return mockData.removeParticipant(id)
      }
    } catch (error) {
      console.error('Failed to delete participant', { id, error })
      throw error
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const participant = await this.findById(id)
      return participant !== null
    } catch (error) {
      console.error('Failed to check if participant exists', { id, error })
      throw error
    }
  }

  private generateId(): string {
    return `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const participantService = new ParticipantService()
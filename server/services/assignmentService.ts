import { BaseService } from './baseService'
import { getMockDataStoreFromContext } from '../utils/mock-data-context'
import type { ParticipantAssignment } from '../../types/participant'

export class AssignmentService extends BaseService<ParticipantAssignment> {
  protected readonly containerName = 'assignments'
  protected readonly partitionKey = '/eventId'

  async findAll(): Promise<ParticipantAssignment[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<ParticipantAssignment>('SELECT * FROM c')
      } else {
        return getMockDataStoreFromContext().getAssignments()
      }
    } catch (error) {
      console.error('Failed to fetch all assignments', { error })
      throw error
    }
  }

  async findById(id: string): Promise<ParticipantAssignment | null> {
    try {
      if (await this.isUsingCosmosDB()) {
        // For assignments, we need to find by id but partition key is eventId
        // So we need to query instead of direct read
        const assignments = await this.executeCosmosQuery<ParticipantAssignment>(
          'SELECT * FROM c WHERE c.id = @id',
          [{ name: '@id', value: id }]
        )
        return assignments.length > 0 ? assignments[0]! : null
      } else {
        return getMockDataStoreFromContext().getAssignments().find(a => a.id === id) || null
      }
    } catch (error) {
      console.error('Failed to fetch assignment by id', { id, error })
      throw error
    }
  }

  async findByEventId(eventId: string): Promise<ParticipantAssignment[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<ParticipantAssignment>(
          'SELECT * FROM c WHERE c.eventId = @eventId',
          [{ name: '@eventId', value: eventId }]
        )
      } else {
        return getMockDataStoreFromContext().getAssignmentsByEventId(eventId)
      }
    } catch (error) {
      console.error('Failed to fetch assignments by event id', { eventId, error })
      throw error
    }
  }

  async findByParticipantId(participantId: string): Promise<ParticipantAssignment[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<ParticipantAssignment>(
          'SELECT * FROM c WHERE c.participantId = @participantId',
          [{ name: '@participantId', value: participantId }]
        )
      } else {
        return getMockDataStoreFromContext().getAssignments().filter(a => a.participantId === participantId)
      }
    } catch (error) {
      console.error('Failed to fetch assignments by participant id', { participantId, error })
      throw error
    }
  }

  async findByTopicId(topicId: string): Promise<ParticipantAssignment[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<ParticipantAssignment>(
          'SELECT * FROM c WHERE c.topicId = @topicId',
          [{ name: '@topicId', value: topicId }]
        )
      } else {
        return getMockDataStoreFromContext().getAssignments().filter(a => a.topicId === topicId)
      }
    } catch (error) {
      console.error('Failed to fetch assignments by topic id', { topicId, error })
      throw error
    }
  }

  async findByRound(eventId: string, roundNumber: number): Promise<ParticipantAssignment[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<ParticipantAssignment>(
          'SELECT * FROM c WHERE c.eventId = @eventId AND c.roundNumber = @roundNumber',
          [
            { name: '@eventId', value: eventId },
            { name: '@roundNumber', value: roundNumber }
          ]
        )
      } else {
        return getMockDataStoreFromContext().getAssignments().filter(a => 
          a.eventId === eventId && a.roundNumber === roundNumber
        )
      }
    } catch (error) {
      console.error('Failed to fetch assignments by round', { eventId, roundNumber, error })
      throw error
    }
  }

  async findByStatus(status: string): Promise<ParticipantAssignment[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<ParticipantAssignment>(
          'SELECT * FROM c WHERE c.status = @status',
          [{ name: '@status', value: status }]
        )
      } else {
        return getMockDataStoreFromContext().getAssignments().filter(a => a.status === status)
      }
    } catch (error) {
      console.error('Failed to fetch assignments by status', { status, error })
      throw error
    }
  }

  async create(assignmentData: Omit<ParticipantAssignment, 'id'>): Promise<ParticipantAssignment> {
    try {
      const assignment: ParticipantAssignment = {
        ...assignmentData,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (await this.isUsingCosmosDB()) {
        return await this.cosmosUpsert(assignment)
      } else {
        getMockDataStoreFromContext().addAssignment(assignment)
        return assignment
      }
    } catch (error) {
      console.error('Failed to create assignment', { assignmentData, error })
      throw error
    }
  }

  async update(id: string, updates: Partial<ParticipantAssignment>): Promise<ParticipantAssignment> {
    try {
      if (await this.isUsingCosmosDB()) {
        const existingAssignment = await this.findById(id)
        if (!existingAssignment) {
          throw new Error(`Assignment with id ${id} not found`)
        }

        const updatedAssignment: ParticipantAssignment = {
          ...existingAssignment,
          ...updates,
          id, // Ensure id doesn't change
          updatedAt: new Date()
        }

        return await this.cosmosUpsert(updatedAssignment)
      } else {
        const success = getMockDataStoreFromContext().updateAssignment(id, { ...updates, updatedAt: new Date() })
        if (!success) {
          throw new Error(`Assignment with id ${id} not found`)
        }
        
        const updatedAssignment = getMockDataStoreFromContext().getAssignments().find(a => a.id === id)
        if (!updatedAssignment) {
          throw new Error('Failed to retrieve updated assignment')
        }
        return updatedAssignment
      }
    } catch (error) {
      console.error('Failed to update assignment', { id, updates, error })
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (await this.isUsingCosmosDB()) {
        // For assignments, we need to find the assignment first to get the partition key
        const assignment = await this.findById(id)
        if (!assignment) {
          return false
        }
        return await this.cosmosDelete(id, assignment.eventId)
      } else {
        return getMockDataStoreFromContext().removeAssignment(id)
      }
    } catch (error) {
      console.error('Failed to delete assignment', { id, error })
      throw error
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const assignment = await this.findById(id)
      return assignment !== null
    } catch (error) {
      console.error('Failed to check if assignment exists', { id, error })
      throw error
    }
  }

  async bulkCreate(assignments: Omit<ParticipantAssignment, 'id'>[]): Promise<ParticipantAssignment[]> {
    try {
      const results: ParticipantAssignment[] = []
      
      for (const assignmentData of assignments) {
        const assignment = await this.create(assignmentData)
        results.push(assignment)
      }
      
      return results
    } catch (error) {
      console.error('Failed to bulk create assignments', { count: assignments.length, error })
      throw error
    }
  }

  private generateId(): string {
    return `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const assignmentService = new AssignmentService()
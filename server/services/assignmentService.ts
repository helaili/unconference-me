import { BaseService } from './baseService'
import { mockData } from '../../tests/helpers/mock-manager'
import type { ParticipantAssignment } from '../../types/participant'

export class AssignmentService extends BaseService<ParticipantAssignment> {
  protected readonly containerName = 'assignments'
  protected readonly partitionKey = '/eventId'

  async findAll(): Promise<ParticipantAssignment[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<ParticipantAssignment>('SELECT * FROM c')
      } else {
        return mockData.getAssignments()
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
        return mockData.getAssignments().find(a => a.id === id) || null
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
        return mockData.getAssignmentsByEventId(eventId)
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
        return mockData.getAssignments().filter(a => a.participantId === participantId)
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
        return mockData.getAssignments().filter(a => a.topicId === topicId)
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
        return mockData.getAssignments().filter(a => 
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
        return mockData.getAssignments().filter(a => a.status === status)
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
        mockData.addAssignment(assignment)
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
        const success = mockData.updateAssignment(id, { ...updates, updatedAt: new Date() })
        if (!success) {
          throw new Error(`Assignment with id ${id} not found`)
        }
        
        const updatedAssignment = mockData.getAssignments().find(a => a.id === id)
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
        return mockData.removeAssignment(id)
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

  /**
   * Batch delete assignments by their IDs
   * @param ids Array of assignment IDs to delete
   * @returns Object with total count, success count, and failed IDs
   */
  async batchDelete(ids: string[]): Promise<{ total: number; success: number; failed: string[] }> {
    try {
      let successCount = 0
      const failedIds: string[] = []

      if (await this.isUsingCosmosDB()) {
        // For CosmosDB, we need to get the assignments first to obtain partition keys
        const assignments = await Promise.all(
          ids.map(async (id) => {
            try {
              return await this.findById(id)
            } catch (error) {
              console.warn(`Failed to find assignment ${id} for deletion`, { error })
              return null
            }
          })
        )

        // Delete each assignment with its partition key
        for (let i = 0; i < assignments.length; i++) {
          const assignment = assignments[i]
          const id = ids[i]!
          
          if (!assignment) {
            failedIds.push(id)
            continue
          }

          try {
            const deleted = await this.cosmosDelete(id, assignment.eventId)
            if (deleted) {
              successCount++
            } else {
              failedIds.push(id)
            }
          } catch (error) {
            console.error(`Failed to delete assignment ${id}`, { error })
            failedIds.push(id)
          }
        }
      } else {
        // For mock data, delete each assignment
        for (const id of ids) {
          try {
            const deleted = mockData.removeAssignment(id)
            if (deleted) {
              successCount++
            } else {
              failedIds.push(id)
            }
          } catch (error) {
            console.error(`Failed to delete assignment ${id}`, { error })
            failedIds.push(id)
          }
        }
      }

      return {
        total: ids.length,
        success: successCount,
        failed: failedIds
      }
    } catch (error) {
      console.error('Failed to batch delete assignments', { count: ids.length, error })
      throw error
    }
  }

  /**
   * Delete all assignments for a specific event
   * @param eventId Event ID
   * @returns Number of deleted assignments
   */
  async deleteByEventId(eventId: string): Promise<number> {
    try {
      const assignments = await this.findByEventId(eventId)
      const ids = assignments.map(a => a.id)
      
      if (ids.length === 0) {
        return 0
      }

      const result = await this.batchDelete(ids)
      return result.success
    } catch (error) {
      console.error('Failed to delete assignments by event ID', { eventId, error })
      throw error
    }
  }

  private generateId(): string {
    return `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const assignmentService = new AssignmentService()
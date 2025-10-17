import { BaseService } from './baseService'
import { mockData } from '../../tests/helpers/mock-manager'
import type { Invitation } from '../../types/invitation'

export class InvitationService extends BaseService<Invitation> {
  protected readonly containerName = 'invitations'
  protected readonly partitionKey = '/eventId'

  async findAll(): Promise<Invitation[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Invitation>('SELECT * FROM c')
      } else {
        return mockData.getInvitations()
      }
    } catch (error) {
      console.error('Failed to fetch all invitations', { error })
      throw error
    }
  }

  async findById(id: string): Promise<Invitation | null> {
    try {
      if (await this.isUsingCosmosDB()) {
        const invitations = await this.executeCosmosQuery<Invitation>(
          'SELECT * FROM c WHERE c.id = @id',
          [{ name: '@id', value: id }]
        )
        return invitations.length > 0 ? invitations[0]! : null
      } else {
        return mockData.getInvitations().find(i => i.id === id) || null
      }
    } catch (error) {
      console.error('Failed to fetch invitation by id', { id, error })
      throw error
    }
  }

  async findByEventId(eventId: string): Promise<Invitation[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Invitation>(
          'SELECT * FROM c WHERE c.eventId = @eventId',
          [{ name: '@eventId', value: eventId }]
        )
      } else {
        return mockData.getInvitations().filter(i => i.eventId === eventId)
      }
    } catch (error) {
      console.error('Failed to fetch invitations by event id', { eventId, error })
      throw error
    }
  }

  async findByUserId(userId: string): Promise<Invitation[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Invitation>(
          'SELECT * FROM c WHERE c.userId = @userId',
          [{ name: '@userId', value: userId }]
        )
      } else {
        return mockData.getInvitations().filter(i => i.userId === userId)
      }
    } catch (error) {
      console.error('Failed to fetch invitations by user id', { userId, error })
      throw error
    }
  }

  async findPendingByUserId(userId: string): Promise<Invitation[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Invitation>(
          'SELECT * FROM c WHERE c.userId = @userId AND c.status = @status',
          [
            { name: '@userId', value: userId },
            { name: '@status', value: 'pending' }
          ]
        )
      } else {
        return mockData.getInvitations().filter(i => i.userId === userId && i.status === 'pending')
      }
    } catch (error) {
      console.error('Failed to fetch pending invitations by user id', { userId, error })
      throw error
    }
  }

  async create(invitationData: Omit<Invitation, 'id'>): Promise<Invitation> {
    try {
      const invitation: Invitation = {
        ...invitationData,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (await this.isUsingCosmosDB()) {
        return await this.cosmosUpsert(invitation)
      } else {
        mockData.addInvitation(invitation)
        return invitation
      }
    } catch (error) {
      console.error('Failed to create invitation', { invitationData, error })
      throw error
    }
  }

  async update(id: string, updates: Partial<Invitation>): Promise<Invitation> {
    try {
      if (await this.isUsingCosmosDB()) {
        const existingInvitation = await this.findById(id)
        if (!existingInvitation) {
          throw new Error(`Invitation with id ${id} not found`)
        }

        const updatedInvitation: Invitation = {
          ...existingInvitation,
          ...updates,
          id,
          updatedAt: new Date()
        }

        return await this.cosmosUpsert(updatedInvitation)
      } else {
        const success = mockData.updateInvitation(id, { ...updates, updatedAt: new Date() })
        if (!success) {
          throw new Error(`Invitation with id ${id} not found`)
        }
        
        const updatedInvitation = mockData.getInvitations().find(i => i.id === id)
        if (!updatedInvitation) {
          throw new Error('Failed to retrieve updated invitation')
        }
        return updatedInvitation
      }
    } catch (error) {
      console.error('Failed to update invitation', { id, updates, error })
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (await this.isUsingCosmosDB()) {
        const invitation = await this.findById(id)
        if (!invitation) {
          return false
        }
        return await this.cosmosDelete(id, invitation.eventId)
      } else {
        return mockData.removeInvitation(id)
      }
    } catch (error) {
      console.error('Failed to delete invitation', { id, error })
      throw error
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const invitation = await this.findById(id)
      return invitation !== null
    } catch (error) {
      console.error('Failed to check if invitation exists', { id, error })
      throw error
    }
  }

  private generateId(): string {
    return `invitation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const invitationService = new InvitationService()

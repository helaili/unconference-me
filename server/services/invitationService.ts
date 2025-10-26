import { BaseService } from './baseService'
import { getMockDataStoreFromContext } from '../utils/mock-data-context'
import type { Invitation } from '../../types/invitation'

export class InvitationService extends BaseService<Invitation> {
  protected readonly containerName = 'invitations'
  protected readonly partitionKey = '/eventId'

  async findAll(): Promise<Invitation[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Invitation>('SELECT * FROM c')
      } else {
        return getMockDataStoreFromContext().getInvitations()
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
        return getMockDataStoreFromContext().getInvitations().find(i => i.id === id) || null
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
        return getMockDataStoreFromContext().getInvitations().filter(i => i.eventId === eventId)
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
        return getMockDataStoreFromContext().getInvitations().filter(i => i.userId === userId)
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
        return getMockDataStoreFromContext().getInvitations().filter(i => i.userId === userId && i.status === 'pending')
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
        getMockDataStoreFromContext().addInvitation(invitation)
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
        const success = getMockDataStoreFromContext().updateInvitation(id, { ...updates, updatedAt: new Date() })
        if (!success) {
          throw new Error(`Invitation with id ${id} not found`)
        }
        
        const updatedInvitation = getMockDataStoreFromContext().getInvitations().find(i => i.id === id)
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
        return getMockDataStoreFromContext().removeInvitation(id)
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

  /**
   * Find invitation by personal code
   */
  async findByPersonalCode(personalCode: string, eventId: string): Promise<Invitation | null> {
    try {
      if (await this.isUsingCosmosDB()) {
        const invitations = await this.executeCosmosQuery<Invitation>(
          'SELECT * FROM c WHERE c.personalCode = @code AND c.eventId = @eventId',
          [
            { name: '@code', value: personalCode },
            { name: '@eventId', value: eventId }
          ]
        )
        return invitations.length > 0 ? invitations[0]! : null
      } else {
        return getMockDataStoreFromContext().getInvitations().find(
          i => i.personalCode === personalCode && i.eventId === eventId
        ) || null
      }
    } catch (error) {
      console.error('Failed to find invitation by personal code', { personalCode, eventId, error })
      throw error
    }
  }

  /**
   * Generate a unique personal invitation code
   */
  generatePersonalCode(): string {
    // Generate a random 8-character code (alphanumeric, uppercase)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude ambiguous characters
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * Create invitation with personal code
   */
  async createWithPersonalCode(
    eventId: string,
    userId: string,
    invitedBy: string,
    expiryDays: number = 30
  ): Promise<Invitation> {
    const personalCode = this.generatePersonalCode()
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + expiryDays)

    return await this.create({
      eventId,
      userId,
      status: 'pending',
      invitedBy,
      invitedAt: new Date(),
      personalCode,
      personalCodeExpiry: expiryDate
    })
  }

  /**
   * Validate personal invitation code
   */
  async validatePersonalCode(personalCode: string, eventId: string, userId: string): Promise<{
    valid: boolean
    invitation?: Invitation
    reason?: string
  }> {
    try {
      const invitation = await this.findByPersonalCode(personalCode, eventId)
      
      if (!invitation) {
        return { valid: false, reason: 'Invalid invitation code' }
      }

      if (invitation.userId !== userId) {
        return { valid: false, reason: 'This invitation code is for a different user' }
      }

      if (invitation.status !== 'pending') {
        return { valid: false, reason: 'This invitation has already been used or is no longer valid' }
      }

      if (invitation.personalCodeExpiry && invitation.personalCodeExpiry < new Date()) {
        return { valid: false, reason: 'This invitation code has expired' }
      }

      return { valid: true, invitation }
    } catch (error) {
      console.error('Error validating personal code', { personalCode, eventId, userId, error })
      return { valid: false, reason: 'Failed to validate invitation code' }
    }
  }

  private generateId(): string {
    return `invitation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const invitationService = new InvitationService()

/**
 * Invitation model represents an invitation for a user to participate in an event
 */
export interface Invitation {
  id: string
  eventId: string
  userId: string // Reference to User
  
  // Invitation details
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  invitedBy: string // User ID of admin who sent the invitation
  invitedAt: Date
  respondedAt?: Date
  responseComment?: string // User's comment when accepting/declining
  
  // Personal invitation code for user-specific invitations
  personalCode?: string
  personalCodeExpiry?: Date
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

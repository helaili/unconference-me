export interface User {
  id?: string
  email: string
  firstname: string
  lastname: string
  password?: string
  role?: 'Admin' | 'User' | 'Participant' | 'Organizer'
  githubId?: number
  githubUsername?: string
  invitationToken?: string
  invitationTokenExpiry?: Date
  registeredAt?: Date
  lastLoginAt?: Date
}

export interface InvitationLink {
  userId: string
  email: string
  token: string
  expiresAt: Date
  eventId?: string
  createdAt: Date
}

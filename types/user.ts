export interface User {
  id: string // Document ID, typically same as email
  email: string
  firstname: string
  lastname: string
  password?: string
  role?: 'Admin' | 'Organizer' | 'Participant'
  githubId?: number // GitHub user ID for OAuth
  githubUsername?: string // GitHub username
  registrationToken?: string // Unique token for registration link
  registrationTokenExpiry?: Date // Token expiration date
  deletedAt?: Date // Soft deletion timestamp
  createdAt?: Date
  updatedAt?: Date
}

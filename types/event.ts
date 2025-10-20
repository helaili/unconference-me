/**
 * Event model represents an unconference event with its configuration parameters
 */
export interface Event {
  id: string
  name: string
  description?: string
  location?: string
  startDate: Date
  endDate: Date
  
  // Event configuration parameters
  numberOfRounds: number
  discussionsPerRound: number
  idealGroupSize: number
  minGroupSize: number
  maxGroupSize: number
  
  // Status and metadata
  status: 'draft' | 'published' | 'active' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  
  // Future extensibility for admin controls
  settings?: EventSettings
}

/**
 * Registration modes for event access control
 */
export type RegistrationMode = 'open' | 'personal-code' | 'generic-code'

/**
 * Event settings for future extensibility
 */
export interface EventSettings {
  // Allow participants to rank topics
  enableTopicRanking?: boolean
  
  // Minimum number of topics a participant must rank
  minTopicsToRank?: number
  
  // Allow automatic assignment of participants to discussions
  enableAutoAssignment?: boolean
  
  // Maximum number of topics a participant can propose
  maxTopicsPerParticipant?: number
  
  // Registration settings
  requireApproval?: boolean
  maxParticipants?: number
  
  // Registration mode - controls how users can register for the event
  // - 'open': Anyone can register without invitation
  // - 'personal-code': Users need a personal invitation code (pre-existing users only)
  // - 'generic-code': Users need event-generic code (pre-existing users only)
  registrationMode?: RegistrationMode
  
  // Generic event invitation code (used when registrationMode is 'generic-code')
  genericInvitationCode?: string
  
  // Additional custom settings can be added here
  customSettings?: Record<string, any>
}

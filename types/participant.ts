/**
 * Participant model represents an attendee at an unconference event
 */
export interface Participant {
  id: string
  eventId: string
  
  // User information
  userId?: string // Reference to User if they have an account
  email: string
  firstname: string
  lastname: string
  
  // Participation details
  status: 'registered' | 'confirmed' | 'checked-in' | 'cancelled'
  registrationDate: Date
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  
  // Future extensibility for assignments and preferences
  preferences?: ParticipantPreferences
}

/**
 * Participant preferences for future extensibility
 */
export interface ParticipantPreferences {
  // Topic rankings (for future ranking feature)
  // Map of topic ID to ranking (1 = highest priority)
  topicRankings?: Record<string, number>
  
  // Preferred discussion times or rounds
  preferredRounds?: number[]
  
  // Special requirements or notes
  notes?: string
  
  // Additional custom preferences
  customPreferences?: Record<string, any>
}

/**
 * Participant assignment represents a participant's assignment to a specific discussion
 */
export interface ParticipantAssignment {
  id: string
  participantId: string
  topicId: string
  eventId: string
  
  // Assignment details
  roundNumber: number
  groupNumber: number
  
  // Assignment method
  assignmentMethod: 'manual' | 'automatic' | 'self-selected'
  
  // Status
  status: 'assigned' | 'confirmed' | 'declined' | 'completed'
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

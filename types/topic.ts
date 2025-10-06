/**
 * Topic schedule represents a single scheduling instance of a topic
 * A popular topic can be scheduled in multiple rounds
 */
export interface TopicSchedule {
  roundNumber: number // Which round this topic is scheduled for
  groupNumber: number // Which discussion group in the round
}

/**
 * Topic model represents a discussion topic proposed for an unconference event
 */
export interface Topic {
  id: string
  eventId: string
  title: string
  description?: string
  
  // Topic proposer
  proposedBy: string // Participant ID
  
  // Status and scheduling
  status: 'proposed' | 'approved' | 'scheduled' | 'completed' | 'rejected'
  schedules?: TopicSchedule[] // Topics can be scheduled in multiple rounds if popular
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  
  // Future extensibility for rankings and analytics
  metadata?: TopicMetadata
}

/**
 * Topic metadata for future extensibility
 */
export interface TopicMetadata {
  // Average ranking from participants (for future ranking feature)
  averageRanking?: number
  
  // Number of participants interested in this topic
  interestCount?: number
  
  // Tags or categories
  tags?: string[]
  
  // Additional custom metadata
  customMetadata?: Record<string, any>
}

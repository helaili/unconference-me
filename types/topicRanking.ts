/**
 * Topic ranking represents a participant's ranked preference for topics
 */
export interface TopicRanking {
  id: string
  participantId: string
  eventId: string
  
  // Ranked list of topic IDs in order of preference (index 0 = highest priority)
  rankedTopicIds: string[]
  
  // Timestamp when the participant last viewed the topic list
  lastViewedAt: Date
  
  // Timestamp when the ranking was last updated
  lastRankedAt?: Date
  
  // The minimum number of topics required at the time of last ranking
  // Used to detect when admin increases the minimum requirement
  minTopicsAtLastRanking?: number
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

/**
 * Information about newly created or updated topics since last view
 */
export interface TopicUpdate {
  topicId: string
  isNew: boolean // true if created since last view, false if just updated
  updatedAt: Date
}

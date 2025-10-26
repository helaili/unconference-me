import type { Event } from '../../types/event'
import type { Participant, ParticipantAssignment } from '../../types/participant'
import type { Topic } from '../../types/topic'
import type { TopicRanking } from '../../types/topicRanking'

/**
 * Assignment Algorithm Service
 * 
 * Implements the automated assignment algorithm that assigns participants to discussion topics
 * based on their ranked preferences, event configuration, and group size constraints.
 * 
 * Algorithm Overview:
 * 1. For each round and discussion group:
 *    - Prioritize participants by their topic preferences
 *    - Fill groups respecting min/max/ideal size constraints
 *    - Handle popular topics by repeating them across rounds
 *    - Fall back to random assignment for participants without rankings
 * 2. Balance group sizes to stay within min/max bounds
 * 3. Ensure participants are assigned to different topics each round
 */

export interface AssignmentInput {
  event: Event
  participants: Participant[]
  topics: Topic[]
  rankings: TopicRanking[]
  users?: Map<string, { role?: 'Admin' | 'Organizer' | 'Participant' }> // Optional user role information
  organizerIds?: Set<string> // Optional set of participant IDs who are organizers
}

export interface AssignmentResult {
  assignments: Omit<ParticipantAssignment, 'id'>[]
  statistics: AssignmentStatistics
  warnings: string[]
}

export interface AssignmentStatistics {
  totalParticipants: number
  totalAssignments: number
  participantsFullyAssigned: number
  participantsPartiallyAssigned: number
  participantsNotAssigned: number
  topicsUsed: number
  averageGroupSize: number
  roundStatistics: RoundStatistics[]
  preferredChoiceDistribution?: PreferredChoiceDistribution
  sortedChoiceDistribution?: SortedChoiceDistribution
  topicOccurrenceDistribution?: TopicOccurrenceDistribution
}

/**
 * Distribution of how many participants got assigned to their top N preferred choices
 * where N is the number of rounds
 */
export interface PreferredChoiceDistribution {
  // Number of participants who got X of their top N preferred topics
  // Key is the count (0, 1, 2, ..., numberOfRounds)
  // Value is the number of participants
  distribution: Record<number, number>
  totalParticipantsWithRankings: number
}

/**
 * Distribution of how many participants got assigned to their sorted choices
 * based on all topics they ranked (minTopicsToRank)
 */
export interface SortedChoiceDistribution {
  // Number of participants who got X of their sorted topics assigned
  // Key is the count (0, 1, 2, ..., numberOfRounds)
  // Value is the number of participants
  distribution: Record<number, number>
  totalParticipantsWithRankings: number
  minTopicsToRank: number
}

/**
 * Distribution of topics by how many times they are scheduled across rounds
 */
export interface TopicOccurrenceDistribution {
  // Total number of unique topics scheduled
  totalTopicsPlanned: number
  // Details for each scheduled topic
  topicDetails: Array<{
    topicId: string
    topicTitle: string
    occurrences: number
  }>
}

export interface RoundStatistics {
  roundNumber: number
  topicsScheduled: number
  participantsAssigned: number
  groupSizes: number[]
  averageGroupSize: number
}

export class AssignmentAlgorithmService {
  /**
   * Generate assignments for an event based on participant rankings
   */
  generateAssignments(input: AssignmentInput): AssignmentResult {
    const { event, participants, topics, rankings, users, organizerIds } = input
    const warnings: string[] = []

    // Validate input
    if (participants.length === 0) {
      throw new Error('Cannot generate assignments: no participants')
    }

    if (topics.length === 0) {
      throw new Error('Cannot generate assignments: no approved topics')
    }

    // Filter only active participants, excluding admins and organizers
    const activeParticipants = participants.filter(p => {
      // Check if participant is active
      const isActive = p.status === 'registered' || p.status === 'confirmed' || p.status === 'checked-in'
      if (!isActive) return false

      // Exclude participants who are organizers for this event
      if (organizerIds && organizerIds.has(p.id)) {
        return false
      }

      // Exclude participants whose user account has Admin or Organizer role
      if (p.userId && users) {
        const user = users.get(p.userId)
        if (user?.role === 'Admin' || user?.role === 'Organizer') {
          return false
        }
      }

      return true
    })

    if (activeParticipants.length === 0) {
      throw new Error('Cannot generate assignments: no active participants (after filtering admins and organizers)')
    }

    // Filter only approved topics
    const approvedTopics = topics.filter(t => t.status === 'approved')

    if (approvedTopics.length === 0) {
      throw new Error('Cannot generate assignments: no approved topics')
    }

    // Check if we have enough topics for the discussions
    if (approvedTopics.length < event.discussionsPerRound) {
      warnings.push(`Only ${approvedTopics.length} approved topics available for ${event.discussionsPerRound} discussions per round. Some topics will be repeated.`)
    }

    // Build preference maps
    const preferenceMap = this.buildPreferenceMap(rankings, approvedTopics)
    
    // Calculate popularity scores for topics
    const topicPopularity = this.calculateTopicPopularity(rankings, approvedTopics)

    // Calculate topic demand and create global schedule
    const topicDemand = this.calculateTopicDemand(
      approvedTopics,
      preferenceMap,
      activeParticipants,
      event.numberOfRounds,
      event.maxGroupSize
    )

    // Create global schedule: which topics are offered in which rounds
    const globalSchedule = this.createGlobalSchedule(
      approvedTopics,
      topicDemand,
      topicPopularity,
      event.numberOfRounds,
      event.discussionsPerRound
    )

    // Generate assignments for each round
    const assignments: Omit<ParticipantAssignment, 'id'>[] = []
    const participantRoundAssignments = new Map<string, Set<string>>() // participant -> set of topic IDs they're assigned to
    const roundStats: RoundStatistics[] = []

    for (let round = 1; round <= event.numberOfRounds; round++) {
      const roundTopics = globalSchedule.get(round) || []
      
      if (roundTopics.length === 0) {
        warnings.push(`Round ${round}: No topics scheduled`)
        continue
      }

      const roundAssignments = this.assignRound(
        event,
        activeParticipants,
        roundTopics,
        preferenceMap,
        topicPopularity,
        participantRoundAssignments,
        round
      )

      assignments.push(...roundAssignments.assignments)
      roundStats.push(roundAssignments.statistics)

      if (roundAssignments.warnings.length > 0) {
        warnings.push(...roundAssignments.warnings)
      }
    }

    // Calculate overall statistics
    const statistics = this.calculateStatistics(
      activeParticipants,
      assignments,
      roundStats,
      event,
      preferenceMap,
      rankings,
      topics
    )

    return {
      assignments,
      statistics,
      warnings
    }
  }

  /**
   * Assign participants to topics for a single round
   */
  private assignRound(
    event: Event,
    participants: Participant[],
    topics: Topic[],
    preferenceMap: Map<string, Map<string, number>>,
    topicPopularity: Map<string, number>,
    participantAssignments: Map<string, Set<string>>,
    roundNumber: number
  ): {
    assignments: Omit<ParticipantAssignment, 'id'>[]
    statistics: RoundStatistics
    warnings: string[]
  } {
    const warnings: string[] = []
    const assignments: Omit<ParticipantAssignment, 'id'>[] = []

    // Select topics for this round - prioritize popular topics
    const selectedTopics = this.selectTopicsForRound(
      topics,
      topicPopularity,
      event.discussionsPerRound,
      participantAssignments
    )

    if (selectedTopics.length < event.discussionsPerRound) {
      warnings.push(`Round ${roundNumber}: Only ${selectedTopics.length} topics available, expected ${event.discussionsPerRound}`)
    }

    // Create groups for each topic
    const groups: Map<string, string[]> = new Map() // topicId -> participant IDs
    selectedTopics.forEach(topic => groups.set(topic.id, []))

    // All participants should be assigned in each round, but to different topics
    // We should never assign a participant to the same topic twice across all rounds
    const participantsToAssign = [...participants]

    // Assign participants to topics based on preferences
    const unassignedParticipants = [...participantsToAssign]

    // First pass: assign based on preferences
    for (const participant of participantsToAssign) {
      const preferences = preferenceMap.get(participant.id)
      
      if (preferences) {
        // Try to assign to highest preference available topic
        const sortedPreferences = Array.from(preferences.entries())
          .filter(([topicId]) => selectedTopics.some(t => t.id === topicId))
          .sort((a, b) => a[1] - b[1]) // Lower rank = higher priority

        for (const [topicId] of sortedPreferences) {
          const group = groups.get(topicId)!
          const alreadyAssigned = participantAssignments.get(participant.id)?.has(topicId)

          if (!alreadyAssigned && group.length < event.maxGroupSize) {
            group.push(participant.id)
            unassignedParticipants.splice(unassignedParticipants.indexOf(participant), 1)
            break
          }
        }
      }
    }

    // Second pass: randomly assign remaining participants
    for (const participant of unassignedParticipants) {
      // Find topic with smallest group that's under max size
      const sortedGroups = Array.from(groups.entries())
        .filter(([topicId, group]) => {
          const alreadyAssigned = participantAssignments.get(participant.id)?.has(topicId)
          return !alreadyAssigned && group.length < event.maxGroupSize
        })
        .sort((a, b) => a[1].length - b[1].length)

      if (sortedGroups.length > 0) {
        const [_topicId, group] = sortedGroups[0]!
        group.push(participant.id)
      } else {
        // All groups are full or participant already assigned to all topics
        const assignedTopics = participantAssignments.get(participant.id)
        if (assignedTopics && assignedTopics.size === selectedTopics.length) {
          warnings.push(`Round ${roundNumber}: Participant ${participant.id} already assigned to all ${selectedTopics.length} available topics`)
        } else {
          warnings.push(`Round ${roundNumber}: Unable to assign participant ${participant.id} - all groups are full`)
        }
      }
    }

    // Balance group sizes - move participants from large groups to small groups
    this.balanceGroups(groups, event.minGroupSize, event.idealGroupSize, event.maxGroupSize)

    // Create assignments from groups
    let groupNumber = 1
    const groupSizes: number[] = []

    for (const [topicId, participantIds] of groups.entries()) {
      if (participantIds.length < event.minGroupSize) {
        warnings.push(`Round ${roundNumber}, Group ${groupNumber}: Group size ${participantIds.length} is below minimum ${event.minGroupSize}`)
      }

      groupSizes.push(participantIds.length)

      for (const participantId of participantIds) {
        assignments.push({
          participantId,
          topicId,
          eventId: event.id,
          roundNumber,
          groupNumber,
          assignmentMethod: 'automatic',
          status: 'assigned',
          createdAt: new Date(),
          updatedAt: new Date()
        })

        // Track assignment
        if (!participantAssignments.has(participantId)) {
          participantAssignments.set(participantId, new Set())
        }
        participantAssignments.get(participantId)!.add(topicId)
      }

      groupNumber++
    }

    const statistics: RoundStatistics = {
      roundNumber,
      topicsScheduled: selectedTopics.length,
      participantsAssigned: assignments.length,
      groupSizes,
      averageGroupSize: groupSizes.length > 0 
        ? groupSizes.reduce((a, b) => a + b, 0) / groupSizes.length 
        : 0
    }

    return { assignments, statistics, warnings }
  }

  /**
   * Calculate demand for each topic based on participant preferences
   * Returns a map of topic ID to number of participants who want it in their top N choices
   */
  private calculateTopicDemand(
    topics: Topic[],
    preferenceMap: Map<string, Map<string, number>>,
    participants: Participant[],
    numberOfRounds: number,
    maxGroupSize: number
  ): Map<string, { demand: number; sessionsNeeded: number }> {
    const topicDemand = new Map<string, { demand: number; sessionsNeeded: number }>()

    // Initialize all topics with 0 demand
    topics.forEach(topic => {
      topicDemand.set(topic.id, { demand: 0, sessionsNeeded: 0 })
    })

    // Count how many participants want each topic in their top N preferences
    for (const participant of participants) {
      const preferences = preferenceMap.get(participant.id)
      if (!preferences) continue

      // Get participant's top N preferences (where N = numberOfRounds)
      const topNPreferences = Array.from(preferences.entries())
        .sort((a, b) => a[1] - b[1]) // Sort by rank (lower is better)
        .slice(0, numberOfRounds)
        .map(([topicId]) => topicId)

      // Increment demand for each topic in top N
      for (const topicId of topNPreferences) {
        const current = topicDemand.get(topicId)
        if (current) {
          current.demand++
        }
      }
    }

    // Calculate sessions needed for each topic
    for (const [_topicId, demandInfo] of topicDemand.entries()) {
      if (demandInfo.demand > 0) {
        // Sessions needed = ceil(demand / maxGroupSize)
        demandInfo.sessionsNeeded = Math.ceil(demandInfo.demand / maxGroupSize)
      }
    }

    return topicDemand
  }

  /**
   * Create a global schedule of which topics are offered in which rounds
   * This ensures popular topics are repeated appropriately across rounds
   */
  private createGlobalSchedule(
    topics: Topic[],
    topicDemand: Map<string, { demand: number; sessionsNeeded: number }>,
    topicPopularity: Map<string, number>,
    numberOfRounds: number,
    discussionsPerRound: number
  ): Map<number, Topic[]> {
    const schedule = new Map<number, Topic[]>()

    // Sort topics by demand and popularity
    const sortedTopics = [...topics].sort((a, b) => {
      const demandA = topicDemand.get(a.id)?.demand || 0
      const demandB = topicDemand.get(b.id)?.demand || 0
      
      // First sort by demand
      if (demandA !== demandB) {
        return demandB - demandA
      }
      
      // Then by popularity as tiebreaker
      const popA = topicPopularity.get(a.id) || 0
      const popB = topicPopularity.get(b.id) || 0
      return popB - popA
    })

    // Initialize all rounds with empty arrays
    for (let round = 1; round <= numberOfRounds; round++) {
      schedule.set(round, [])
    }

    // Track how many times each topic has been scheduled
    const topicScheduleCount = new Map<string, number>()
    topics.forEach(topic => topicScheduleCount.set(topic.id, 0))

    // Schedule topics round by round, prioritizing high-demand topics
    for (let round = 1; round <= numberOfRounds; round++) {
      const roundTopics = schedule.get(round)!

      // For each slot in this round
      for (let slot = 0; slot < discussionsPerRound; slot++) {
        // Find the best topic to schedule:
        // 1. Has demand for more sessions
        // 2. Not already scheduled in this round
        // 3. Highest priority (by demand/popularity)
        
        let bestTopic: Topic | null = null
        
        for (const topic of sortedTopics) {
          const demand = topicDemand.get(topic.id)
          const sessionsNeeded = demand?.sessionsNeeded || 1
          const alreadyScheduled = topicScheduleCount.get(topic.id) || 0
          const alreadyInThisRound = roundTopics.some(t => t.id === topic.id)

          // Skip if already scheduled in this round (can't have same topic twice in one round)
          if (alreadyInThisRound) {
            continue
          }

          // Skip if already scheduled enough times
          if (alreadyScheduled >= sessionsNeeded) {
            continue
          }

          // This is our best candidate
          bestTopic = topic
          break
        }

        // Schedule the best topic or fall back to any unscheduled topic
        if (bestTopic) {
          roundTopics.push(bestTopic)
          topicScheduleCount.set(bestTopic.id, (topicScheduleCount.get(bestTopic.id) || 0) + 1)
        } else {
          // All high-demand topics are scheduled, find any topic not in this round
          const fallbackTopic = sortedTopics.find(t => 
            !roundTopics.some(rt => rt.id === t.id)
          )
          if (fallbackTopic) {
            roundTopics.push(fallbackTopic)
            topicScheduleCount.set(fallbackTopic.id, (topicScheduleCount.get(fallbackTopic.id) || 0) + 1)
          }
        }

        // If we've filled all slots, stop
        if (roundTopics.length >= discussionsPerRound) {
          break
        }
      }
    }

    return schedule
  }

  /**
   * Select topics for a round, prioritizing popular topics
   */
  private selectTopicsForRound(
    topics: Topic[],
    topicPopularity: Map<string, number>,
    count: number,
    _participantAssignments: Map<string, Set<string>>
  ): Topic[] {
    // Sort topics by popularity (descending)
    const sortedTopics = [...topics].sort((a, b) => {
      const popA = topicPopularity.get(a.id) || 0
      const popB = topicPopularity.get(b.id) || 0
      return popB - popA
    })

    // Select top N topics, allowing repeats if necessary
    return sortedTopics.slice(0, Math.min(count, sortedTopics.length))
  }

  /**
   * Balance group sizes to be closer to ideal size
   */
  private balanceGroups(
    groups: Map<string, string[]>,
    minSize: number,
    idealSize: number,
    maxSize: number
  ): void {
    // This is a simple balancing algorithm
    // More sophisticated algorithms could be implemented for better optimization

    const groupsArray = Array.from(groups.entries())
    const largeGroups = groupsArray.filter(([_, group]) => group.length > idealSize)
    const smallGroups = groupsArray.filter(([_, group]) => group.length < idealSize && group.length < maxSize)

    // Move participants from large groups to small groups
    for (const [_largeTopicId, largeGroup] of largeGroups) {
      while (largeGroup.length > idealSize && smallGroups.length > 0) {
        const [_smallTopicId, smallGroup] = smallGroups[0]!
        
        if (smallGroup.length >= maxSize) {
          smallGroups.shift()
          continue
        }

        // Move last participant from large group to small group
        const participant = largeGroup.pop()!
        smallGroup.push(participant)

        // Update small groups list
        if (smallGroup.length >= idealSize) {
          smallGroups.shift()
        }
      }
    }
  }

  /**
   * Build a map of participant -> topic -> rank
   */
  private buildPreferenceMap(
    rankings: TopicRanking[],
    topics: Topic[]
  ): Map<string, Map<string, number>> {
    const preferenceMap = new Map<string, Map<string, number>>()

    for (const ranking of rankings) {
      const participantPrefs = new Map<string, number>()
      
      ranking.rankedTopicIds.forEach((topicId, index) => {
        // Only include topics that are in the approved topics list
        if (topics.some(t => t.id === topicId)) {
          participantPrefs.set(topicId, index + 1) // rank starts at 1
        }
      })

      if (participantPrefs.size > 0) {
        preferenceMap.set(ranking.participantId, participantPrefs)
      }
    }

    return preferenceMap
  }

  /**
   * Calculate popularity score for each topic based on rankings
   */
  private calculateTopicPopularity(
    rankings: TopicRanking[],
    topics: Topic[]
  ): Map<string, number> {
    const popularity = new Map<string, number>()

    // Initialize all topics with 0
    topics.forEach(topic => popularity.set(topic.id, 0))

    // Calculate popularity based on ranking positions
    for (const ranking of rankings) {
      ranking.rankedTopicIds.forEach((topicId, index) => {
        if (topics.some(t => t.id === topicId)) {
          // Higher rank = more popularity, weighted by position
          const weight = ranking.rankedTopicIds.length - index
          popularity.set(topicId, (popularity.get(topicId) || 0) + weight)
        }
      })
    }

    return popularity
  }

  /**
   * Calculate overall assignment statistics
   */
  private calculateStatistics(
    participants: Participant[],
    assignments: Omit<ParticipantAssignment, 'id'>[],
    roundStats: RoundStatistics[],
    event: Event,
    preferenceMap: Map<string, Map<string, number>>,
    rankings: TopicRanking[],
    topics: Topic[]
  ): AssignmentStatistics {
    const participantAssignmentCount = new Map<string, number>()

    for (const assignment of assignments) {
      const count = participantAssignmentCount.get(assignment.participantId) || 0
      participantAssignmentCount.set(assignment.participantId, count + 1)
    }

    const expectedAssignments = event.numberOfRounds
    let fullyAssigned = 0
    let partiallyAssigned = 0
    let notAssigned = 0

    for (const participant of participants) {
      const count = participantAssignmentCount.get(participant.id) || 0
      if (count === expectedAssignments) {
        fullyAssigned++
      } else if (count > 0) {
        partiallyAssigned++
      } else {
        notAssigned++
      }
    }

    const topicsUsed = new Set(assignments.map(a => a.topicId)).size
    const totalAssignments = assignments.length
    const averageGroupSize = totalAssignments > 0 
      ? totalAssignments / (event.numberOfRounds * event.discussionsPerRound)
      : 0

    // Calculate preferred choice distribution
    const preferredChoiceDistribution = this.calculatePreferredChoiceDistribution(
      participants,
      assignments,
      preferenceMap,
      event.numberOfRounds
    )

    // Calculate sorted choice distribution
    const sortedChoiceDistribution = this.calculateSortedChoiceDistribution(
      participants,
      assignments,
      rankings,
      event.numberOfRounds,
      event.settings?.minTopicsToRank
    )

    // Calculate topic occurrence distribution
    const topicOccurrenceDistribution = this.calculateTopicOccurrenceDistribution(
      assignments,
      topics
    )

    return {
      totalParticipants: participants.length,
      totalAssignments,
      participantsFullyAssigned: fullyAssigned,
      participantsPartiallyAssigned: partiallyAssigned,
      participantsNotAssigned: notAssigned,
      topicsUsed,
      averageGroupSize,
      roundStatistics: roundStats,
      preferredChoiceDistribution,
      sortedChoiceDistribution,
      topicOccurrenceDistribution
    }
  }

  /**
   * Calculate the distribution of participants based on how many of their top N preferred choices they got
   * where N = numberOfRounds
   */
  private calculatePreferredChoiceDistribution(
    participants: Participant[],
    assignments: Omit<ParticipantAssignment, 'id'>[],
    preferenceMap: Map<string, Map<string, number>>,
    numberOfRounds: number
  ): PreferredChoiceDistribution {
    const distribution: Record<number, number> = {}
    
    // Initialize distribution with zeros
    for (let i = 0; i <= numberOfRounds; i++) {
      distribution[i] = 0
    }

    let totalParticipantsWithRankings = 0

    // For each participant, count how many of their top N preferences they got assigned to
    for (const participant of participants) {
      const preferences = preferenceMap.get(participant.id)
      
      if (!preferences || preferences.size === 0) {
        // Skip participants without rankings
        continue
      }

      totalParticipantsWithRankings++

      // Get participant's assignments
      const participantAssignments = assignments
        .filter(a => a.participantId === participant.id)
        .map(a => a.topicId)

      // Get top N preferences (where N = numberOfRounds)
      const topNPreferences = Array.from(preferences.entries())
        .sort((a, b) => a[1] - b[1]) // Sort by rank (lower is better)
        .slice(0, numberOfRounds)
        .map(([topicId]) => topicId)

      // Count how many of the top N preferences were assigned
      const matchCount = participantAssignments.filter(topicId => 
        topNPreferences.includes(topicId)
      ).length

      distribution[matchCount]++
    }

    return {
      distribution,
      totalParticipantsWithRankings
    }
  }

  /**
   * Calculate the distribution of participants based on how many of their sorted choices they got
   * considering all topics they ranked (up to minTopicsToRank)
   */
  private calculateSortedChoiceDistribution(
    participants: Participant[],
    assignments: Omit<ParticipantAssignment, 'id'>[],
    rankings: TopicRanking[],
    numberOfRounds: number,
    minTopicsToRank?: number
  ): SortedChoiceDistribution {
    const distribution: Record<number, number> = {}
    
    // Initialize distribution with zeros
    for (let i = 0; i <= numberOfRounds; i++) {
      distribution[i] = 0
    }

    let totalParticipantsWithRankings = 0
    const effectiveMinTopicsToRank = minTopicsToRank || 6 // Default to 6 if not set

    // Create a map of participant rankings
    const rankingsMap = new Map<string, TopicRanking>()
    for (const ranking of rankings) {
      rankingsMap.set(ranking.participantId, ranking)
    }

    // For each participant, count how many of their sorted choices they got assigned to
    for (const participant of participants) {
      const ranking = rankingsMap.get(participant.id)
      
      if (!ranking || ranking.rankedTopicIds.length === 0) {
        // Skip participants without rankings
        continue
      }

      totalParticipantsWithRankings++

      // Get participant's assignments
      const participantAssignments = assignments
        .filter(a => a.participantId === participant.id)
        .map(a => a.topicId)

      // Get all ranked topics (up to minTopicsToRank)
      const rankedTopics = ranking.rankedTopicIds.slice(0, effectiveMinTopicsToRank)

      // Count how many of the ranked topics were assigned
      const matchCount = participantAssignments.filter(topicId => 
        rankedTopics.includes(topicId)
      ).length

      distribution[matchCount]++
    }

    return {
      distribution,
      totalParticipantsWithRankings,
      minTopicsToRank: effectiveMinTopicsToRank
    }
  }

  /**
   * Calculate the distribution of topics by how many times they are scheduled across rounds
   */
  private calculateTopicOccurrenceDistribution(
    assignments: Omit<ParticipantAssignment, 'id'>[],
    topics: Topic[]
  ): TopicOccurrenceDistribution {
    // Create a map of topic IDs to titles
    const topicTitles = new Map<string, string>()
    topics.forEach(topic => topicTitles.set(topic.id, topic.title))
    
    // Count unique group sessions (topic + round + group combinations)
    // Each unique combination represents one scheduled session
    const topicGroupSessions = new Map<string, Set<string>>()
    
    for (const assignment of assignments) {
      // Create a unique key for this group session: topicId-roundNumber-groupNumber
      const sessionKey = `${assignment.roundNumber}-${assignment.groupNumber}`
      
      if (!topicGroupSessions.has(assignment.topicId)) {
        topicGroupSessions.set(assignment.topicId, new Set())
      }
      topicGroupSessions.get(assignment.topicId)!.add(sessionKey)
    }

    // Count unique topics (total topics planned)
    const totalTopicsPlanned = topicGroupSessions.size

    // Build topic details array sorted by occurrence count (descending)
    // Occurrences = number of unique group sessions for this topic
    const topicDetails = Array.from(topicGroupSessions.entries())
      .map(([topicId, sessions]) => ({
        topicId,
        topicTitle: topicTitles.get(topicId) || 'Unknown Topic',
        occurrences: sessions.size
      }))
      .sort((a, b) => b.occurrences - a.occurrences)

    return {
      totalTopicsPlanned,
      topicDetails
    }
  }
}

// Export singleton instance
export const assignmentAlgorithmService = new AssignmentAlgorithmService()

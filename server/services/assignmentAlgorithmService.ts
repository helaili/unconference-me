import type { Event } from '../../types/event'
import type { Participant } from '../../types/participant'
import type { Topic } from '../../types/topic'
import type { TopicRanking } from '../../types/topicRanking'
import type { ParticipantAssignment } from '../../types/participant'

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
    const { event, participants, topics, rankings } = input
    const warnings: string[] = []

    // Validate input
    if (participants.length === 0) {
      throw new Error('Cannot generate assignments: no participants')
    }

    if (topics.length === 0) {
      throw new Error('Cannot generate assignments: no approved topics')
    }

    // Filter only active participants
    const activeParticipants = participants.filter(p => 
      p.status === 'registered' || p.status === 'confirmed' || p.status === 'checked-in'
    )

    if (activeParticipants.length === 0) {
      throw new Error('Cannot generate assignments: no active participants')
    }

    // Filter only approved topics
    const approvedTopics = topics.filter(t => t.status === 'approved')

    if (approvedTopics.length === 0) {
      throw new Error('Cannot generate assignments: no approved topics')
    }

    // Check if we have enough topics for the discussions
    const requiredDiscussions = event.numberOfRounds * event.discussionsPerRound
    if (approvedTopics.length < event.discussionsPerRound) {
      warnings.push(`Only ${approvedTopics.length} approved topics available for ${event.discussionsPerRound} discussions per round. Some topics will be repeated.`)
    }

    // Build preference maps
    const preferenceMap = this.buildPreferenceMap(rankings, approvedTopics)
    
    // Calculate popularity scores for topics
    const topicPopularity = this.calculateTopicPopularity(rankings, approvedTopics)

    // Generate assignments for each round
    const assignments: Omit<ParticipantAssignment, 'id'>[] = []
    const participantRoundAssignments = new Map<string, Set<string>>() // participant -> set of topic IDs they're assigned to
    const roundStats: RoundStatistics[] = []

    for (let round = 1; round <= event.numberOfRounds; round++) {
      const roundAssignments = this.assignRound(
        event,
        activeParticipants,
        approvedTopics,
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
      event
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

    // Get participants who haven't been assigned to these topics yet
    const availableParticipants = participants.filter(p => {
      const assigned = participantAssignments.get(p.id) || new Set()
      return !selectedTopics.some(t => assigned.has(t.id))
    })

    // If not enough participants, allow repeats
    let participantsToAssign = [...availableParticipants]
    if (participantsToAssign.length < participants.length * 0.8) {
      participantsToAssign = [...participants]
      warnings.push(`Round ${roundNumber}: Allowing topic repeats due to limited availability`)
    }

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
        const [topicId, group] = sortedGroups[0]!
        group.push(participant.id)
      } else {
        // All groups are full or participant already assigned to all topics
        warnings.push(`Round ${roundNumber}: Unable to assign participant ${participant.id}`)
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
   * Select topics for a round, prioritizing popular topics
   */
  private selectTopicsForRound(
    topics: Topic[],
    topicPopularity: Map<string, number>,
    count: number,
    participantAssignments: Map<string, Set<string>>
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
    for (const [largeTopicId, largeGroup] of largeGroups) {
      while (largeGroup.length > idealSize && smallGroups.length > 0) {
        const [smallTopicId, smallGroup] = smallGroups[0]!
        
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
    event: Event
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

    return {
      totalParticipants: participants.length,
      totalAssignments,
      participantsFullyAssigned: fullyAssigned,
      participantsPartiallyAssigned: partiallyAssigned,
      participantsNotAssigned: notAssigned,
      topicsUsed,
      averageGroupSize,
      roundStatistics: roundStats
    }
  }
}

// Export singleton instance
export const assignmentAlgorithmService = new AssignmentAlgorithmService()

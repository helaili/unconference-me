import { test, expect } from '@playwright/test'
import { assignmentAlgorithmService } from '../server/services/assignmentAlgorithmService'
import type { Event } from '../types/event'
import type { Participant } from '../types/participant'
import type { Topic } from '../types/topic'
import type { TopicRanking } from '../types/topicRanking'

test.describe('Assignment Algorithm - Topic Repetition', () => {
  test('should repeat highly demanded topic across multiple rounds when everyone ranks it in top 3', async () => {
    // Setup: 3 rounds, 2 discussions per round, 12 participants
    // One topic is in everyone's top 3, so it should be repeated
    const event: Event = {
      id: 'test-event-1',
      name: 'Test Event',
      description: 'Test',
      location: 'Test Location',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-01'),
      numberOfRounds: 3,
      discussionsPerRound: 2,
      idealGroupSize: 4,
      minGroupSize: 3,
      maxGroupSize: 6,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        enableTopicRanking: true,
        minTopicsToRank: 6,
        enableAutoAssignment: true,
        maxTopicsPerParticipant: 3,
        requireApproval: false,
        maxParticipants: 100,
        registrationMode: 'open'
      }
    }

    // Create 12 participants (enough for 2 groups of 6)
    const participants: Participant[] = []
    for (let i = 1; i <= 12; i++) {
      participants.push({
        id: `p${i}`,
        eventId: event.id,
        email: `user${i}@test.com`,
        firstname: `User`,
        lastname: `${i}`,
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // Create 6 approved topics
    const topics: Topic[] = []
    for (let i = 1; i <= 6; i++) {
      topics.push({
        id: `t${i}`,
        eventId: event.id,
        title: `Topic ${i}`,
        proposedBy: `p1`,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // All 12 participants rank topic t1 in their top 3
    // This topic should be repeated across rounds
    const rankings: TopicRanking[] = []
    for (let i = 1; i <= 12; i++) {
      rankings.push({
        id: `r${i}`,
        participantId: `p${i}`,
        eventId: event.id,
        // Everyone has t1 in their top 3
        rankedTopicIds: ['t1', 't2', 't3', 't4', 't5', 't6'],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // Generate assignments
    const result = assignmentAlgorithmService.generateAssignments({
      event,
      participants,
      topics,
      rankings
    })

    // Count how many times each topic is scheduled across all rounds
    const topicScheduleCount = new Map<string, number>()
    const topicRoundGroups = new Map<string, Set<string>>()

    for (const assignment of result.assignments) {
      const roundGroupKey = `${assignment.roundNumber}-${assignment.groupNumber}`
      
      if (!topicRoundGroups.has(assignment.topicId)) {
        topicRoundGroups.set(assignment.topicId, new Set())
      }
      topicRoundGroups.get(assignment.topicId)!.add(roundGroupKey)
    }

    // Count unique round-group combinations for each topic
    for (const [topicId, roundGroups] of topicRoundGroups.entries()) {
      topicScheduleCount.set(topicId, roundGroups.size)
    }

    console.log('Topic schedule counts:', Object.fromEntries(topicScheduleCount))

    // Topic t1 is the most popular and all 12 participants want it
    // With maxGroupSize=6, we need at least 2 sessions to accommodate everyone
    const t1ScheduleCount = topicScheduleCount.get('t1') || 0
    expect(t1ScheduleCount).toBeGreaterThanOrEqual(2)

    // Verify that every participant got assigned to topic t1 exactly once
    const participantsAssignedToT1 = new Set(
      result.assignments
        .filter(a => a.topicId === 't1')
        .map(a => a.participantId)
    )

    expect(participantsAssignedToT1.size).toBe(12)
    
    // Verify each participant is assigned to t1 only once
    for (let i = 1; i <= 12; i++) {
      const participantId = `p${i}`
      const t1Assignments = result.assignments.filter(
        a => a.participantId === participantId && a.topicId === 't1'
      )
      expect(t1Assignments.length).toBe(1)
    }
  })

  test('should schedule popular topic multiple times when demand exceeds one group capacity', async () => {
    // Setup: 2 rounds, 2 discussions per round, 10 participants
    // maxGroupSize = 4, so if 10 people want topic t1, it needs 3 sessions
    const event: Event = {
      id: 'test-event-2',
      name: 'Test Event 2',
      description: 'Test',
      location: 'Test Location',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-01'),
      numberOfRounds: 2,
      discussionsPerRound: 2,
      idealGroupSize: 4,
      minGroupSize: 3,
      maxGroupSize: 4,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        enableTopicRanking: true,
        minTopicsToRank: 4,
        enableAutoAssignment: true,
        maxTopicsPerParticipant: 2,
        requireApproval: false,
        maxParticipants: 100,
        registrationMode: 'open'
      }
    }

    // Create 10 participants
    const participants: Participant[] = []
    for (let i = 1; i <= 10; i++) {
      participants.push({
        id: `p${i}`,
        eventId: event.id,
        email: `user${i}@test.com`,
        firstname: `User`,
        lastname: `${i}`,
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // Create 4 approved topics
    const topics: Topic[] = []
    for (let i = 1; i <= 4; i++) {
      topics.push({
        id: `t${i}`,
        eventId: event.id,
        title: `Topic ${i}`,
        proposedBy: `p1`,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // All 10 participants rank topic t1 as their #1 choice
    const rankings: TopicRanking[] = []
    for (let i = 1; i <= 10; i++) {
      rankings.push({
        id: `r${i}`,
        participantId: `p${i}`,
        eventId: event.id,
        rankedTopicIds: ['t1', 't2', 't3', 't4'],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // Generate assignments
    const result = assignmentAlgorithmService.generateAssignments({
      event,
      participants,
      topics,
      rankings
    })

    // Count unique round-group combinations for topic t1
    const t1RoundGroups = new Set<string>()
    for (const assignment of result.assignments) {
      if (assignment.topicId === 't1') {
        const roundGroupKey = `${assignment.roundNumber}-${assignment.groupNumber}`
        t1RoundGroups.add(roundGroupKey)
      }
    }

    console.log('Topic t1 scheduled in', t1RoundGroups.size, 'sessions')

    // With 10 participants and maxGroupSize=4, we need at least 3 sessions
    // But we only have 2 rounds with 2 discussions each = 4 total slots
    // So topic t1 should be scheduled in multiple sessions
    expect(t1RoundGroups.size).toBeGreaterThanOrEqual(2)

    // Count how many participants got assigned to t1
    const participantsAssignedToT1 = new Set(
      result.assignments
        .filter(a => a.topicId === 't1')
        .map(a => a.participantId)
    )

    // With limited slots, we should try to assign as many as possible
    // At minimum, we should assign more than maxGroupSize participants
    expect(participantsAssignedToT1.size).toBeGreaterThan(event.maxGroupSize)
  })

  test('should not repeat unpopular topics when demand is low', async () => {
    // Setup: 3 rounds, 2 discussions per round, 6 participants
    // Topic distribution is even, no topic needs repetition
    const event: Event = {
      id: 'test-event-3',
      name: 'Test Event 3',
      description: 'Test',
      location: 'Test Location',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-01'),
      numberOfRounds: 3,
      discussionsPerRound: 2,
      idealGroupSize: 3,
      minGroupSize: 2,
      maxGroupSize: 4,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        enableTopicRanking: true,
        minTopicsToRank: 6,
        enableAutoAssignment: true,
        maxTopicsPerParticipant: 3,
        requireApproval: false,
        maxParticipants: 100,
        registrationMode: 'open'
      }
    }

    // Create 6 participants
    const participants: Participant[] = []
    for (let i = 1; i <= 6; i++) {
      participants.push({
        id: `p${i}`,
        eventId: event.id,
        email: `user${i}@test.com`,
        firstname: `User`,
        lastname: `${i}`,
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // Create 6 approved topics
    const topics: Topic[] = []
    for (let i = 1; i <= 6; i++) {
      topics.push({
        id: `t${i}`,
        eventId: event.id,
        title: `Topic ${i}`,
        proposedBy: `p1`,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // Each participant has different preferences, evenly distributed
    const rankings: TopicRanking[] = [
      { id: 'r1', participantId: 'p1', eventId: event.id, rankedTopicIds: ['t1', 't2', 't3', 't4', 't5', 't6'], lastViewedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: 'r2', participantId: 'p2', eventId: event.id, rankedTopicIds: ['t2', 't3', 't4', 't5', 't6', 't1'], lastViewedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: 'r3', participantId: 'p3', eventId: event.id, rankedTopicIds: ['t3', 't4', 't5', 't6', 't1', 't2'], lastViewedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: 'r4', participantId: 'p4', eventId: event.id, rankedTopicIds: ['t4', 't5', 't6', 't1', 't2', 't3'], lastViewedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: 'r5', participantId: 'p5', eventId: event.id, rankedTopicIds: ['t5', 't6', 't1', 't2', 't3', 't4'], lastViewedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: 'r6', participantId: 'p6', eventId: event.id, rankedTopicIds: ['t6', 't1', 't2', 't3', 't4', 't5'], lastViewedAt: new Date(), createdAt: new Date(), updatedAt: new Date() }
    ]

    // Generate assignments
    const result = assignmentAlgorithmService.generateAssignments({
      event,
      participants,
      topics,
      rankings
    })

    // Count how many times each topic is scheduled
    const topicScheduleCount = new Map<string, number>()
    const topicRoundGroups = new Map<string, Set<string>>()

    for (const assignment of result.assignments) {
      const roundGroupKey = `${assignment.roundNumber}-${assignment.groupNumber}`
      
      if (!topicRoundGroups.has(assignment.topicId)) {
        topicRoundGroups.set(assignment.topicId, new Set())
      }
      topicRoundGroups.get(assignment.topicId)!.add(roundGroupKey)
    }

    for (const [topicId, roundGroups] of topicRoundGroups.entries()) {
      topicScheduleCount.set(topicId, roundGroups.size)
    }

    console.log('Topic schedule counts:', Object.fromEntries(topicScheduleCount))

    // With even distribution, most topics should be scheduled once
    // Some might be repeated, but not excessively
    const totalSchedules = Array.from(topicScheduleCount.values()).reduce((a, b) => a + b, 0)
    const averageSchedules = totalSchedules / topicScheduleCount.size
    
    // Average should be close to 1 (each topic scheduled once on average)
    expect(averageSchedules).toBeLessThanOrEqual(2)
  })

  test('should handle mixed popularity - repeat only high demand topics', async () => {
    // Setup: 3 rounds, 2 discussions per round, 9 participants
    // t1 is universally popular (all 9 want it)
    // t2-t6 have moderate demand
    const event: Event = {
      id: 'test-event-4',
      name: 'Test Event 4',
      description: 'Test',
      location: 'Test Location',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-01'),
      numberOfRounds: 3,
      discussionsPerRound: 2,
      idealGroupSize: 3,
      minGroupSize: 2,
      maxGroupSize: 5,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        enableTopicRanking: true,
        minTopicsToRank: 6,
        enableAutoAssignment: true,
        maxTopicsPerParticipant: 3,
        requireApproval: false,
        maxParticipants: 100,
        registrationMode: 'open'
      }
    }

    // Create 9 participants
    const participants: Participant[] = []
    for (let i = 1; i <= 9; i++) {
      participants.push({
        id: `p${i}`,
        eventId: event.id,
        email: `user${i}@test.com`,
        firstname: `User`,
        lastname: `${i}`,
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // Create 6 approved topics
    const topics: Topic[] = []
    for (let i = 1; i <= 6; i++) {
      topics.push({
        id: `t${i}`,
        eventId: event.id,
        title: `Topic ${i}`,
        proposedBy: `p1`,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // All 9 participants rank topic t1 as #1, others have varied preferences
    const rankings: TopicRanking[] = []
    for (let i = 1; i <= 9; i++) {
      rankings.push({
        id: `r${i}`,
        participantId: `p${i}`,
        eventId: event.id,
        // Everyone has t1 first, then varied preferences
        rankedTopicIds: ['t1', `t${(i % 5) + 2}`, `t${((i + 1) % 5) + 2}`, `t${((i + 2) % 5) + 2}`, `t${((i + 3) % 5) + 2}`, `t${((i + 4) % 5) + 2}`],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // Generate assignments
    const result = assignmentAlgorithmService.generateAssignments({
      event,
      participants,
      topics,
      rankings
    })

    // Count how many times each topic is scheduled
    const topicScheduleCount = new Map<string, number>()
    const topicRoundGroups = new Map<string, Set<string>>()

    for (const assignment of result.assignments) {
      const roundGroupKey = `${assignment.roundNumber}-${assignment.groupNumber}`
      
      if (!topicRoundGroups.has(assignment.topicId)) {
        topicRoundGroups.set(assignment.topicId, new Set())
      }
      topicRoundGroups.get(assignment.topicId)!.add(roundGroupKey)
    }

    for (const [topicId, roundGroups] of topicRoundGroups.entries()) {
      topicScheduleCount.set(topicId, roundGroups.size)
    }

    console.log('Topic schedule counts:', Object.fromEntries(topicScheduleCount))

    // Topic t1 should be repeated multiple times (everyone wants it)
    const t1ScheduleCount = topicScheduleCount.get('t1') || 0
    expect(t1ScheduleCount).toBeGreaterThanOrEqual(2)

    // Other topics should be scheduled less frequently
    for (let i = 2; i <= 6; i++) {
      const scheduleCount = topicScheduleCount.get(`t${i}`) || 0
      // They might be scheduled once or not at all depending on overall demand
      expect(scheduleCount).toBeLessThanOrEqual(t1ScheduleCount)
    }

    // Verify most/all participants got assigned to t1
    const participantsAssignedToT1 = new Set(
      result.assignments
        .filter(a => a.topicId === 't1')
        .map(a => a.participantId)
    )

    // Should assign at least 70% of participants to their top choice
    expect(participantsAssignedToT1.size).toBeGreaterThanOrEqual(6)
  })

  test('should only assign approved topics even when repeated', async () => {
    // Verify that even with topic repetition, only approved topics are used
    const event: Event = {
      id: 'test-event-5',
      name: 'Test Event 5',
      description: 'Test',
      location: 'Test Location',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-01'),
      numberOfRounds: 2,
      discussionsPerRound: 2,
      idealGroupSize: 3,
      minGroupSize: 2,
      maxGroupSize: 4,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        enableTopicRanking: true,
        minTopicsToRank: 4,
        enableAutoAssignment: true,
        maxTopicsPerParticipant: 2,
        requireApproval: false,
        maxParticipants: 100,
        registrationMode: 'open'
      }
    }

    const participants: Participant[] = []
    for (let i = 1; i <= 8; i++) {
      participants.push({
        id: `p${i}`,
        eventId: event.id,
        email: `user${i}@test.com`,
        firstname: `User`,
        lastname: `${i}`,
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // Mix of approved and proposed topics
    const topics: Topic[] = [
      { id: 't1', eventId: event.id, title: 'Approved Topic 1', proposedBy: 'p1', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      { id: 't2', eventId: event.id, title: 'Approved Topic 2', proposedBy: 'p1', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      { id: 't3', eventId: event.id, title: 'Proposed Topic 3', proposedBy: 'p2', status: 'proposed', createdAt: new Date(), updatedAt: new Date() },
      { id: 't4', eventId: event.id, title: 'Approved Topic 4', proposedBy: 'p2', status: 'approved', createdAt: new Date(), updatedAt: new Date() }
    ]

    // All participants rank t1 first (including the proposed t3)
    const rankings: TopicRanking[] = []
    for (let i = 1; i <= 8; i++) {
      rankings.push({
        id: `r${i}`,
        participantId: `p${i}`,
        eventId: event.id,
        rankedTopicIds: ['t1', 't2', 't3', 't4'],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // Generate assignments
    const result = assignmentAlgorithmService.generateAssignments({
      event,
      participants,
      topics,
      rankings
    })

    // Get approved topic IDs
    const approvedTopicIds = new Set(topics.filter(t => t.status === 'approved').map(t => t.id))

    // Verify all assignments use only approved topics
    for (const assignment of result.assignments) {
      expect(approvedTopicIds.has(assignment.topicId)).toBe(true)
    }

    // Verify no proposed topics are used
    const assignedTopicIds = new Set(result.assignments.map(a => a.topicId))
    expect(assignedTopicIds.has('t3')).toBe(false) // proposed topic should not be assigned
  })
})

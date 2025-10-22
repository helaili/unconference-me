import { test, expect } from '@playwright/test'
import { assignmentAlgorithmService } from '../server/services/assignmentAlgorithmService'
import type { Event } from '../types/event'
import type { Participant } from '../types/participant'
import type { Topic } from '../types/topic'
import type { TopicRanking } from '../types/topicRanking'

test.describe('Assignment Algorithm - Filtering and Uniqueness', () => {
  test('should exclude admin users from assignments', async () => {
    // Setup test data
    const event: Event = {
      id: 'test-event-1',
      name: 'Test Event',
      description: 'Test',
      location: 'Test Location',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-01'),
      numberOfRounds: 2,
      discussionsPerRound: 2,
      idealGroupSize: 5,
      minGroupSize: 3,
      maxGroupSize: 8,
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

    // Create participants - including admin
    const participants: Participant[] = [
      {
        id: 'p1',
        eventId: event.id,
        userId: 'user-admin',
        email: 'admin@test.com',
        firstname: 'Admin',
        lastname: 'User',
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'p2',
        eventId: event.id,
        userId: 'user-regular-1',
        email: 'user1@test.com',
        firstname: 'Regular',
        lastname: 'User1',
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'p3',
        eventId: event.id,
        userId: 'user-regular-2',
        email: 'user2@test.com',
        firstname: 'Regular',
        lastname: 'User2',
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'p4',
        eventId: event.id,
        userId: 'user-regular-3',
        email: 'user3@test.com',
        firstname: 'Regular',
        lastname: 'User3',
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Create approved topics
    const topics: Topic[] = [
      {
        id: 't1',
        eventId: event.id,
        title: 'Topic 1',
        description: 'Test topic 1',
        proposedBy: 'p2',
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 't2',
        eventId: event.id,
        title: 'Topic 2',
        description: 'Test topic 2',
        proposedBy: 'p3',
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 't3',
        eventId: event.id,
        title: 'Topic 3',
        description: 'Test topic 3',
        proposedBy: 'p4',
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 't4',
        eventId: event.id,
        title: 'Topic 4',
        description: 'Test topic 4',
        proposedBy: 'p2',
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Create rankings
    const rankings: TopicRanking[] = [
      {
        id: 'r1',
        participantId: 'p1',
        eventId: event.id,
        rankedTopicIds: ['t1', 't2', 't3', 't4'],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'r2',
        participantId: 'p2',
        eventId: event.id,
        rankedTopicIds: ['t1', 't2', 't3', 't4'],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'r3',
        participantId: 'p3',
        eventId: event.id,
        rankedTopicIds: ['t2', 't3', 't1', 't4'],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'r4',
        participantId: 'p4',
        eventId: event.id,
        rankedTopicIds: ['t3', 't1', 't2', 't4'],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // User information - p1 is admin
    const users = new Map([
      ['user-admin', { role: 'Admin' as const }],
      ['user-regular-1', { role: 'Participant' as const }],
      ['user-regular-2', { role: 'Participant' as const }],
      ['user-regular-3', { role: 'Participant' as const }]
    ])

    // Generate assignments
    const result = assignmentAlgorithmService.generateAssignments({
      event,
      participants,
      topics,
      rankings,
      users
    })

    // Verify admin (p1) was not assigned
    const adminAssignments = result.assignments.filter(a => a.participantId === 'p1')
    expect(adminAssignments.length).toBe(0)

    // Verify regular participants were assigned
    const p2Assignments = result.assignments.filter(a => a.participantId === 'p2')
    const p3Assignments = result.assignments.filter(a => a.participantId === 'p3')
    const p4Assignments = result.assignments.filter(a => a.participantId === 'p4')

    expect(p2Assignments.length).toBeGreaterThan(0)
    expect(p3Assignments.length).toBeGreaterThan(0)
    expect(p4Assignments.length).toBeGreaterThan(0)
  })

  test('should exclude organizer users from assignments', async () => {
    // Setup test data
    const event: Event = {
      id: 'test-event-2',
      name: 'Test Event 2',
      description: 'Test',
      location: 'Test Location',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-01'),
      numberOfRounds: 2,
      discussionsPerRound: 2,
      idealGroupSize: 5,
      minGroupSize: 3,
      maxGroupSize: 8,
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

    // Create participants - including one who is also an organizer
    const participants: Participant[] = [
      {
        id: 'p1',
        eventId: event.id,
        userId: 'user-organizer',
        email: 'organizer@test.com',
        firstname: 'Event',
        lastname: 'Organizer',
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'p2',
        eventId: event.id,
        userId: 'user-regular-1',
        email: 'user1@test.com',
        firstname: 'Regular',
        lastname: 'User1',
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'p3',
        eventId: event.id,
        userId: 'user-regular-2',
        email: 'user2@test.com',
        firstname: 'Regular',
        lastname: 'User2',
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'p4',
        eventId: event.id,
        userId: 'user-regular-3',
        email: 'user3@test.com',
        firstname: 'Regular',
        lastname: 'User3',
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Create approved topics
    const topics: Topic[] = [
      {
        id: 't1',
        eventId: event.id,
        title: 'Topic 1',
        description: 'Test topic 1',
        proposedBy: 'p2',
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 't2',
        eventId: event.id,
        title: 'Topic 2',
        description: 'Test topic 2',
        proposedBy: 'p3',
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 't3',
        eventId: event.id,
        title: 'Topic 3',
        description: 'Test topic 3',
        proposedBy: 'p4',
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 't4',
        eventId: event.id,
        title: 'Topic 4',
        description: 'Test topic 4',
        proposedBy: 'p2',
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Create rankings
    const rankings: TopicRanking[] = [
      {
        id: 'r1',
        participantId: 'p1',
        eventId: event.id,
        rankedTopicIds: ['t1', 't2', 't3', 't4'],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'r2',
        participantId: 'p2',
        eventId: event.id,
        rankedTopicIds: ['t1', 't2', 't3', 't4'],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'r3',
        participantId: 'p3',
        eventId: event.id,
        rankedTopicIds: ['t2', 't3', 't1', 't4'],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'r4',
        participantId: 'p4',
        eventId: event.id,
        rankedTopicIds: ['t3', 't1', 't2', 't4'],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // User information - p1 has Organizer role
    const users = new Map([
      ['user-organizer', { role: 'Organizer' as const }],
      ['user-regular-1', { role: 'Participant' as const }],
      ['user-regular-2', { role: 'Participant' as const }],
      ['user-regular-3', { role: 'Participant' as const }]
    ])

    // Organizer IDs - p1 is an organizer for this event
    const organizerIds = new Set(['p1'])

    // Generate assignments
    const result = assignmentAlgorithmService.generateAssignments({
      event,
      participants,
      topics,
      rankings,
      users,
      organizerIds
    })

    // Verify organizer (p1) was not assigned
    const organizerAssignments = result.assignments.filter(a => a.participantId === 'p1')
    expect(organizerAssignments.length).toBe(0)

    // Verify regular participants were assigned
    const p2Assignments = result.assignments.filter(a => a.participantId === 'p2')
    const p3Assignments = result.assignments.filter(a => a.participantId === 'p3')
    const p4Assignments = result.assignments.filter(a => a.participantId === 'p4')

    expect(p2Assignments.length).toBeGreaterThan(0)
    expect(p3Assignments.length).toBeGreaterThan(0)
    expect(p4Assignments.length).toBeGreaterThan(0)
  })

  test('should assign each participant to different topics across all rounds', async () => {
    // Setup test data
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

    // Create participants
    const participants: Participant[] = [
      {
        id: 'p1',
        eventId: event.id,
        email: 'user1@test.com',
        firstname: 'User',
        lastname: 'One',
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'p2',
        eventId: event.id,
        email: 'user2@test.com',
        firstname: 'User',
        lastname: 'Two',
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'p3',
        eventId: event.id,
        email: 'user3@test.com',
        firstname: 'User',
        lastname: 'Three',
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Create 6 approved topics
    const topics: Topic[] = [
      { id: 't1', eventId: event.id, title: 'Topic 1', proposedBy: 'p1', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      { id: 't2', eventId: event.id, title: 'Topic 2', proposedBy: 'p1', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      { id: 't3', eventId: event.id, title: 'Topic 3', proposedBy: 'p2', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      { id: 't4', eventId: event.id, title: 'Topic 4', proposedBy: 'p2', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      { id: 't5', eventId: event.id, title: 'Topic 5', proposedBy: 'p3', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      { id: 't6', eventId: event.id, title: 'Topic 6', proposedBy: 'p3', status: 'approved', createdAt: new Date(), updatedAt: new Date() }
    ]

    // Create rankings
    const rankings: TopicRanking[] = [
      {
        id: 'r1',
        participantId: 'p1',
        eventId: event.id,
        rankedTopicIds: ['t1', 't2', 't3', 't4', 't5', 't6'],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'r2',
        participantId: 'p2',
        eventId: event.id,
        rankedTopicIds: ['t2', 't3', 't4', 't5', 't6', 't1'],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'r3',
        participantId: 'p3',
        eventId: event.id,
        rankedTopicIds: ['t3', 't4', 't5', 't6', 't1', 't2'],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Generate assignments
    const result = assignmentAlgorithmService.generateAssignments({
      event,
      participants,
      topics,
      rankings
    })

    // Verify each participant is assigned to different topics
    for (const participant of participants) {
      const participantAssignments = result.assignments.filter(a => a.participantId === participant.id)
      const topicIds = participantAssignments.map(a => a.topicId)
      const uniqueTopicIds = new Set(topicIds)

      // Number of unique topics should equal number of assignments
      expect(uniqueTopicIds.size).toBe(topicIds.length)
      
      console.log(`Participant ${participant.id}: ${topicIds.length} assignments to ${uniqueTopicIds.size} unique topics`)
    }
  })

  test('should only use approved topics for assignments', async () => {
    // Setup test data
    const event: Event = {
      id: 'test-event-4',
      name: 'Test Event 4',
      description: 'Test',
      location: 'Test Location',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-01'),
      numberOfRounds: 2,
      discussionsPerRound: 2,
      idealGroupSize: 3,
      minGroupSize: 2,
      maxGroupSize: 5,
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

    // Create participants
    const participants: Participant[] = [
      {
        id: 'p1',
        eventId: event.id,
        email: 'user1@test.com',
        firstname: 'User',
        lastname: 'One',
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'p2',
        eventId: event.id,
        email: 'user2@test.com',
        firstname: 'User',
        lastname: 'Two',
        status: 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Create topics - mix of approved and proposed
    const topics: Topic[] = [
      { id: 't1', eventId: event.id, title: 'Approved Topic 1', proposedBy: 'p1', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      { id: 't2', eventId: event.id, title: 'Approved Topic 2', proposedBy: 'p1', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      { id: 't3', eventId: event.id, title: 'Proposed Topic 3', proposedBy: 'p2', status: 'proposed', createdAt: new Date(), updatedAt: new Date() },
      { id: 't4', eventId: event.id, title: 'Approved Topic 4', proposedBy: 'p2', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      { id: 't5', eventId: event.id, title: 'Rejected Topic 5', proposedBy: 'p1', status: 'rejected', createdAt: new Date(), updatedAt: new Date() }
    ]

    // Create rankings
    const rankings: TopicRanking[] = [
      {
        id: 'r1',
        participantId: 'p1',
        eventId: event.id,
        rankedTopicIds: ['t1', 't2', 't3', 't4'],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'r2',
        participantId: 'p2',
        eventId: event.id,
        rankedTopicIds: ['t2', 't4', 't3', 't1'],
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

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

    // Verify no proposed or rejected topics are used
    const assignedTopicIds = new Set(result.assignments.map(a => a.topicId))
    expect(assignedTopicIds.has('t3')).toBe(false) // proposed
    expect(assignedTopicIds.has('t5')).toBe(false) // rejected
  })
})

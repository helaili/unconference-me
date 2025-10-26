import { assignmentAlgorithmService } from '../server/services/assignmentAlgorithmService'
import type { Event } from '../types/event'
import type { Participant } from '../types/participant'
import type { Topic } from '../types/topic'
import type { TopicRanking } from '../types/topicRanking'

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

const rankings: TopicRanking[] = []
for (let i = 1; i <= 12; i++) {
  rankings.push({
    id: `r${i}`,
    participantId: `p${i}`,
    eventId: event.id,
    rankedTopicIds: ['t1', 't2', 't3', 't4', 't5', 't6'],
    lastViewedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  })
}

const result = assignmentAlgorithmService.generateAssignments({
  event,
  participants,
  topics,
  rankings
})

console.log('\n=== ASSIGNMENT ANALYSIS ===')
console.log('Total assignments:', result.assignments.length)
console.log('Total participants:', 12)
console.log('Number of rounds:', 3)
console.log('Discussions per round:', 2)

// Count topic usage
const topicUsage = new Map<string, number>()
const topicRoundGroups = new Map<string, Set<string>>()
for (const assignment of result.assignments) {
  const count = topicUsage.get(assignment.topicId) || 0
  topicUsage.set(assignment.topicId, count + 1)
  
  const roundGroupKey = `R${assignment.roundNumber}G${assignment.groupNumber}`
  if (!topicRoundGroups.has(assignment.topicId)) {
    topicRoundGroups.set(assignment.topicId, new Set())
  }
  topicRoundGroups.get(assignment.topicId)!.add(roundGroupKey)
}

console.log('\n=== TOPIC USAGE ===')
for (const [topicId, count] of topicUsage.entries()) {
  const sessions = topicRoundGroups.get(topicId)!
  console.log(`${topicId}: ${count} assignments in ${sessions.size} sessions [${Array.from(sessions).join(', ')}]`)
}

// Check t1 specifically
const t1Assignments = result.assignments.filter(a => a.topicId === 't1')
const uniqueParticipantsForT1 = new Set(t1Assignments.map(a => a.participantId))
console.log('\n=== TOPIC t1 ANALYSIS ===')
console.log('Participants who wanted t1 as #1: 12')
console.log('Participants assigned to t1:', uniqueParticipantsForT1.size)
console.log('Missing participants:', 12 - uniqueParticipantsForT1.size)
console.log('Participants who got t1:', Array.from(uniqueParticipantsForT1).sort())

// Show per-round breakdown
console.log('\n=== PER-ROUND BREAKDOWN ===')
for (let round = 1; round <= 3; round++) {
  const roundAssignments = result.assignments.filter(a => a.roundNumber === round)
  console.log(`\nRound ${round}:`)
  
  const groupTopics = new Map<number, string>()
  const groupSizes = new Map<number, number>()
  
  for (const assignment of roundAssignments) {
    groupTopics.set(assignment.groupNumber, assignment.topicId)
    const size = groupSizes.get(assignment.groupNumber) || 0
    groupSizes.set(assignment.groupNumber, size + 1)
  }
  
  for (const [groupNum, topicId] of groupTopics.entries()) {
    const size = groupSizes.get(groupNum)
    console.log(`  Group ${groupNum}: Topic ${topicId} (${size} participants)`)
  }
}

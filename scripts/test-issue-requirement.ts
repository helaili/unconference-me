import { assignmentAlgorithmService } from '../server/services/assignmentAlgorithmService'
import type { Event } from '../types/event'
import type { Participant } from '../types/participant'
import type { Topic } from '../types/topic'
import type { TopicRanking } from '../types/topicRanking'

console.log('=== TESTING ISSUE REQUIREMENT ===')
console.log('Requirement: If there are 3 rounds and everyone has selected a topic in their top 3,')
console.log('then the topic should be repeated enough times so everyone can attend.\n')

// Create event with 3 rounds
const event: Event = {
  id: 'test-event',
  name: 'Test Event',
  description: 'Test',
  location: 'Test Location',
  startDate: new Date('2025-11-01'),
  endDate: new Date('2025-11-01'),
  numberOfRounds: 3, // <-- 3 rounds as specified
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

// Create 12 participants
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

// Create approved topics
const topics: Topic[] = [
  { id: 't1', eventId: event.id, title: 'Highly Popular Topic', proposedBy: 'p1', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
  { id: 't2', eventId: event.id, title: 'Topic 2', proposedBy: 'p1', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
  { id: 't3', eventId: event.id, title: 'Topic 3', proposedBy: 'p1', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
  { id: 't4', eventId: event.id, title: 'Topic 4', proposedBy: 'p1', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
  { id: 't5', eventId: event.id, title: 'Topic 5', proposedBy: 'p1', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
  { id: 't6', eventId: event.id, title: 'Topic 6', proposedBy: 'p1', status: 'approved', createdAt: new Date(), updatedAt: new Date() }
]

// ALL participants rank topic t1 in their top 3
const rankings: TopicRanking[] = []
for (let i = 1; i <= 12; i++) {
  rankings.push({
    id: `r${i}`,
    participantId: `p${i}`,
    eventId: event.id,
    // Everyone has t1 in position 1 (top 3)
    rankedTopicIds: ['t1', 't2', 't3', 't4', 't5', 't6'],
    lastViewedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  })
}

console.log('Setup:')
console.log(`- ${participants.length} participants`)
console.log(`- ${event.numberOfRounds} rounds`)
console.log(`- ${event.discussionsPerRound} discussions per round`)
console.log(`- Max group size: ${event.maxGroupSize}`)
console.log(`- ALL ${participants.length} participants rank topic "t1" in their top 3`)
console.log()

// Generate assignments
const result = assignmentAlgorithmService.generateAssignments({
  event,
  participants,
  topics,
  rankings
})

// Verify requirement
console.log('Results:')

// Count how many times t1 is scheduled
const t1Assignments = result.assignments.filter(a => a.topicId === 't1')
const uniqueParticipantsForT1 = new Set(t1Assignments.map(a => a.participantId))
const t1RoundGroups = new Set<string>()
for (const assignment of t1Assignments) {
  t1RoundGroups.add(`R${assignment.roundNumber}G${assignment.groupNumber}`)
}

console.log(`✓ Topic t1 is scheduled in ${t1RoundGroups.size} sessions:`, Array.from(t1RoundGroups).join(', '))
console.log(`✓ ${uniqueParticipantsForT1.size} out of ${participants.length} participants got assigned to t1`)
console.log()

if (uniqueParticipantsForT1.size === participants.length) {
  console.log('✅ REQUIREMENT MET: All participants who wanted t1 in their top 3 got assigned to it!')
  console.log('   The topic was repeated enough times across rounds so everyone could attend.')
} else {
  console.log('❌ REQUIREMENT NOT MET: Some participants did not get assigned to t1')
  console.log(`   Missing: ${participants.length - uniqueParticipantsForT1.size} participants`)
}

console.log()
console.log('Per-round breakdown:')
for (let round = 1; round <= event.numberOfRounds; round++) {
  const roundAssignments = result.assignments.filter(a => a.roundNumber === round)
  const groupsByTopic = new Map<string, Set<number>>()
  
  for (const assignment of roundAssignments) {
    if (!groupsByTopic.has(assignment.topicId)) {
      groupsByTopic.set(assignment.topicId, new Set())
    }
    groupsByTopic.get(assignment.topicId)!.add(assignment.groupNumber)
  }
  
  const topicsInRound = Array.from(groupsByTopic.entries()).map(([tid, groups]) => 
    `${tid} (${groups.size} group${groups.size > 1 ? 's' : ''})`
  )
  
  console.log(`  Round ${round}: ${topicsInRound.join(', ')}`)
}

console.log()
console.log('Additional checks:')
console.log(`✓ Only approved topics used: ${result.assignments.every(a => topics.find(t => t.id === a.topicId)?.status === 'approved')}`)
console.log(`✓ Total assignments: ${result.assignments.length}`)
console.log(`✓ Expected assignments: ${participants.length * event.numberOfRounds} (${participants.length} × ${event.numberOfRounds})`)
console.log(`✓ All participants fully assigned: ${result.assignments.length === participants.length * event.numberOfRounds}`)

import { test, expect } from './helpers/mock-test-utils'
import { removeTopicFromRankings, removeTopicsFromRankings } from '../server/utils/ranking-cleanup'
import { topicRankingService } from '../server/services'

test.describe('Topic Deletion and Ranking Cleanup', () => {
  test.beforeEach(async ({ mockData }) => {
    // Ensure we have default mock data for each test
    mockData.resetToDefaults()
  })

  test('should remove deleted topic from user rankings', async ({ mockData }) => {
    // Create test data using the mock data helper
    const event = mockData.addTestEvent({
      id: 'test-event-1',
      name: 'Ranking Test Event'
    })
    
    const participant = mockData.addTestParticipant({
      id: 'participant-1',
      eventId: event.id,
      email: 'test@example.com',
      firstname: 'Test',
      lastname: 'User',
      status: 'registered'
    })
    
    // Create ranking directly with mock manager
    const ranking = mockData.addTestTopicRanking({
      id: 'ranking-1',
      participantId: participant.id,
      eventId: event.id,
      rankedTopicIds: ['topic-2', 'topic-1', 'topic-3'] // topic-2 will be deleted
    })
    
    // Remove topic-2 from rankings
    const updatedCount = await removeTopicFromRankings('topic-2', event.id)
    
    // Verify one ranking was updated
    expect(updatedCount).toBe(1)
    
    // Fetch the updated ranking
    const updatedRanking = await topicRankingService.findById(ranking.id)
    
    // Verify topic-2 is removed and order is preserved
    expect(updatedRanking).not.toBeNull()
    expect(updatedRanking!.rankedTopicIds).toEqual(['topic-1', 'topic-3'])
    expect(updatedRanking!.rankedTopicIds.length).toBe(2)
    expect(updatedRanking!.rankedTopicIds).not.toContain('topic-2')
  })

  test('should remove multiple topics from rankings in a single operation', async ({ mockData }) => {
    // Create test data
    const event = mockData.addTestEvent({
      id: 'test-event-2',
      name: 'Multi-Delete Test Event'
    })
    
    const participant1 = mockData.addTestParticipant({
      id: 'participant-2',
      eventId: event.id,
      email: 'user1@example.com',
      firstname: 'User',
      lastname: 'One',
      status: 'registered'
    })
    
    const participant2 = mockData.addTestParticipant({
      id: 'participant-3',
      eventId: event.id,
      email: 'user2@example.com',
      firstname: 'User',
      lastname: 'Two',
      status: 'registered'
    })
    
    // Create rankings with overlapping topics
    const ranking1 = mockData.addTestTopicRanking({
      id: 'ranking-2',
      participantId: participant1.id,
      eventId: event.id,
      rankedTopicIds: ['topic-a', 'topic-b', 'topic-c', 'topic-d']
    })
    
    const ranking2 = mockData.addTestTopicRanking({
      id: 'ranking-3',
      participantId: participant2.id,
      eventId: event.id,
      rankedTopicIds: ['topic-b', 'topic-c', 'topic-e']
    })
    
    // Remove multiple topics at once
    const updatedCount = await removeTopicsFromRankings(['topic-b', 'topic-c'], event.id)
    
    // Verify two rankings were updated
    expect(updatedCount).toBe(2)
    
    // Fetch updated rankings
    const updatedRanking1 = await topicRankingService.findById(ranking1.id)
    const updatedRanking2 = await topicRankingService.findById(ranking2.id)
    
    // Verify topics were removed from both rankings
    expect(updatedRanking1).not.toBeNull()
    expect(updatedRanking1!.rankedTopicIds).toEqual(['topic-a', 'topic-d'])
    expect(updatedRanking1!.rankedTopicIds).not.toContain('topic-b')
    expect(updatedRanking1!.rankedTopicIds).not.toContain('topic-c')
    
    expect(updatedRanking2).not.toBeNull()
    expect(updatedRanking2!.rankedTopicIds).toEqual(['topic-e'])
    expect(updatedRanking2!.rankedTopicIds).not.toContain('topic-b')
    expect(updatedRanking2!.rankedTopicIds).not.toContain('topic-c')
  })

  test('should handle case when topic is not in any rankings', async ({ mockData }) => {
    // Create test data
    const event = mockData.addTestEvent({
      id: 'test-event-3',
      name: 'No Rankings Test Event'
    })
    
    const participant = mockData.addTestParticipant({
      id: 'participant-4',
      eventId: event.id,
      email: 'test@example.com',
      firstname: 'Test',
      lastname: 'User',
      status: 'registered'
    })
    
    // Create ranking without the topic we'll try to delete
    mockData.addTestTopicRanking({
      id: 'ranking-4',
      participantId: participant.id,
      eventId: event.id,
      rankedTopicIds: ['topic-x', 'topic-y']
    })
    
    // Try to remove a topic that doesn't exist in any ranking
    const updatedCount = await removeTopicFromRankings('topic-z', event.id)
    
    // Verify no rankings were updated
    expect(updatedCount).toBe(0)
  })
})

import { topicRankingService } from '../services'
import type { TopicRanking } from '../../types/topicRanking'

/**
 * Remove a topic from all user rankings and bump up subsequent topics
 * This should be called when a topic is deleted or rejected
 * 
 * @param topicId - The ID of the topic to remove from rankings
 * @param eventId - The event ID (for optimization)
 * @returns The number of rankings that were updated
 */
export async function removeTopicFromRankings(topicId: string, eventId: string): Promise<number> {
  try {
    console.log(`Removing topic ${topicId} from all rankings in event ${eventId}`)
    
    // Get all rankings for this event
    const rankings = await topicRankingService.findByEventId(eventId)
    
    let updatedCount = 0
    
    // Process each ranking
    for (const ranking of rankings) {
      // Check if this ranking contains the topic
      const topicIndex = ranking.rankedTopicIds.indexOf(topicId)
      
      if (topicIndex !== -1) {
        // Remove the topic from the ranked list
        const updatedRankedTopicIds = ranking.rankedTopicIds.filter(id => id !== topicId)
        
        // Update the ranking with the new list
        // The removal automatically "bumps up" subsequent topics since they move to lower indices
        await topicRankingService.update(ranking.id, {
          rankedTopicIds: updatedRankedTopicIds
        })
        
        updatedCount++
        console.log(`Updated ranking ${ranking.id}: removed topic at position ${topicIndex + 1}`)
      }
    }
    
    console.log(`Removed topic ${topicId} from ${updatedCount} ranking(s)`)
    return updatedCount
  } catch (error) {
    console.error('Error removing topic from rankings:', error)
    throw error
  }
}

/**
 * Remove multiple topics from all user rankings
 * Useful for bulk operations
 * 
 * @param topicIds - Array of topic IDs to remove
 * @param eventId - The event ID
 * @returns The number of rankings that were updated
 */
export async function removeTopicsFromRankings(topicIds: string[], eventId: string): Promise<number> {
  try {
    console.log(`Removing ${topicIds.length} topics from all rankings in event ${eventId}`)
    
    // Get all rankings for this event
    const rankings = await topicRankingService.findByEventId(eventId)
    
    let updatedCount = 0
    const topicIdSet = new Set(topicIds)
    
    // Process each ranking
    for (const ranking of rankings) {
      // Check if this ranking contains any of the topics
      const hasAnyTopic = ranking.rankedTopicIds.some(id => topicIdSet.has(id))
      
      if (hasAnyTopic) {
        // Remove all matching topics from the ranked list
        const updatedRankedTopicIds = ranking.rankedTopicIds.filter(id => !topicIdSet.has(id))
        
        // Update the ranking with the new list
        await topicRankingService.update(ranking.id, {
          rankedTopicIds: updatedRankedTopicIds
        })
        
        updatedCount++
        console.log(`Updated ranking ${ranking.id}: removed ${ranking.rankedTopicIds.length - updatedRankedTopicIds.length} topic(s)`)
      }
    }
    
    console.log(`Removed topics from ${updatedCount} ranking(s)`)
    return updatedCount
  } catch (error) {
    console.error('Error removing topics from rankings:', error)
    throw error
  }
}

import { BaseService } from './baseService'
import { mockData } from '../../tests/helpers/mock-manager'
import type { TopicRanking } from '../../types/topicRanking'

export class TopicRankingService extends BaseService<TopicRanking> {
  protected readonly containerName = 'topicRankings'
  protected readonly partitionKey = '/eventId'

  async findAll(): Promise<TopicRanking[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<TopicRanking>('SELECT * FROM c')
      } else {
        return mockData.getTopicRankings()
      }
    } catch (error) {
      console.error('Failed to fetch all topic rankings', { error })
      throw error
    }
  }

  async findById(id: string): Promise<TopicRanking | null> {
    try {
      if (await this.isUsingCosmosDB()) {
        // For topic rankings, we need to find by id but partition key is eventId
        // So we need to query instead of direct read
        const rankings = await this.executeCosmosQuery<TopicRanking>(
          'SELECT * FROM c WHERE c.id = @id',
          [{ name: '@id', value: id }]
        )
        return rankings.length > 0 ? rankings[0]! : null
      } else {
        return mockData.getTopicRankingById(id) || null
      }
    } catch (error) {
      console.error('Failed to fetch topic ranking by id', { id, error })
      throw error
    }
  }

  async findByParticipantAndEvent(participantId: string, eventId: string): Promise<TopicRanking | null> {
    try {
      if (await this.isUsingCosmosDB()) {
        const rankings = await this.executeCosmosQuery<TopicRanking>(
          'SELECT * FROM c WHERE c.participantId = @participantId AND c.eventId = @eventId',
          [
            { name: '@participantId', value: participantId },
            { name: '@eventId', value: eventId }
          ]
        )
        return rankings.length > 0 ? rankings[0]! : null
      } else {
        return mockData.getTopicRankingByParticipantAndEvent(participantId, eventId)
      }
    } catch (error) {
      console.error('Failed to fetch topic ranking by participant and event', { participantId, eventId, error })
      throw error
    }
  }

  async findByEventId(eventId: string): Promise<TopicRanking[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<TopicRanking>(
          'SELECT * FROM c WHERE c.eventId = @eventId',
          [{ name: '@eventId', value: eventId }]
        )
      } else {
        return mockData.getTopicRankingsByEventId(eventId)
      }
    } catch (error) {
      console.error('Failed to fetch topic rankings by event id', { eventId, error })
      throw error
    }
  }

  async create(rankingData: Omit<TopicRanking, 'id'>): Promise<TopicRanking> {
    try {
      const ranking: TopicRanking = {
        ...rankingData,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (await this.isUsingCosmosDB()) {
        return await this.cosmosUpsert(ranking)
      } else {
        mockData.addTopicRanking(ranking)
        return ranking
      }
    } catch (error) {
      console.error('Failed to create topic ranking', { rankingData, error })
      throw error
    }
  }

  async update(id: string, updates: Partial<TopicRanking>): Promise<TopicRanking> {
    try {
      if (await this.isUsingCosmosDB()) {
        const existingRanking = await this.findById(id)
        if (!existingRanking) {
          throw new Error(`Topic ranking with id ${id} not found`)
        }

        const updatedRanking: TopicRanking = {
          ...existingRanking,
          ...updates,
          id, // Ensure id doesn't change
          updatedAt: new Date()
        }

        return await this.cosmosUpsert(updatedRanking)
      } else {
        const success = mockData.updateTopicRanking(id, { ...updates, updatedAt: new Date() })
        if (!success) {
          throw new Error(`Topic ranking with id ${id} not found`)
        }
        
        const updatedRanking = mockData.getTopicRankingById(id)
        if (!updatedRanking) {
          throw new Error('Failed to retrieve updated topic ranking')
        }
        return updatedRanking
      }
    } catch (error) {
      console.error('Failed to update topic ranking', { id, updates, error })
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (await this.isUsingCosmosDB()) {
        // For topic rankings, we need to find the ranking first to get the partition key
        const ranking = await this.findById(id)
        if (!ranking) {
          return false
        }
        return await this.cosmosDelete(id, ranking.eventId)
      } else {
        return mockData.removeTopicRanking(id)
      }
    } catch (error) {
      console.error('Failed to delete topic ranking', { id, error })
      throw error
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const ranking = await this.findById(id)
      return ranking !== null
    } catch (error) {
      console.error('Failed to check if topic ranking exists', { id, error })
      throw error
    }
  }

  private generateId(): string {
    return `ranking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const topicRankingService = new TopicRankingService()

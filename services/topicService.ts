import { BaseService } from './baseService'
import { mockData } from '../tests/helpers/mock-manager'
import type { Topic } from '../types/topic'
import logger from '../utils/logger'

export class TopicService extends BaseService<Topic> {
  protected readonly containerName = 'topics'
  protected readonly partitionKey = '/eventId'

  async findAll(): Promise<Topic[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Topic>('SELECT * FROM c')
      } else {
        return mockData.getTopics()
      }
    } catch (error) {
      logger.error('Failed to fetch all topics', { error })
      throw error
    }
  }

  async findById(id: string): Promise<Topic | null> {
    try {
      if (await this.isUsingCosmosDB()) {
        // For topics, we need to find by id but partition key is eventId
        // So we need to query instead of direct read
        const topics = await this.executeCosmosQuery<Topic>(
          'SELECT * FROM c WHERE c.id = @id',
          [{ name: '@id', value: id }]
        )
        return topics.length > 0 ? topics[0]! : null
      } else {
        return mockData.getTopicById(id) || null
      }
    } catch (error) {
      logger.error('Failed to fetch topic by id', { id, error })
      throw error
    }
  }

  async findByEventId(eventId: string): Promise<Topic[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Topic>(
          'SELECT * FROM c WHERE c.eventId = @eventId',
          [{ name: '@eventId', value: eventId }]
        )
      } else {
        return mockData.getTopicsByEventId(eventId)
      }
    } catch (error) {
      logger.error('Failed to fetch topics by event id', { eventId, error })
      throw error
    }
  }

  async findByProposer(proposedBy: string): Promise<Topic[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Topic>(
          'SELECT * FROM c WHERE c.proposedBy = @proposedBy',
          [{ name: '@proposedBy', value: proposedBy }]
        )
      } else {
        return mockData.getTopicsByProposer(proposedBy)
      }
    } catch (error) {
      logger.error('Failed to fetch topics by proposer', { proposedBy, error })
      throw error
    }
  }

  async findByStatus(status: string): Promise<Topic[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<Topic>(
          'SELECT * FROM c WHERE c.status = @status',
          [{ name: '@status', value: status }]
        )
      } else {
        return mockData.getTopics().filter(t => t.status === status)
      }
    } catch (error) {
      logger.error('Failed to fetch topics by status', { status, error })
      throw error
    }
  }

  async searchTopics(eventId: string, options: {
    search?: string
    status?: string
    proposedBy?: string
  }): Promise<Topic[]> {
    try {
      let topics: Topic[]

      if (await this.isUsingCosmosDB()) {
        let query = 'SELECT * FROM c WHERE c.eventId = @eventId'
        const parameters = [{ name: '@eventId', value: eventId }]

        if (options.status) {
          query += ' AND c.status = @status'
          parameters.push({ name: '@status', value: options.status })
        }

        if (options.proposedBy) {
          query += ' AND c.proposedBy = @proposedBy'
          parameters.push({ name: '@proposedBy', value: options.proposedBy })
        }

        if (options.search) {
          query += ' AND (CONTAINS(c.title, @search) OR CONTAINS(c.description, @search))'
          parameters.push({ name: '@search', value: options.search })
        }

        topics = await this.executeCosmosQuery<Topic>(query, parameters)
      } else {
        topics = mockData.getTopicsByEventId(eventId)

        // Apply filters
        if (options.search) {
          const searchLower = options.search.toLowerCase()
          topics = topics.filter(t => 
            t.title.toLowerCase().includes(searchLower) ||
            t.description?.toLowerCase().includes(searchLower) ||
            t.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchLower))
          )
        }

        if (options.status) {
          topics = topics.filter(t => t.status === options.status)
        }

        if (options.proposedBy) {
          topics = topics.filter(t => t.proposedBy === options.proposedBy)
        }
      }

      return topics
    } catch (error) {
      logger.error('Failed to search topics', { eventId, options, error })
      throw error
    }
  }

  async create(topicData: Omit<Topic, 'id'>): Promise<Topic> {
    try {
      const topic: Topic = {
        ...topicData,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (await this.isUsingCosmosDB()) {
        return await this.cosmosUpsert(topic)
      } else {
        mockData.addTopic(topic)
        return topic
      }
    } catch (error) {
      logger.error('Failed to create topic', { topicData, error })
      throw error
    }
  }

  async update(id: string, updates: Partial<Topic>): Promise<Topic> {
    try {
      if (await this.isUsingCosmosDB()) {
        const existingTopic = await this.findById(id)
        if (!existingTopic) {
          throw new Error(`Topic with id ${id} not found`)
        }

        const updatedTopic: Topic = {
          ...existingTopic,
          ...updates,
          id, // Ensure id doesn't change
          updatedAt: new Date()
        }

        return await this.cosmosUpsert(updatedTopic)
      } else {
        const success = mockData.updateTopic(id, { ...updates, updatedAt: new Date() })
        if (!success) {
          throw new Error(`Topic with id ${id} not found`)
        }
        
        const updatedTopic = mockData.getTopicById(id)
        if (!updatedTopic) {
          throw new Error('Failed to retrieve updated topic')
        }
        return updatedTopic
      }
    } catch (error) {
      logger.error('Failed to update topic', { id, updates, error })
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (await this.isUsingCosmosDB()) {
        // For topics, we need to find the topic first to get the partition key
        const topic = await this.findById(id)
        if (!topic) {
          return false
        }
        return await this.cosmosDelete(id, topic.eventId)
      } else {
        return mockData.removeTopic(id)
      }
    } catch (error) {
      logger.error('Failed to delete topic', { id, error })
      throw error
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const topic = await this.findById(id)
      return topic !== null
    } catch (error) {
      logger.error('Failed to check if topic exists', { id, error })
      throw error
    }
  }

  private generateId(): string {
    return `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const topicService = new TopicService()
import { CosmosClient } from '@azure/cosmos'
import type { Database } from '@azure/cosmos'
import { mockData } from '../tests/helpers/mock-manager'
import logger from '../utils/logger'
import { fileURLToPath } from 'url'

interface CosmosConfig {
  connectionString: string
  databaseName: string
}

/**
 * Populate staging CosmosDB database with mock data from mock-manager
 * 
 * This script takes the data from mock-manager.ts and persists it
 * into the actual CosmosDB staging database.
 */

export class StagingDatabasePopulator {
  private client: CosmosClient
  private database!: Database
  private config: CosmosConfig

  constructor(config: CosmosConfig) {
    this.config = config
    this.client = new CosmosClient(config.connectionString)
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing staging database connection')
      
      // Create database if it doesn't exist
      const { database } = await this.client.databases.createIfNotExists({
        id: this.config.databaseName
      })
      this.database = database

      // Create containers
      await this.createContainers()
      
      logger.info('Staging database initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize staging database', { error })
      throw error
    }
  }

  private async createContainers(): Promise<void> {
    const containers = [
      { id: 'users', partitionKey: '/email' },
      { id: 'events', partitionKey: '/id' },
      { id: 'participants', partitionKey: '/eventId' },
      { id: 'assignments', partitionKey: '/eventId' },
      { id: 'topics', partitionKey: '/eventId' },
      { id: 'organizers', partitionKey: '/eventId' },
      { id: 'topicRankings', partitionKey: '/eventId' }
    ]

    for (const containerDef of containers) {
      try {
        await this.database.containers.createIfNotExists({
          id: containerDef.id,
          partitionKey: containerDef.partitionKey
        })
        logger.info(`Container '${containerDef.id}' created or already exists`)
      } catch (error) {
        logger.error(`Failed to create container '${containerDef.id}'`, { error })
        throw error
      }
    }
  }

  async populateAllData(): Promise<void> {
    try {
      logger.info('Starting staging database population with mock data from mock-manager')
      
      // Reset mock data to ensure consistent state
      mockData.resetToDefaults()
      
      await this.populateUsers()
      await this.populateEvents()
      await this.populateParticipants()
      await this.populateTopics()
      await this.populateOrganizers()
      await this.populateTopicRankings()
      await this.populateAssignments()
      
      logger.info('Staging database population completed successfully')
    } catch (error) {
      logger.error('Failed to populate staging database', { error })
      throw error
    }
  }

  private async populateUsers(): Promise<void> {
    const container = this.database.container('users')
    const users = mockData.getUsers()
    
    logger.info(`Populating ${users.length} users into CosmosDB`)
    
    for (const user of users) {
      try {
        await container.items.upsert({
          ...user,
          id: user.email // Use email as document id (override the user.id if needed)
        })
        logger.debug(`User '${user.email}' persisted to staging database`)
      } catch (error) {
        logger.error(`Failed to persist user '${user.email}' to database`, { error })
        throw error
      }
    }
    
    logger.info('Users persisted to database successfully')
  }

  private async populateEvents(): Promise<void> {
    const container = this.database.container('events')
    const events = mockData.getEvents()
    
    logger.info(`Populating ${events.length} events into CosmosDB`)
    
    for (const event of events) {
      try {
        await container.items.upsert({
          ...event,
          id: event.id
        })
        logger.debug(`Event '${event.name}' persisted to staging database`)
      } catch (error) {
        logger.error(`Failed to persist event '${event.id}' to database`, { error })
        throw error
      }
    }
    
    logger.info('Events persisted to database successfully')
  }

  private async populateParticipants(): Promise<void> {
    const container = this.database.container('participants')
    const participants = mockData.getParticipants()
    
    logger.info(`Populating ${participants.length} participants into CosmosDB`)
    
    for (const participant of participants) {
      try {
        await container.items.upsert({
          ...participant,
          id: participant.id
        })
        logger.debug(`Participant '${participant.id}' persisted to staging database`)
      } catch (error) {
        logger.error(`Failed to persist participant '${participant.id}' to database`, { error })
        throw error
      }
    }
    
    logger.info('Participants persisted to database successfully')
  }

  private async populateTopics(): Promise<void> {
    const container = this.database.container('topics')
    const topics = mockData.getTopics()
    
    logger.info(`Populating ${topics.length} topics into CosmosDB`)
    
    for (const topic of topics) {
      try {
        await container.items.upsert({
          ...topic,
          id: topic.id
        })
        logger.debug(`Topic '${topic.id}' persisted to staging database`)
      } catch (error) {
        logger.error(`Failed to persist topic '${topic.id}' to database`, { error })
        throw error
      }
    }
    
    logger.info('Topics persisted to database successfully')
  }

  private async populateOrganizers(): Promise<void> {
    const container = this.database.container('organizers')
    const organizers = mockData.getOrganizers()
    
    logger.info(`Populating ${organizers.length} organizers into CosmosDB`)
    
    for (const organizer of organizers) {
      try {
        await container.items.upsert({
          ...organizer,
          id: organizer.id
        })
        logger.debug(`Organizer '${organizer.id}' persisted to staging database`)
      } catch (error) {
        logger.error(`Failed to persist organizer '${organizer.id}' to database`, { error })
        throw error
      }
    }
    
    logger.info('Organizers persisted to database successfully')
  }

  private async populateTopicRankings(): Promise<void> {
    const container = this.database.container('topicRankings')
    const rankings = mockData.getTopicRankings()
    
    logger.info(`Populating ${rankings.length} topic rankings into CosmosDB`)
    
    for (const ranking of rankings) {
      try {
        await container.items.upsert({
          ...ranking,
          id: ranking.id
        })
        logger.debug(`Topic ranking '${ranking.id}' persisted to staging database`)
      } catch (error) {
        logger.error(`Failed to persist topic ranking '${ranking.id}' to database`, { error })
        throw error
      }
    }
    
    logger.info('Topic rankings persisted to database successfully')
  }

  private async populateAssignments(): Promise<void> {
    const container = this.database.container('assignments')
    const assignments = mockData.getAssignments()
    
    logger.info(`Populating ${assignments.length} assignments into CosmosDB`)
    
    for (const assignment of assignments) {
      try {
        await container.items.upsert({
          ...assignment,
          id: assignment.id
        })
        logger.debug(`Assignment '${assignment.id}' persisted to staging database`)
      } catch (error) {
        logger.error(`Failed to persist assignment '${assignment.id}' to database`, { error })
        throw error
      }
    }
    
    logger.info('Assignments persisted to database successfully')
  }

  async cleanup(): Promise<void> {
    try {
      logger.info('Cleaning up staging database connection')
      this.client.dispose()
    } catch (error) {
      logger.error('Failed to cleanup staging database connection', { error })
    }
  }
}

// Main execution function
async function populateStagingDatabase(): Promise<void> {
  // Try different environment variable patterns
  const endpoint = process.env.COSMOS_DB_ENDPOINT_STAGING
  const key = process.env.COSMOS_DB_KEY_STAGING
  const connectionString = process.env.COSMOS_DB_CONNECTION_STRING_STAGING
  const databaseName = process.env.COSMODB_DATABASE || 'unconference-me'

  let finalConnectionString = ''

  if (connectionString && connectionString.includes('AccountKey=')) {
    finalConnectionString = connectionString
  } else if (endpoint && key) {
    finalConnectionString = `AccountEndpoint=${endpoint};AccountKey=${key};`
  } else if (connectionString) {
    // Try to use the partial connection string - might work for some scenarios
    finalConnectionString = connectionString
  }

  const config: CosmosConfig = {
    connectionString: finalConnectionString,
    databaseName: databaseName
  }

  // Validate configuration
  if (!config.connectionString) {
    logger.error('Missing required staging database configuration')
    logger.error('Please set COSMOS_DB_CONNECTION_STRING_STAGING environment variable')
    throw new Error('COSMOS_DB_CONNECTION_STRING_STAGING environment variable is required')
  }

  // Check if connection string looks valid
  if (!config.connectionString.includes('AccountKey=') || config.connectionString.length < 100) {
    logger.error('CosmosDB connection string appears to be incomplete or invalid')
    logger.error(`Connection string length: ${config.connectionString.length}`)
    logger.error(`Connection string preview: ${config.connectionString.substring(0, 50)}...`)
    throw new Error('Invalid or incomplete COSMOS_DB_CONNECTION_STRING_STAGING')
  }

  logger.info('Persisting mock data from mock-manager into staging CosmosDB database')
  logger.info(`Database: ${config.databaseName}`)
  
  const populator = new StagingDatabasePopulator(config)
  
  try {
    await populator.initialize()
    await populator.populateAllData()
    logger.info('Mock data successfully persisted to staging CosmosDB database')
  } catch (error) {
    logger.error('Staging database population failed', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  } finally {
    await populator.cleanup()
  }
}

// Execute if run directly
const __filename = fileURLToPath(import.meta.url)

if (process.argv[1] === __filename) {
  populateStagingDatabase()
    .then(() => {
      logger.info('Script execution completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Script execution failed', { error })
      process.exit(1)
    })
}

export { populateStagingDatabase }

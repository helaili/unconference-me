import { CosmosClient, Database, Container } from '@azure/cosmos'
import { mockData } from '../tests/helpers/mock-manager'
import { logger } from '../utils/logger'

interface CosmosConfig {
  connectionString: string
  databaseName: string
}

/**
 * Populate staging CosmosDB database with mock data
 */
export class StagingDatabasePopulator {
  private client: CosmosClient
  private database: Database
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
      { id: 'assignments', partitionKey: '/eventId' }
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
      logger.info('Starting staging database population with mock data')
      
      // Reset mock data to ensure consistent state
      mockData.resetToDefaults()
      
      await this.populateUsers()
      await this.populateEvents()
      await this.populateParticipants()
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
    
    logger.info(`Populating ${users.length} users`)
    
    for (const user of users) {
      try {
        await container.items.upsert({
          id: user.email, // Use email as document id
          ...user
        })
        logger.debug(`User '${user.email}' added to staging database`)
      } catch (error) {
        logger.error(`Failed to add user '${user.email}'`, { error })
        throw error
      }
    }
    
    logger.info('Users population completed')
  }

  private async populateEvents(): Promise<void> {
    const container = this.database.container('events')
    const events = mockData.getEvents()
    
    logger.info(`Populating ${events.length} events`)
    
    for (const event of events) {
      try {
        await container.items.upsert({
          id: event.id,
          ...event
        })
        logger.debug(`Event '${event.name}' added to staging database`)
      } catch (error) {
        logger.error(`Failed to add event '${event.id}'`, { error })
        throw error
      }
    }
    
    logger.info('Events population completed')
  }

  private async populateParticipants(): Promise<void> {
    const container = this.database.container('participants')
    const participants = mockData.getParticipants()
    
    logger.info(`Populating ${participants.length} participants`)
    
    for (const participant of participants) {
      try {
        await container.items.upsert({
          id: participant.id,
          ...participant
        })
        logger.debug(`Participant '${participant.id}' added to staging database`)
      } catch (error) {
        logger.error(`Failed to add participant '${participant.id}'`, { error })
        throw error
      }
    }
    
    logger.info('Participants population completed')
  }

  private async populateAssignments(): Promise<void> {
    const container = this.database.container('assignments')
    const assignments = mockData.getAssignments()
    
    logger.info(`Populating ${assignments.length} assignments`)
    
    for (const assignment of assignments) {
      try {
        await container.items.upsert({
          id: assignment.id,
          ...assignment
        })
        logger.debug(`Assignment '${assignment.id}' added to staging database`)
      } catch (error) {
        logger.error(`Failed to add assignment '${assignment.id}'`, { error })
        throw error
      }
    }
    
    logger.info('Assignments population completed')
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
  const config: CosmosConfig = {
    connectionString: process.env.COSMOS_DB_CONNECTION_STRING_STAGING || '',
    databaseName: process.env.COSMOS_DB_DATABASE_NAME_STAGING || 'unconference-staging'
  }

  // Validate configuration
  if (!config.connectionString) {
    logger.error('Missing required staging database configuration')
    throw new Error('COSMOS_DB_CONNECTION_STRING_STAGING environment variable is required')
  }

  const populator = new StagingDatabasePopulator(config)
  
  try {
    await populator.initialize()
    await populator.populateAllData()
    logger.info('Staging database population completed successfully')
  } catch (error) {
    logger.error('Staging database population failed', { error })
    throw error
  } finally {
    await populator.cleanup()
  }
}

// Execute if run directly
if (require.main === module) {
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
      process.exit(1)
    })
}

export { populateStagingDatabase }

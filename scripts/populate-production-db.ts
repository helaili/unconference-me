import { CosmosClient, Database, Container } from '@azure/cosmos'
import { mockData } from '../tests/helpers/mock-manager'
import { logger } from '../utils/logger'
import type { Event } from '../types/event'

interface CosmosConfig {
  connectionString: string
  databaseName: string
}

/**
 * Populate production CosmosDB database with minimal default event data
 */
export class ProductionDatabasePopulator {
  private client: CosmosClient
  private database: Database
  private config: CosmosConfig

  constructor(config: CosmosConfig) {
    this.config = config
    this.client = new CosmosClient(config.connectionString)
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing production database connection')
      
      // Create database if it doesn't exist
      const { database } = await this.client.databases.createIfNotExists({
        id: this.config.databaseName
      })
      this.database = database

      // Create containers
      await this.createContainers()
      
      logger.info('Production database initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize production database', { error })
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

  async populateMinimalData(): Promise<void> {
    try {
      logger.info('Starting production database population with minimal default data')
      
      // Reset mock data to ensure consistent state
      mockData.resetToDefaults()
      
      // Only populate the default event for production
      await this.populateDefaultEvent()
      
      logger.info('Production database population completed successfully')
    } catch (error) {
      logger.error('Failed to populate production database', { error })
      throw error
    }
  }

  private async populateDefaultEvent(): Promise<void> {
    const container = this.database.container('events')
    const events = mockData.getEvents()
    
    // Only take the first (default) event
    const defaultEvent = events[0]
    if (!defaultEvent) {
      logger.warn('No default event found in mock data')
      return
    }
    
    logger.info(`Populating default event: ${defaultEvent.name}`)
    
    try {
      await container.items.upsert({
        id: defaultEvent.id,
        ...defaultEvent
      })
      logger.info(`Default event '${defaultEvent.name}' added to production database`)
    } catch (error) {
      logger.error(`Failed to add default event '${defaultEvent.id}'`, { error })
      throw error
    }
  }

  /**
   * Create admin user for production (optional)
   */
  async createAdminUser(adminEmail: string, adminPassword: string): Promise<void> {
    const container = this.database.container('users')
    
    const adminUser = {
      id: adminEmail,
      email: adminEmail,
      firstname: 'Admin',
      lastname: 'User',
      password: adminPassword,
      role: 'Admin'
    }
    
    try {
      await container.items.upsert(adminUser)
      logger.info(`Admin user '${adminEmail}' created in production database`)
    } catch (error) {
      logger.error(`Failed to create admin user '${adminEmail}'`, { error })
      throw error
    }
  }

  async cleanup(): Promise<void> {
    try {
      logger.info('Cleaning up production database connection')
      this.client.dispose()
    } catch (error) {
      logger.error('Failed to cleanup production database connection', { error })
    }
  }
}

// Main execution function
async function populateProductionDatabase(): Promise<void> {
  const config: CosmosConfig = {
    connectionString: process.env.COSMOS_DB_CONNECTION_STRING_PRODUCTION || '',
    databaseName: process.env.COSMOS_DB_DATABASE_NAME_PRODUCTION || 'unconference-production'
  }

  // Validate configuration
  if (!config.connectionString) {
    logger.error('Missing required production database configuration')
    throw new Error('COSMOS_DB_CONNECTION_STRING_PRODUCTION environment variable is required')
  }

  const populator = new ProductionDatabasePopulator(config)
  
  try {
    await populator.initialize()
    await populator.populateMinimalData()
    
    // Optionally create admin user if credentials are provided
    const adminEmail = process.env.PRODUCTION_ADMIN_EMAIL
    const adminPassword = process.env.PRODUCTION_ADMIN_PASSWORD
    
    if (adminEmail && adminPassword) {
      await populator.createAdminUser(adminEmail, adminPassword)
    } else {
      logger.warn('No admin user credentials provided - skipping admin user creation')
    }
    
    logger.info('Production database population completed successfully')
  } catch (error) {
    logger.error('Production database population failed', { error })
    throw error
  } finally {
    await populator.cleanup()
  }
}

// Execute if run directly
if (require.main === module) {
  populateProductionDatabase()
    .then(() => {
      logger.info('Script execution completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Script execution failed', { error })
      process.exit(1)
    })
}

export { populateProductionDatabase }
      process.exit(1)
    })
}

export { populateProductionDatabase }

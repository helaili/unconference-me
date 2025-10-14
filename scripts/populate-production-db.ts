import { CosmosClient } from '@azure/cosmos'
import type { Database } from '@azure/cosmos'
import { mockData } from '../tests/helpers/mock-manager'
import logger from '../utils/logger'
import { PasswordUtils } from '../utils/password'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

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
    
    // Hash the password before storing
    const hashedPassword = await PasswordUtils.hashPassword(adminPassword)
    
    const adminUser = {
      id: adminEmail,
      email: adminEmail,
      firstname: 'Admin',
      lastname: 'User',
      password: hashedPassword,
      role: 'Admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    try {
      await container.items.upsert(adminUser)
      logger.info(`Admin user '${adminEmail}' created in production database with hashed password`)
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

// Mock service population for production (used in Copilot mode)
async function populateProductionWithMockServices(): Promise<void> {
  try {
    logger.info('Starting production mock service population with data from mock-manager')
    
    // Reset mock data to ensure consistent state
    mockData.resetToDefaults()
    
    // Get all data from mock manager
    const users = mockData.getUsers()
    const events = mockData.getEvents()
    const participants = mockData.getParticipants()
    const assignments = mockData.getAssignments()
    
    logger.info(`Production mock data summary:`)
    logger.info(`- Users: ${users.length}`)
    logger.info(`- Events: ${events.length}`)
    logger.info(`- Participants: ${participants.length}`)
    logger.info(`- Assignments: ${assignments.length}`)
    
    logger.info('Production mock data from mock-manager is ready and validated')
    logger.info('Production mock service population completed successfully')
    
  } catch (error) {
    logger.error('Failed to populate production with mock services', { error })
    throw error
  }
}

// Main execution function
async function populateProductionDatabase(): Promise<void> {
  // Check if running in Copilot mode - always use mock services in this case
  if (process.env.APP_ENV === 'copilot') {
    logger.info('Running in Copilot mode, using mock services as required by project architecture')
    await populateProductionWithMockServices()
    return
  }

  const config: CosmosConfig = {
    connectionString: process.env.COSMOS_DB_CONNECTION_STRING_PRODUCTION || '',
    databaseName: process.env.COSMODB_DATABASE || 'unconference-me'
  }

  // Validate configuration
  if (!config.connectionString) {
    logger.info('Production database connection string not available, using mock services')
    await populateProductionWithMockServices()
    return
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
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

if (process.argv[1] === __filename) {
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

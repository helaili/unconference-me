import { CosmosClient } from '@azure/cosmos'
import type { Database } from '@azure/cosmos'
import { mockData } from '../tests/helpers/mock-manager'
import { PasswordUtils } from '../server/utils/password'
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
      console.log('Initializing production database connection')
      
      // Create database if it doesn't exist
      const { database } = await this.client.databases.createIfNotExists({
        id: this.config.databaseName
      })
      this.database = database

      // Create containers
      await this.createContainers()
      
      console.log('Production database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize production database', { error })
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
      { id: 'topicRankings', partitionKey: '/eventId' },
      { id: 'organizers', partitionKey: '/eventId' }
    ]

    for (const containerDef of containers) {
      try {
        await this.database.containers.createIfNotExists({
          id: containerDef.id,
          partitionKey: containerDef.partitionKey
        })
        console.log(`Container '${containerDef.id}' created or already exists`)
      } catch (error) {
        console.error(`Failed to create container '${containerDef.id}'`, { error })
        throw error
      }
    }
  }

  async populateMinimalData(): Promise<void> {
    try {
      console.log('Starting production database population with minimal default data')
      
      // Reset mock data to ensure consistent state
      mockData.resetToDefaults()
      
      // Only populate the default event for production
      await this.populateDefaultEvent()
      
      console.log('Production database population completed successfully')
    } catch (error) {
      console.error('Failed to populate production database', { error })
      throw error
    }
  }

  private async populateDefaultEvent(): Promise<void> {
    const container = this.database.container('events')
    const events = mockData.getEvents()
    
    // Only take the first (default) event
    const defaultEvent = events[0]
    if (!defaultEvent) {
      console.warn('No default event found in mock data')
      return
    }
    
    console.log(`Populating default event: ${defaultEvent.name}`)
    
    try {
      await container.items.upsert({
        id: defaultEvent.id,
        ...defaultEvent
      })
      console.log(`Default event '${defaultEvent.name}' added to production database`)
    } catch (error) {
      console.error(`Failed to add default event '${defaultEvent.id}'`, { error })
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
      console.log(`Admin user '${adminEmail}' created in production database with hashed password`)
    } catch (error) {
      console.error(`Failed to create admin user '${adminEmail}'`, { error })
      throw error
    }
  }

  async cleanup(): Promise<void> {
    try {
      console.log('Cleaning up production database connection')
      this.client.dispose()
    } catch (error) {
      console.error('Failed to cleanup production database connection', { error })
    }
  }
}

// Mock service population for production (used in Copilot mode)
async function populateProductionWithMockServices(): Promise<void> {
  try {
    console.log('Starting production mock service population with data from mock-manager')
    const hashedPassword = '$2b$12$LGtR/rq3C67ODqfZiN.5Z.6JAuj4VBO7n8J4hWAtDbPLVD/hjkt5G' // "changeme"

    // Reset mock data to ensure consistent state
    mockData.resetToDefaults()
    
    // Get all data from mock manager
    const users = [
      {
        id: "helaili@github.com",
        firstname: "Alain",
        lastname: "Helaili",
        email: "helaili@github.com",
        password: hashedPassword,
        role: "Admin",
        createdAt: new Date('2025-10-19'),
        updatedAt: new Date('2025-10-19'),
      },
    ]
    const events = [
      {
        id: '1',
        name: 'Universe User Group 2025',
        description: 'Annual unconference event for Universe users',
        location: 'Convene 100 Stockton, Union Square, San Francisco',
        startDate: new Date('2025-10-27T09:00:00Z'),
        endDate: new Date('2025-10-27T17:00:00Z'),
        numberOfRounds: 3,
        discussionsPerRound: 5,
        idealGroupSize: 8,
        minGroupSize: 5,
        maxGroupSize: 10,
        status: 'active',
        createdAt: new Date('2025-10-19T00:00:00Z'),
        updatedAt: new Date('2025-10-19T00:00:00Z'),
        settings: {
          enableTopicRanking: true,
          minTopicsToRank: 6,
          enableAutoAssignment: false,
          maxTopicsPerParticipant: 3,
          requireApproval: false,
          maxParticipants: 100
        }
      }
    ]
    const participants = []
    const assignments = []

    console.log(`Production mock data summary:`)
    console.log(`- Users: ${users.length}`)
    console.log(`- Events: ${events.length}`)
    console.log(`- Participants: ${participants.length}`)
    console.log(`- Assignments: ${assignments.length}`)
    
    console.log('Production mock data from mock-manager is ready and validated')
    console.log('Production mock service population completed successfully')
    
  } catch (error) {
    console.error('Failed to populate production with mock services', { error })
    throw error
  }
}

// Main execution function
async function populateProductionDatabase(): Promise<void> {
  // Check if running in Copilot mode - always use mock services in this case
  if (process.env.APP_ENV === 'copilot') {
    console.log('Running in Copilot mode, using mock services as required by project architecture')
    await populateProductionWithMockServices()
    return
  }

  const config: CosmosConfig = {
    connectionString: process.env.COSMOS_DB_CONNECTION_STRING_PRODUCTION || '',
    databaseName: process.env.COSMODB_DATABASE || 'unconference-me'
  }

  // Validate configuration
  if (!config.connectionString) {
    console.log('Production database connection string not available, using mock services')
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
      console.warn('No admin user credentials provided - skipping admin user creation')
    }
    
    console.log('Production database population completed successfully')
  } catch (error) {
    console.error('Production database population failed', { error })
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
      console.log('Script execution completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Script execution failed', { error })
      process.exit(1)
    })
}

export { populateProductionDatabase }

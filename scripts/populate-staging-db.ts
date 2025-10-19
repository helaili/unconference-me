import { CosmosClient } from '@azure/cosmos'
import type { Database } from '@azure/cosmos'
import { mockData } from '../tests/helpers/mock-manager'
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
      console.log('Initializing staging database connection')
      
      // Create database if it doesn't exist
      const { database } = await this.client.databases.createIfNotExists({
        id: this.config.databaseName
      })
      this.database = database

      // Create containers
      await this.createContainers()
      
      console.log('Staging database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize staging database', { error })
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

  private async generateComprehensiveData(): Promise<void> {
    console.log('Generating comprehensive mock data...')
    
    // Pre-hashed password for all users
    const hashedPassword = '$2b$12$LGtR/rq3C67ODqfZiN.5Z.6JAuj4VBO7n8J4hWAtDbPLVD/hjkt5G' // "changeme"
    
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary',
                        'William', 'Jennifer', 'Richard', 'Linda', 'Joseph', 'Patricia', 'Thomas', 'Barbara', 'Christopher', 'Elizabeth',
                        'Daniel', 'Jessica', 'Matthew', 'Susan', 'Anthony', 'Karen', 'Mark', 'Nancy', 'Donald', 'Betty',
                        'Steven', 'Helen', 'Paul', 'Sandra', 'Andrew', 'Donna', 'Joshua', 'Carol', 'Kenneth', 'Ruth',
                        'Kevin', 'Sharon', 'Brian', 'Michelle', 'George', 'Laura', 'Edward', 'Sarah', 'Ronald', 'Kimberly']
    
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                       'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
                       'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
                       'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
                       'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts']
    
    const companies = ['TechCorp', 'InnoSoft', 'DataSys', 'CloudNet', 'DevHub', 'CodeLabs', 'ByteWorks', 'WebForge', 
                      'AppMasters', 'SysGuru', 'NetPro', 'InfoTech', 'DigiSoft', 'SmartCode', 'AgileOps']
    
    const topicTitles = [
      'Microservices Architecture Patterns',
      'Kubernetes Best Practices',
      'Serverless Computing at Scale',
      'GraphQL vs REST APIs',
      'Event-Driven Architecture',
      'Domain-Driven Design',
      'API Gateway Patterns',
      'Database Sharding Strategies',
      'CI/CD Pipeline Optimization',
      'Infrastructure as Code',
      'Observability and Monitoring',
      'Service Mesh Implementation',
      'Cloud Native Security',
      'Container Orchestration',
      'Distributed Tracing',
      'Message Queue Architectures',
      'Zero Trust Security Model',
      'Multi-Cloud Strategies',
      'Edge Computing Applications',
      'WebAssembly in Production',
      'Machine Learning Operations',
      'Data Mesh Architecture',
      'API Versioning Strategies',
      'Chaos Engineering Practices',
      'Progressive Web Apps',
      'Real-time Data Processing',
      'Blockchain Integration',
      'AI-Powered Development Tools',
      'Low-Code Platforms',
      'Developer Experience Optimization'
    ]
    
    // Generate 130 participants + 20 organizers
    const users = []
    const participants = []
    const organizers = []
    
    // Admin user
    mockData.addUser({
      id: 'admin@unconference.com',
      email: 'admin@unconference.com',
      firstname: 'Admin',
      lastname: 'User',
      password: hashedPassword,
      role: 'Admin',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    })
    
    // Generate 20 organizers
    for (let i = 0; i < 20; i++) {
      const firstname = firstNames[i % firstNames.length]!
      const lastname = lastNames[i % lastNames.length]!
      const company = companies[i % companies.length]!
      const email = `organizer${i + 1}@${company.toLowerCase()}.com`
      
      mockData.addUser({
        id: email,
        email,
        firstname: `${firstname}`,
        lastname: `${lastname}`,
        password: hashedPassword,
        role: 'Organizer',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      })
      
      // Distribute roles: 1 owner, 5 admins, rest moderators
      let role: 'owner' | 'admin' | 'moderator'
      if (i === 0) {
        role = 'owner'
      } else if (i < 6) {
        role = 'admin'
      } else {
        role = 'moderator'
      }
      
      mockData.addOrganizer({
        id: `organizer-${i + 1}`,
        eventId: '1',
        userId: email,
        email,
        firstname: `${firstname}`,
        lastname: `${lastname}`,
        role,
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        permissions: {
          canEditEvent: i < 5,
          canDeleteEvent: i === 0,
          canApproveParticipants: true,
          canRemoveParticipants: i < 10,
          canApproveTopics: true,
          canRejectTopics: true,
          canScheduleTopics: true,
          canManageAssignments: i < 10,
          canRunAutoAssignment: i < 5,
          canViewReports: true,
          canExportData: i < 10
        }
      })
    }
    
    // Generate 130 participants
    for (let i = 0; i < 130; i++) {
      const firstname = firstNames[(i + 20) % firstNames.length]!
      const lastname = lastNames[(i + 20) % lastNames.length]!
      const company = companies[i % companies.length]!
      const email = `participant${i + 1}@${company.toLowerCase()}.com`
      
      mockData.addUser({
        id: email,
        email,
        firstname,
        lastname,
        password: hashedPassword,
        role: 'Participant',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      })
      
      const statuses = ['registered', 'confirmed', 'checked-in']
      mockData.addParticipant({
        id: `participant-${i + 1}`,
        eventId: '1',
        userId: email,
        email,
        firstname,
        lastname,
        status: statuses[i % 3] as 'registered' | 'confirmed' | 'checked-in',
        registrationDate: new Date(2024, 8, 1 + (i % 30)),
        createdAt: new Date(2024, 8, 1 + (i % 30)),
        updatedAt: new Date(2024, 8, 1 + (i % 30))
      })
    }
    
    // Create main event
    mockData.addEvent({
      id: '1',
      name: 'Universe User Group 2025',
      description: 'Annual unconference event for Universe users',
      location: 'Convene 100 Stockton, Union Square, San Francisco',
      startDate: new Date('2025-10-27T09:00:00Z'),
      endDate: new Date('2025-10-27T17:00:00Z'),
      numberOfRounds: 3,
      discussionsPerRound: 10,
      idealGroupSize: 8,
      minGroupSize: 5,
      maxGroupSize: 12,
      status: 'active',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-10-01T00:00:00Z'),
      settings: {
        enableTopicRanking: true,
        minTopicsToRank: 3,
        enableAutoAssignment: true,
        maxTopicsPerParticipant: 3,
        requireApproval: false,
        maxParticipants: 150
      }
    })
    
    // Generate 30 topics proposed by 20 different participants
    const proposerParticipants = Array.from({ length: 20 }, (_, i) => `participant-${i + 1}`)
    
    for (let i = 0; i < 30; i++) {
      const proposerIndex = i % 20
      const proposerId = proposerParticipants[proposerIndex]!
      const topicTitle = topicTitles[i]!
      
      mockData.addTopic({
        id: `topic-${i + 1}`,
        eventId: '1',
        title: topicTitle,
        description: `Deep dive discussion on ${topicTitle.toLowerCase()} and its practical applications in modern software development.`,
        proposedBy: proposerId,
        status: 'approved',
        createdAt: new Date(2024, 8, 10 + (i % 20)),
        updatedAt: new Date(2024, 8, 10 + (i % 20)),
        metadata: {
          tags: ['technology', 'development', 'architecture']
        }
      })
    }
    
    // Generate topic rankings - most participants rank their 6 favorite topics
    for (let i = 0; i < 130; i++) {
      const participantId = `participant-${i + 1}`
      
      // 80% of participants have ranked topics (104 participants)
      if (i < 104) {
        const rankedTopicIds: string[] = []
        const usedTopics = new Set<number>()
        
        // Rank 6 topics with preferences
        for (let rank = 1; rank <= 6; rank++) {
          let topicIndex
          do {
            topicIndex = Math.floor(Math.random() * 30)
          } while (usedTopics.has(topicIndex))
          
          usedTopics.add(topicIndex)
          rankedTopicIds.push(`topic-${topicIndex + 1}`)
        }
        
        const rankingDate = new Date(2024, 9, 1 + (i % 15))
        mockData.addTopicRanking({
          id: `ranking-${i + 1}`,
          participantId,
          eventId: '1',
          rankedTopicIds,
          lastViewedAt: rankingDate,
          lastRankedAt: rankingDate,
          createdAt: rankingDate,
          updatedAt: rankingDate
        })
      }
    }
    
    console.log(`Generated ${mockData.getUsers().length} users`)
    console.log(`Generated ${mockData.getParticipants().length} participants`)
    console.log(`Generated ${mockData.getOrganizers().length} organizers`)
    console.log(`Generated ${mockData.getTopics().length} topics`)
    console.log(`Generated ${mockData.getTopicRankings().length} topic rankings`)
  }

  async populateAllData(): Promise<void> {
    try {
      console.log('Starting staging database population with enhanced data')
      
      // Clear and generate comprehensive data
      mockData.clearAll()
      await this.generateComprehensiveData()
      
      await this.populateUsers()
      await this.populateEvents()
      await this.populateParticipants()
      await this.populateTopics()
      await this.populateTopicRankings()
      await this.populateOrganizers()
      await this.populateAssignments()
      
      console.log('Staging database population completed successfully')
    } catch (error) {
      console.error('Failed to populate staging database', { error })
      throw error
    }
  }

  private async populateUsers(): Promise<void> {
    const container = this.database.container('users')
    const users = mockData.getUsers()
    
    console.log(`Populating ${users.length} users into CosmosDB`)
    
    for (const user of users) {
      try {
        await container.items.upsert({
          ...user,
          id: user.email // Use email as document id (overwrites user.id)
        })
        console.log(`User '${user.email}' persisted to staging database`)
      } catch (error) {
        console.error(`Failed to persist user '${user.email}' to database`, { error })
        throw error
      }
    }
    
    console.log('Users persisted to database successfully')
  }

  private async populateEvents(): Promise<void> {
    const container = this.database.container('events')
    const events = mockData.getEvents()
    
    console.log(`Populating ${events.length} events into CosmosDB`)
    
    for (const event of events) {
      try {
        await container.items.upsert({
          ...event,
          id: event.id
        })
        console.log(`Event '${event.name}' persisted to staging database`)
      } catch (error) {
        console.error(`Failed to persist event '${event.id}' to database`, { error })
        throw error
      }
    }
    
    console.log('Events persisted to database successfully')
  }

  private async populateParticipants(): Promise<void> {
    const container = this.database.container('participants')
    const participants = mockData.getParticipants()
    
    console.log(`Populating ${participants.length} participants into CosmosDB`)
    
    for (const participant of participants) {
      try {
        await container.items.upsert({
          ...participant,
          id: participant.id
        })
        console.log(`Participant '${participant.id}' persisted to staging database`)
      } catch (error) {
        console.error(`Failed to persist participant '${participant.id}' to database`, { error })
        throw error
      }
    }
    
    console.log('Participants persisted to database successfully')
  }

  private async populateAssignments(): Promise<void> {
    const container = this.database.container('assignments')
    const assignments = mockData.getAssignments()
    
    console.log(`Populating ${assignments.length} assignments into CosmosDB`)
    
    for (const assignment of assignments) {
      try {
        await container.items.upsert({
          ...assignment,
          id: assignment.id
        })
        console.log(`Assignment '${assignment.id}' persisted to staging database`)
      } catch (error) {
        console.error(`Failed to persist assignment '${assignment.id}' to database`, { error })
        throw error
      }
    }
    
    console.log('Assignments persisted to database successfully')
  }

  private async populateTopics(): Promise<void> {
    const container = this.database.container('topics')
    const topics = mockData.getTopics()
    
    console.log(`Populating ${topics.length} topics into CosmosDB`)
    
    for (const topic of topics) {
      try {
        await container.items.upsert({
          ...topic,
          id: topic.id
        })
        console.log(`Topic '${topic.id}' persisted to staging database`)
      } catch (error) {
        console.error(`Failed to persist topic '${topic.id}' to database`, { error })
        throw error
      }
    }
    
    console.log('Topics persisted to database successfully')
  }

  private async populateTopicRankings(): Promise<void> {
    const container = this.database.container('topicRankings')
    const rankings = mockData.getTopicRankings()
    
    console.log(`Populating ${rankings.length} topic rankings into CosmosDB`)
    
    for (const ranking of rankings) {
      try {
        await container.items.upsert({
          ...ranking,
          id: ranking.id
        })
        console.log(`Topic ranking '${ranking.id}' persisted to staging database`)
      } catch (error) {
        console.error(`Failed to persist topic ranking '${ranking.id}' to database`, { error })
        throw error
      }
    }
    
    console.log('Topic rankings persisted to database successfully')
  }

  private async populateOrganizers(): Promise<void> {
    const container = this.database.container('organizers')
    const organizers = mockData.getOrganizers()
    
    console.log(`Populating ${organizers.length} organizers into CosmosDB`)
    
    for (const organizer of organizers) {
      try {
        await container.items.upsert({
          ...organizer,
          id: organizer.id
        })
        console.log(`Organizer '${organizer.id}' persisted to staging database`)
      } catch (error) {
        console.error(`Failed to persist organizer '${organizer.id}' to database`, { error })
        throw error
      }
    }
    
    console.log('Organizers persisted to database successfully')
  }

  async cleanup(): Promise<void> {
    try {
      console.log('Cleaning up staging database connection')
      this.client.dispose()
    } catch (error) {
      console.error('Failed to cleanup staging database connection', { error })
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
    console.error('Missing required staging database configuration')
    console.error('Please set COSMOS_DB_CONNECTION_STRING_STAGING environment variable')
    throw new Error('COSMOS_DB_CONNECTION_STRING_STAGING environment variable is required')
  }

  // Check if connection string looks valid
  if (!config.connectionString.includes('AccountKey=') || config.connectionString.length < 100) {
    console.error('CosmosDB connection string appears to be incomplete or invalid')
    console.error(`Connection string length: ${config.connectionString.length}`)
    console.error(`Connection string preview: ${config.connectionString.substring(0, 50)}...`)
    throw new Error('Invalid or incomplete COSMOS_DB_CONNECTION_STRING_STAGING')
  }

  console.log('Persisting mock data from mock-manager into staging CosmosDB database')
  console.log(`Database: ${config.databaseName}`)
  
  const populator = new StagingDatabasePopulator(config)
  
  try {
    await populator.initialize()
    await populator.populateAllData()
    console.log('Mock data successfully persisted to staging CosmosDB database')
  } catch (error) {
    console.error('Staging database population failed', { 
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
      console.log('Script execution completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Script execution failed', { error })
      process.exit(1)
    })
}

export { populateStagingDatabase }

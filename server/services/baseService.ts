import { CosmosClient, type Database, type Container, type SqlParameter } from '@azure/cosmos'

/**
 * Base Service Class that handles both mock data and CosmosDB
 * 
 * This service automatically determines whether to use mock data or CosmosDB
 * based on the runtime configuration.
 */
export abstract class BaseService<T extends { id: string }> {
  protected abstract readonly containerName: string
  protected abstract readonly partitionKey: string
  
  private client?: CosmosClient
  private database?: Database
  private container?: Container
  private isInitialized = false

  constructor() {
    // Constructor is kept empty - initialization happens lazily
  }

  private async initializeCosmosClient(): Promise<void> {
    if (this.client) return // Already initialized

    const config = useRuntimeConfig()
    const appEnv = config.appEnv
    
    // Only initialize CosmosDB client for staging and production environments
    if (appEnv === 'staging' || appEnv === 'production') {
      const connectionString = config.cosmosdb.connectionString
      
      if (!connectionString) {
        console.error('COSMODB_PRIMARY_CONNECTION_STRING environment variable is required for staging/production')
        throw new Error('Missing CosmosDB connection string')
      }

      this.client = new CosmosClient(connectionString)
      console.info(`Initialized CosmosDB client for environment: ${appEnv}`)
    } else {
      console.info(`Using mock data for environment: ${appEnv || 'development'}`)
    }
  }

  private async ensureContainer(): Promise<void> {
    if (this.isInitialized || !this.client) return

    try {
      const config = useRuntimeConfig()
      const databaseName = config.cosmosdb.database
      
      // Get or create database
      const { database } = await this.client.databases.createIfNotExists({
        id: databaseName
      })
      this.database = database

      // Get or create container
      const { container } = await this.database.containers.createIfNotExists({
        id: this.containerName,
        partitionKey: this.partitionKey
      })
      this.container = container

      this.isInitialized = true
      console.info(`Container '${this.containerName}' initialized successfully`)
    } catch (error) {
      console.error(`Failed to initialize container '${this.containerName}'`, { error })
      throw error
    }
  }

  protected async isUsingCosmosDB(): Promise<boolean> {
    const config = useRuntimeConfig()
    const appEnv = config.appEnv
    return appEnv === 'staging' || appEnv === 'production'
  }

  protected async executeCosmosQuery<TResult = T>(
    query: string,
    parameters?: SqlParameter[]
  ): Promise<TResult[]> {
    if (!(await this.isUsingCosmosDB())) {
      throw new Error('CosmosDB operations are only available in staging/production environments')
    }

    await this.initializeCosmosClient()
    await this.ensureContainer()
    
    try {
      const { resources } = await this.container!.items.query<TResult>({
        query,
        parameters
      }).fetchAll()
      
      return resources
    } catch (error) {
      console.error('Failed to execute CosmosDB query', { query, parameters, error })
      throw error
    }
  }

  protected async cosmosUpsert(item: T): Promise<T> {
    if (!(await this.isUsingCosmosDB())) {
      throw new Error('CosmosDB operations are only available in staging/production environments')
    }

    await this.initializeCosmosClient()
    await this.ensureContainer()
    
    try {
      const { resource } = await this.container!.items.upsert(item)
      return resource as unknown as T
    } catch (error) {
      console.error('Failed to upsert item to CosmosDB', { item, error })
      throw error
    }
  }

  protected async cosmosDelete(id: string, partitionKeyValue?: string): Promise<boolean> {
    if (!(await this.isUsingCosmosDB())) {
      throw new Error('CosmosDB operations are only available in staging/production environments')
    }

    await this.initializeCosmosClient()
    await this.ensureContainer()
    
    try {
      await this.container!.item(id, partitionKeyValue || id).delete()
      return true
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
        return false // Item doesn't exist
      }
      console.error('Failed to delete item from CosmosDB', { id, partitionKeyValue, error })
      throw error
    }
  }

  protected async cosmosReadById(id: string, partitionKeyValue?: string): Promise<T | null> {
    if (!(await this.isUsingCosmosDB())) {
      throw new Error('CosmosDB operations are only available in staging/production environments')
    }

    await this.initializeCosmosClient()
    await this.ensureContainer()
    
    try {
      const { resource } = await this.container!.item(id, partitionKeyValue || id).read<T>()
      return resource || null
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
        return null // Item doesn't exist
      }
      console.error('Failed to read item from CosmosDB', { id, partitionKeyValue, error })
      throw error
    }
  }

  // Abstract methods that must be implemented by concrete services
  abstract findAll(): Promise<T[]>
  abstract findById(id: string): Promise<T | null>
  abstract create(data: Omit<T, 'id'>): Promise<T>
  abstract update(id: string, data: Partial<T>): Promise<T>
  abstract delete(id: string): Promise<boolean>
  abstract exists(id: string): Promise<boolean>
}
import { CosmosClient, type Database, type Container, type SqlParameter } from '@azure/cosmos'
import logger from '../utils/logger'

/**
 * Base Service Class that handles both mock data and CosmosDB
 * 
 * This service automatically determines whether to use mock data or CosmosDB
 * based on the APP_ENV environment variable.
 * 
 * Note: Services should only run on the server side. We use process.env directly
 * instead of useRuntimeConfig() because services are instantiated as singletons at
 * module initialization time, before the Nuxt context is available. This is especially
 * important for Azure Static Web Apps where the Nuxt instance may not be available
 * during service initialization.
 * 
 * The process.env variables are made available via Vite's define configuration in
 * nuxt.config.ts to handle cases where service code is accidentally bundled for client.
 */
export abstract class BaseService<T extends { id: string }> {
  protected abstract readonly containerName: string
  protected abstract readonly partitionKey: string
  
  private client?: CosmosClient
  private database?: Database
  private container?: Container
  private isInitialized = false
  private clientInitialized = false

  private initializeCosmosClient(): void {
    if (this.clientInitialized) return
    
    const appEnv = process.env.APP_ENV
    
    // Only initialize CosmosDB client for staging and production environments
    if (appEnv === 'staging' || appEnv === 'production') {
      const connectionString = process.env.COSMODB_PRIMARY_CONNECTION_STRING
      
      if (!connectionString) {
        logger.error('COSMODB_PRIMARY_CONNECTION_STRING environment variable is required for staging/production')
        throw new Error('Missing CosmosDB connection string')
      }

      this.client = new CosmosClient(connectionString)
      this.clientInitialized = true
      logger.info(`Initialized CosmosDB client for environment: ${appEnv}`)
    } else {
      this.clientInitialized = true
      logger.info(`Using mock data for environment: ${appEnv || 'development'}`)
    }
  }

  private async ensureContainer(): Promise<void> {
    if (this.isInitialized) return
    
    // Initialize client if not already done
    this.initializeCosmosClient()
    
    if (!this.client) return

    try {
      const databaseName = process.env.COSMODB_DATABASE || 'unconference-me'
      
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
      logger.info(`Container '${this.containerName}' initialized successfully`)
    } catch (error) {
      logger.error(`Failed to initialize container '${this.containerName}'`, { error })
      throw error
    }
  }

  protected async isUsingCosmosDB(): Promise<boolean> {
    const appEnv = process.env.APP_ENV
    return appEnv === 'staging' || appEnv === 'production'
  }

  protected async executeCosmosQuery<TResult = T>(
    query: string,
    parameters?: SqlParameter[]
  ): Promise<TResult[]> {
    if (!(await this.isUsingCosmosDB()) || !this.client) {
      throw new Error('CosmosDB operations are only available in staging/production environments')
    }

    await this.ensureContainer()
    
    try {
      const { resources } = await this.container!.items.query<TResult>({
        query,
        parameters
      }).fetchAll()
      
      return resources
    } catch (error) {
      logger.error('Failed to execute CosmosDB query', { query, parameters, error })
      throw error
    }
  }

  protected async cosmosUpsert(item: T): Promise<T> {
    if (!(await this.isUsingCosmosDB()) || !this.client) {
      throw new Error('CosmosDB operations are only available in staging/production environments')
    }

    await this.ensureContainer()
    
    try {
      const { resource } = await this.container!.items.upsert(item)
      return resource as unknown as T
    } catch (error) {
      logger.error('Failed to upsert item to CosmosDB', { item, error })
      throw error
    }
  }

  protected async cosmosDelete(id: string, partitionKeyValue?: string): Promise<boolean> {
    if (!(await this.isUsingCosmosDB()) || !this.client) {
      throw new Error('CosmosDB operations are only available in staging/production environments')
    }

    await this.ensureContainer()
    
    try {
      await this.container!.item(id, partitionKeyValue || id).delete()
      return true
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
        return false // Item doesn't exist
      }
      logger.error('Failed to delete item from CosmosDB', { id, partitionKeyValue, error })
      throw error
    }
  }

  protected async cosmosReadById(id: string, partitionKeyValue?: string): Promise<T | null> {
    if (!(await this.isUsingCosmosDB()) || !this.client) {
      throw new Error('CosmosDB operations are only available in staging/production environments')
    }

    await this.ensureContainer()
    
    try {
      const { resource } = await this.container!.item(id, partitionKeyValue || id).read<T>()
      return resource || null
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
        return null // Item doesn't exist
      }
      logger.error('Failed to read item from CosmosDB', { id, partitionKeyValue, error })
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
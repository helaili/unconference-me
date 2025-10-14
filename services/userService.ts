import { BaseService } from './baseService'
import { mockData } from '../tests/helpers/mock-manager'
import type { User } from '../types/user'
import logger from '../utils/logger'
import { PasswordUtils } from '../utils/password'

export class UserService extends BaseService<User> {
  protected readonly containerName = 'users'
  protected readonly partitionKey = '/email'

  async findAll(): Promise<User[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<User>('SELECT * FROM c')
      } else {
        return mockData.getUsers()
      }
    } catch (error) {
      logger.error('Failed to fetch all users', { error })
      throw error
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      if (await this.isUsingCosmosDB()) {
        // For users, we use email as both id and partition key
        return await this.cosmosReadById(id, id)
      } else {
        return mockData.getUserByEmail(id) || null
      }
    } catch (error) {
      logger.error('Failed to fetch user by id', { id, error })
      throw error
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      if (await this.isUsingCosmosDB()) {
        const users = await this.executeCosmosQuery<User>(
          'SELECT * FROM c WHERE c.email = @email',
          [{ name: '@email', value: email }]
        )
        return users.length > 0 ? users[0]! : null
      } else {
        return mockData.getUserByEmail(email) || null
      }
    } catch (error) {
      logger.error('Failed to fetch user by email', { email, error })
      throw error
    }
  }

  async create(userData: Omit<User, 'id'>): Promise<User> {
    try {
      // Hash the password if provided and not already hashed
      let hashedPassword = userData.password
      if (userData.password && !PasswordUtils.isPasswordHashed(userData.password)) {
        hashedPassword = await PasswordUtils.hashPassword(userData.password)
      }

      const user: User = {
        ...userData,
        password: hashedPassword,
        id: userData.email, // Use email as ID for CosmosDB partition key
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (await this.isUsingCosmosDB()) {
        return await this.cosmosUpsert(user)
      } else {
        mockData.addUser(user)
        return user
      }
    } catch (error) {
      logger.error('Failed to create user', { email: userData.email, error })
      throw error
    }
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    try {
      // Hash the password if it's being updated and not already hashed
      let processedUpdates = { ...updates }
      if (updates.password && !PasswordUtils.isPasswordHashed(updates.password)) {
        processedUpdates.password = await PasswordUtils.hashPassword(updates.password)
      }

      if (await this.isUsingCosmosDB()) {
        const existingUser = await this.findById(id)
        if (!existingUser) {
          throw new Error(`User with id ${id} not found`)
        }

        const updatedUser: User = {
          ...existingUser,
          ...processedUpdates,
          id,
          updatedAt: new Date()
        }

        return await this.cosmosUpsert(updatedUser)
      } else {
        const success = mockData.updateUser(id, { ...processedUpdates, updatedAt: new Date() })
        if (!success) {
          throw new Error(`User with id ${id} not found`)
        }
        
        const updatedUser = mockData.getUserByEmail(id)
        if (!updatedUser) {
          throw new Error('Failed to retrieve updated user')
        }
        return updatedUser
      }
    } catch (error) {
      logger.error('Failed to update user', { id, error })
      throw error
    }
  }

  async delete(email: string): Promise<boolean> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.cosmosDelete(email, email)
      } else {
        return mockData.removeUser(email)
      }
    } catch (error) {
      logger.error('Failed to delete user', { email, error })
      throw error
    }
  }

  async exists(email: string): Promise<boolean> {
    try {
      const user = await this.findByEmail(email)
      return user !== null
    } catch (error) {
      logger.error('Failed to check if user exists', { email, error })
      throw error
    }
  }

  async validateCredentials(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByEmail(email)
      if (!user || !user.password) {
        return null
      }

      // Verify the password using bcrypt
      const isPasswordValid = await PasswordUtils.verifyPassword(password, user.password)
      if (isPasswordValid) {
        return user
      }
      
      return null
    } catch (error) {
      logger.error('Failed to validate user credentials', { email, error })
      throw error
    }
  }
}

// Export singleton instance
export const userService = new UserService()
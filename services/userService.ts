import { BaseService } from './baseService'
import { mockData } from '../tests/helpers/mock-manager'
import type { User } from '../types/user'
import logger from '../utils/logger'

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
      const user: User = {
        ...userData,
        id: userData.email // For users, email serves as the id
      }

      if (await this.isUsingCosmosDB()) {
        return await this.cosmosUpsert(user)
      } else {
        // Check if user already exists
        if (mockData.getUserByEmail(user.email)) {
          throw new Error(`User with email ${user.email} already exists`)
        }
        mockData.addUser(user)
        return user
      }
    } catch (error) {
      logger.error('Failed to create user', { userData, error })
      throw error
    }
  }

  async update(email: string, updates: Partial<User>): Promise<User> {
    try {
      if (await this.isUsingCosmosDB()) {
        const existingUser = await this.findByEmail(email)
        if (!existingUser) {
          throw new Error(`User with email ${email} not found`)
        }

        const updatedUser: User = {
          ...existingUser,
          ...updates,
          email, // Ensure email doesn't change
          id: email // Ensure id stays consistent
        }

        return await this.cosmosUpsert(updatedUser)
      } else {
        const success = mockData.updateUser(email, updates)
        if (!success) {
          throw new Error(`User with email ${email} not found`)
        }
        
        const updatedUser = mockData.getUserByEmail(email)
        if (!updatedUser) {
          throw new Error('Failed to retrieve updated user')
        }
        return updatedUser
      }
    } catch (error) {
      logger.error('Failed to update user', { email, updates, error })
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
      if (user && user.password === password) {
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
import { BaseService } from './baseService'
import { getMockDataStoreFromContext } from '../utils/mock-data-context'
import type { User } from '../../types/user'
import { PasswordUtils } from '../utils/password'

export class UserService extends BaseService<User> {
  protected readonly containerName = 'users'
  protected readonly partitionKey = '/email'

  async findAll(): Promise<User[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        // Exclude soft-deleted users
        return await this.executeCosmosQuery<User>('SELECT * FROM c WHERE NOT IS_DEFINED(c.deletedAt)')
      } else {
        return getMockDataStoreFromContext().getUsers().filter(u => !u.deletedAt)
      }
    } catch (error) {
      console.error('Failed to fetch all users', { error })
      throw error
    }
  }

  async findAllIncludingDeleted(): Promise<User[]> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.executeCosmosQuery<User>('SELECT * FROM c')
      } else {
        return getMockDataStoreFromContext().getUsers()
      }
    } catch (error) {
      console.error('Failed to fetch all users including deleted', { error })
      throw error
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      if (await this.isUsingCosmosDB()) {
        // For users, we use email as both id and partition key
        return await this.cosmosReadById(id, id)
      } else {
        return getMockDataStoreFromContext().getUserByEmail(id) || null
      }
    } catch (error) {
      console.error('Failed to fetch user by id', { id, error })
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
        return getMockDataStoreFromContext().getUserByEmail(email) || null
      }
    } catch (error) {
      console.error('Failed to fetch user by email', { email, error })
      throw error
    }
  }

  async create(userData: Omit<User, 'id'>): Promise<User> {
    try {
      // Check if a soft-deleted user exists with this email
      const existingUser = await this.findByEmailIncludingDeleted(userData.email)
      
      if (existingUser && existingUser.deletedAt) {
        // Restore soft-deleted user
        console.log(`Restoring soft-deleted user: ${userData.email}`)
        return await this.update(existingUser.id, {
          ...userData,
          deletedAt: undefined,
          updatedAt: new Date()
        })
      }

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
        getMockDataStoreFromContext().addUser(user)
        return user
      }
    } catch (error) {
      console.error('Failed to create user', { email: userData.email, error })
      throw error
    }
  }

  async findByEmailIncludingDeleted(email: string): Promise<User | null> {
    try {
      if (await this.isUsingCosmosDB()) {
        const users = await this.executeCosmosQuery<User>(
          'SELECT * FROM c WHERE c.email = @email',
          [{ name: '@email', value: email }]
        )
        return users.length > 0 ? users[0]! : null
      } else {
        // Use case-insensitive email lookup for mock data
        return getMockDataStoreFromContext().getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()) || null
      }
    } catch (error) {
      console.error('Failed to fetch user by email including deleted', { email, error })
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
        const success = getMockDataStoreFromContext().updateUser(id, { ...processedUpdates, updatedAt: new Date() })
        if (!success) {
          throw new Error(`User with id ${id} not found`)
        }
        
        const updatedUser = getMockDataStoreFromContext().getUserByEmail(id)
        if (!updatedUser) {
          throw new Error('Failed to retrieve updated user')
        }
        return updatedUser
      }
    } catch (error) {
      console.error('Failed to update user', { id, error })
      throw error
    }
  }

  async delete(email: string): Promise<boolean> {
    try {
      // Soft delete - just mark as deleted
      const user = await this.findById(email)
      if (!user) {
        return false
      }

      await this.update(email, {
        deletedAt: new Date()
      })

      console.log(`User soft-deleted: ${email}`)
      return true
    } catch (error) {
      console.error('Failed to delete user', { email, error })
      throw error
    }
  }

  async hardDelete(email: string): Promise<boolean> {
    try {
      if (await this.isUsingCosmosDB()) {
        return await this.cosmosDelete(email, email)
      } else {
        return getMockDataStoreFromContext().removeUser(email)
      }
    } catch (error) {
      console.error('Failed to hard delete user', { email, error })
      throw error
    }
  }

  async exists(email: string): Promise<boolean> {
    try {
      const user = await this.findByEmail(email)
      return user !== null
    } catch (error) {
      console.error('Failed to check if user exists', { email, error })
      throw error
    }
  }

  async validateCredentials(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByEmailIncludingDeleted(email)
      if (!user || !user.password) {
        return null
      }

      // Check if user is soft-deleted
      if (user.deletedAt) {
        console.warn(`Login attempt for soft-deleted user: ${email}`)
        return null
      }

      // Verify the password using bcrypt
      const isPasswordValid = await PasswordUtils.verifyPassword(password, user.password)
      if (isPasswordValid) {
        return user
      }
      
      return null
    } catch (error) {
      console.error('Failed to validate user credentials', { email, error })
      throw error
    }
  }
}

// Export singleton instance
export const userService = new UserService()
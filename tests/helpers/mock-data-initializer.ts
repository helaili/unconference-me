/**
 * Mock data initialization utility
 * Provides functions to initialize mock data with properly hashed passwords
 */

import { PasswordUtils } from '../../utils/password'
import type { User } from '../../types/user'

export class MockDataInitializer {
  /**
   * Generate default users with hashed passwords
   * This is used to ensure mock data uses secure password hashing
   */
  static async getDefaultUsersWithHashedPasswords(): Promise<User[]> {
    const defaultPassword = 'changeme'
    const hashedPassword = await PasswordUtils.hashPassword(defaultPassword)
    
    return [
      {
        id: 'luke@rebels.com',
        firstname: "Luke",
        lastname: "Skywalker",
        email: "luke@rebels.com",
        password: hashedPassword,
        role: "Admin",
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'darth@empire.com',
        firstname: "Darth",
        lastname: "Vader", 
        email: "darth@empire.com",
        password: hashedPassword,
        role: "Participant",
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ]
  }

  /**
   * Create a user with a hashed password
   * @param userData User data with plain text password
   * @returns User object with hashed password
   */
  static async createUserWithHashedPassword(userData: Omit<User, 'id'> & { password: string }): Promise<User> {
    const hashedPassword = await PasswordUtils.hashPassword(userData.password)
    
    return {
      ...userData,
      id: userData.email,
      password: hashedPassword,
      createdAt: userData.createdAt || new Date(),
      updatedAt: userData.updatedAt || new Date()
    }
  }
}
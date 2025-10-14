import bcrypt from 'bcrypt'
import logger from './logger'

/**
 * Password utility functions for secure password handling
 */
export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12 // Higher value = more secure but slower

  /**
   * Hash a plain text password using bcrypt
   * @param plainPassword - The plain text password to hash
   * @returns Promise resolving to the hashed password
   */
  static async hashPassword(plainPassword: string): Promise<string> {
    try {
      const hashedPassword = await bcrypt.hash(plainPassword, this.SALT_ROUNDS)
      logger.debug('Password hashed successfully')
      return hashedPassword
    } catch (error) {
      logger.error('Failed to hash password', { error })
      throw new Error('Password hashing failed')
    }
  }

  /**
   * Verify a plain text password against a hashed password
   * @param plainPassword - The plain text password to verify
   * @param hashedPassword - The hashed password to verify against
   * @returns Promise resolving to true if passwords match, false otherwise
   */
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword)
      logger.debug('Password verification completed', { isMatch })
      return isMatch
    } catch (error) {
      logger.error('Failed to verify password', { error })
      throw new Error('Password verification failed')
    }
  }

  /**
   * Check if a password is already hashed (starts with bcrypt hash pattern)
   * @param password - The password to check
   * @returns True if the password appears to be already hashed
   */
  static isPasswordHashed(password: string): boolean {
    // bcrypt hashes start with $2a$, $2b$, or $2y$ followed by the cost parameter
    const bcryptPattern = /^\$2[aby]\$\d{2}\$/
    return bcryptPattern.test(password)
  }

  /**
   * Generate a secure random password
   * @param length - The length of the password (default: 16)
   * @returns A randomly generated password
   */
  static generateRandomPassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      password += charset[randomIndex]
    }
    
    return password
  }
}
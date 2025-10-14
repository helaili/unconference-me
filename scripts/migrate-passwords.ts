/**
 * Migration script to hash existing plain text passwords in the database
 * This script should be run once after implementing password hashing
 */

import { userService } from '../services/userService'
import { PasswordUtils } from '../utils/password'
import logger from '../utils/logger'

interface MigrationStats {
  totalUsers: number
  usersWithPasswords: number
  usersHashed: number
  usersSkipped: number
  errors: number
}

export class PasswordMigrationService {
  async migratePasswords(): Promise<MigrationStats> {
    const stats: MigrationStats = {
      totalUsers: 0,
      usersWithPasswords: 0,
      usersHashed: 0,
      usersSkipped: 0,
      errors: 0
    }

    try {
      logger.info('Starting password migration...')
      
      // Get all users
      const users = await userService.findAll()
      stats.totalUsers = users.length
      
      logger.info(`Found ${stats.totalUsers} users to process`)

      for (const user of users) {
        try {
          // Skip users without passwords
          if (!user.password) {
            logger.debug(`Skipping user ${user.email} - no password set`)
            continue
          }

          stats.usersWithPasswords++

          // Check if password is already hashed
          if (PasswordUtils.isPasswordHashed(user.password)) {
            logger.debug(`Skipping user ${user.email} - password already hashed`)
            stats.usersSkipped++
            continue
          }

          // Hash the plain text password
          logger.info(`Hashing password for user: ${user.email}`)
          const hashedPassword = await PasswordUtils.hashPassword(user.password)

          // Update user with hashed password
          await userService.update(user.id, { password: hashedPassword })
          
          stats.usersHashed++
          logger.info(`Successfully hashed password for user: ${user.email}`)

        } catch (error) {
          stats.errors++
          logger.error(`Failed to migrate password for user ${user.email}`, { error })
        }
      }

      logger.info('Password migration completed', stats)
      return stats

    } catch (error) {
      logger.error('Password migration failed', { error })
      throw error
    }
  }

  async validateMigration(): Promise<boolean> {
    try {
      logger.info('Validating password migration...')
      
      const users = await userService.findAll()
      let allValid = true

      for (const user of users) {
        if (user.password) {
          if (!PasswordUtils.isPasswordHashed(user.password)) {
            logger.error(`User ${user.email} still has plain text password!`)
            allValid = false
          }
        }
      }

      if (allValid) {
        logger.info('Password migration validation passed - all passwords are properly hashed')
      } else {
        logger.error('Password migration validation failed - some plain text passwords remain')
      }

      return allValid

    } catch (error) {
      logger.error('Password migration validation failed', { error })
      return false
    }
  }
}

// Function to run the migration
export async function runPasswordMigration(): Promise<void> {
  const migrationService = new PasswordMigrationService()
  
  try {
    const stats = await migrationService.migratePasswords()
    
    console.log('\n=== Password Migration Results ===')
    console.log(`Total users processed: ${stats.totalUsers}`)
    console.log(`Users with passwords: ${stats.usersWithPasswords}`)
    console.log(`Passwords hashed: ${stats.usersHashed}`)
    console.log(`Already hashed (skipped): ${stats.usersSkipped}`)
    console.log(`Errors: ${stats.errors}`)
    
    if (stats.errors === 0) {
      console.log('\n✅ Migration completed successfully!')
      
      // Validate the migration
      const isValid = await migrationService.validateMigration()
      if (isValid) {
        console.log('✅ Migration validation passed!')
      } else {
        console.log('❌ Migration validation failed!')
        process.exit(1)
      }
    } else {
      console.log(`\n⚠️  Migration completed with ${stats.errors} errors. Please check logs.`)
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Export singleton instance
export const passwordMigrationService = new PasswordMigrationService()
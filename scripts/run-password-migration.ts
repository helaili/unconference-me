#!/usr/bin/env tsx

/**
 * Password Migration Runner
 * This script migrates existing plain text passwords to hashed passwords
 * 
 * Usage:
 *   npm run migrate:passwords
 *   or directly: APP_ENV=staging tsx scripts/run-password-migration.ts
 */

import { runPasswordMigration } from './migrate-passwords'
import { fileURLToPath } from 'url'

async function main() {
  console.log('🔐 Starting Password Migration...')
  console.log(`Environment: ${process.env.APP_ENV || 'development'}`)
  console.log('=====================================\n')

  try {
    await runPasswordMigration()
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run if this script is called directly (ES module compatible)
const currentFileUrl = fileURLToPath(import.meta.url)
const isMainModule = process.argv[1] === currentFileUrl

if (isMainModule) {
  main()
}
import { populateStagingDatabase } from './populate-staging-db'
import { populateProductionDatabase } from './populate-production-db'
import { fileURLToPath } from 'url'

/**
 * Unified database population script
 * Usage: 
 *   npm run populate:staging
 *   npm run populate:production
 */

const VALID_ENVIRONMENTS = ['staging', 'production'] as const
type Environment = typeof VALID_ENVIRONMENTS[number]

function getEnvironmentFromArgs(): Environment {
  const env = process.argv[2]?.toLowerCase()
  
  if (!env || !VALID_ENVIRONMENTS.includes(env as Environment)) {
    console.error('Invalid or missing environment argument')
    console.error('Usage: npm run populate:staging OR npm run populate:production')
    console.error('Available environments:', VALID_ENVIRONMENTS.join(', '))
    process.exit(1)
  }
  
  return env as Environment
}

async function runPopulation(): Promise<void> {
  const environment = getEnvironmentFromArgs()
  
  console.info(`Starting ${environment} database population`)
  
  try {
    switch (environment) {
      case 'staging':
        await populateStagingDatabase()
        break
      case 'production':
        await populateProductionDatabase()
        break
      default:
        throw new Error(`Unsupported environment: ${environment}`)
    }
    
    console.info(`${environment} database population completed successfully`)
  } catch (error) {
    console.error(`${environment} database population failed`, { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

const __filename = fileURLToPath(import.meta.url)

// Execute if run directly
if (process.argv[1] === __filename) {
  runPopulation()
    .then(() => {
      console.info('Database population script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Database population script failed', { error })
      process.exit(1)
    })
}

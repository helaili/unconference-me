# Cosmos DB Setup Scripts for Unconference Application

This directory contains scripts to create, initialize, and manage Azure Cosmos DB databases for the unconference application. The scripts support both staging and production environments with proper collection setup based on your data model.

## 📋 Prerequisites

1. **Azure CLI**: Install from [Microsoft Docs](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Azure Account**: Valid Azure subscription with permissions to create resources
3. **Authentication**: Run `az login` before using these scripts

## 🚀 Quick Start

### Complete Setup (Recommended)

For a complete setup of both Cosmos DB and collections in one command:

```bash
# For staging environment
./setup-complete.sh staging

# For production environment with custom settings
./setup-complete.sh production --location "West Europe" --throughput 1000
```

### Step-by-Step Setup

If you prefer to run setup in steps:

```bash
# Step 1: Create Cosmos DB account and database
./create-cosmos-db.sh staging

# Step 2: Initialize collections
./initialize-collections.sh staging
```

## 📁 Script Files

| Script | Purpose |
|--------|---------|
| `config.sh` | Configuration and common functions |
| `create-cosmos-db.sh` | Creates resource group, Cosmos DB account, and database |
| `initialize-collections.sh` | Creates and configures collections |
| `setup-complete.sh` | Complete setup in one command |
| `manage.sh` | Management utilities (status, connection strings, etc.) |

## 🗃️ Database Collections

The scripts create the following collections based on your application's data model:

| Collection | Partition Key | Purpose |
|------------|---------------|---------|
| `users` | `/email` | User accounts and profiles |
| `events` | `/id` | Unconference events |
| `topics` | `/eventId` | Discussion topics for events |
| `participants` | `/eventId` | Event participants and registrations |
| `organizers` | `/eventId` | Event organizers and their permissions |
| `participant-assignments` | `/eventId` | Participant-to-topic assignments |

## ⚙️ Configuration Options

### Environment Variables

You can override default values using environment variables:

```bash
export RESOURCE_GROUP_PREFIX="my-unconference"
export LOCATION="West Europe"
export COSMOS_ACCOUNT_PREFIX="my-cosmos"
export DATABASE_NAME="unconference-db"
```

### Command Line Options

All scripts support these common options:

- `--resource-group`: Override resource group name
- `--location`: Override Azure region
- `--cosmos-account`: Override Cosmos DB account name
- `--database-name`: Override database name
- `--throughput`: Set collection throughput (RU/s)

## 📊 Management Commands

Use the `manage.sh` script for ongoing operations:

```bash
# Check status of all resources
./manage.sh status staging

# Get connection string
./manage.sh connection-string production

# Show metrics and throughput information
./manage.sh metrics staging

# Delete resources (use with extreme caution!)
./manage.sh delete staging --confirm-delete
```

## 🔧 Usage Examples

### Basic Setup

```bash
# Create staging environment with default settings
./setup-complete.sh staging

# Create production environment in Europe with higher throughput
./setup-complete.sh production \
  --location "West Europe" \
  --throughput 1000
```

### Custom Configuration

```bash
# Use custom names and skip resource group creation
./setup-complete.sh staging \
  --resource-group "existing-rg" \
  --cosmos-account "my-custom-cosmos" \
  --database-name "my-db" \
  --skip-rg-creation
```

### Management Operations

```bash
# Check if everything is set up correctly
./manage.sh status production

# Get connection string for app configuration
./manage.sh connection-string staging

# View current throughput settings
./manage.sh metrics production
```

## 🔒 Security Considerations

1. **Connection Strings**: Store connection strings securely in environment variables
2. **Access Control**: Configure appropriate RBAC permissions for the Cosmos DB account
3. **Network Security**: Consider enabling firewall rules and private endpoints for production
4. **Backup**: Set up automatic backups for production databases

## 💰 Cost Optimization

### Throughput Settings

- **Staging**: 400 RU/s per collection (default) - ~$24/month per collection
- **Production**: 1000+ RU/s per collection - Scale based on usage

### Recommendations

1. Start with lower throughput and scale up as needed
2. Use shared throughput at database level for cost savings if collections have similar usage patterns
3. Monitor metrics and adjust throughput based on actual usage
4. Consider serverless tier for development/testing environments

## 🏗️ Data Model Integration

The collections are designed to work with your TypeScript types:

```typescript
// Example: Connecting to Cosmos DB in your Nuxt app
import { CosmosClient } from '@azure/cosmos'

const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING)
const database = client.database('unconference')

// Access collections
const usersContainer = database.container('users')
const eventsContainer = database.container('events')
const topicsContainer = database.container('topics')
// ... etc
```

## 🔍 Sample Data Structure

After running the initialization, check `sample-data-structure.json` for example documents that match your TypeScript interfaces.

## 🆘 Troubleshooting

### Common Issues

1. **Authentication Errors**: Run `az login` and ensure you have proper permissions
2. **Resource Already Exists**: Use `--skip-rg-creation` if resource group exists
3. **Quota Limits**: Check your subscription limits in the Azure portal
4. **Permission Denied**: Ensure your account has Contributor role on the subscription/resource group

### Getting Help

```bash
# Show help for any script
./setup-complete.sh --help
./manage.sh --help
```

### Validation

```bash
# Verify setup completed successfully
./manage.sh status <environment>
```

## 🔄 Next Steps

After running these scripts:

1. **Update Application Configuration**: Add the Cosmos DB connection string to your environment variables
2. **Review Security**: Configure network access rules and RBAC
3. **Set Up Monitoring**: Enable Azure Monitor and alerts
4. **Plan Backup Strategy**: Configure backup policies
5. **Test Connectivity**: Verify your application can connect and perform operations

## 📚 Additional Resources

- [Azure Cosmos DB Documentation](https://docs.microsoft.com/en-us/azure/cosmos-db/)
- [Cosmos DB Best Practices](https://docs.microsoft.com/en-us/azure/cosmos-db/best-practice-guide)
- [Partition Key Selection Guide](https://docs.microsoft.com/en-us/azure/cosmos-db/partitioning-overview)
- [Cosmos DB SDK for Node.js](https://docs.microsoft.com/en-us/azure/cosmos-db/sql/sql-api-sdk-node)
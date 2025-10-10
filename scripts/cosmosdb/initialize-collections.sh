#!/bin/bash

# Cosmos DB Collections Initialization Script
# Creates and configures collections based on the unconference application data model

set -e

# Ensure we're using bash
if [ -z "$BASH_VERSION" ]; then
    echo "This script requires bash. Please run with: bash $0 $@"
    exit 1
fi

# Source configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

# Function to display usage
usage() {
    echo "Usage: $0 <environment> [options]"
    echo ""
    echo "Arguments:"
    echo "  environment         Required. Either 'staging' or 'production'"
    echo ""
    echo "Options:"
    echo "  --resource-group    Override default resource group name"
    echo "  --cosmos-account    Override default Cosmos DB account name"
    echo "  --database-name     Override default database name"
    echo "  --throughput        Set custom throughput for collections (default: 400)"
    echo "  --help              Show this help message"
    echo ""
    echo "Collections that will be created:"
    echo "  - users (partition key: /email)"
    echo "  - events (partition key: /id)"
    echo "  - topics (partition key: /eventId)"
    echo "  - participants (partition key: /eventId)"
    echo "  - organizers (partition key: /eventId)"
    echo "  - participant-assignments (partition key: /eventId)"
    echo ""
    echo "Examples:"
    echo "  $0 staging"
    echo "  $0 production --throughput 1000"
    exit 1
}

# Function to create a collection
create_collection() {
    local account_name=$1
    local rg_name=$2
    local db_name=$3
    local collection_name=$4
    local partition_key=$5
    local throughput=$6
    
    log_info "Creating collection: $collection_name with partition key: $partition_key"
    
    # Check if collection exists
    if az cosmosdb sql container show \
        --account-name "$account_name" \
        --resource-group "$rg_name" \
        --database-name "$db_name" \
        --name "$collection_name" &> /dev/null; then
        log_warning "Collection $collection_name already exists. Skipping creation."
        return 0
    fi
    
    # Create collection with partition key and throughput
    az cosmosdb sql container create \
        --account-name "$account_name" \
        --resource-group "$rg_name" \
        --database-name "$db_name" \
        --name "$collection_name" \
        --partition-key-path "/$partition_key" \
        --throughput "$throughput" \
        --output table
    
    log_success "Collection $collection_name created successfully"
}

# Function to create unique key policies for specific collections
create_unique_key_policy() {
    local account_name=$1
    local rg_name=$2
    local db_name=$3
    local collection_name=$4
    
    case $collection_name in
        "users")
            log_info "Setting unique key policy for users collection (email uniqueness)"
            # Note: Unique key policies must be set during container creation
            # This is handled in the create_collection_with_unique_keys function
            ;;
        "events")
            log_info "Events collection uses id as partition key (naturally unique)"
            ;;
        *)
            log_info "No unique key policy needed for $collection_name"
            ;;
    esac
}

# Function to create collection with unique key constraints
create_collection_with_unique_keys() {
    local account_name=$1
    local rg_name=$2
    local db_name=$3
    local collection_name=$4
    local partition_key=$5
    local throughput=$6
    
    log_info "Creating collection with unique keys: $collection_name"
    
    # Check if collection exists
    if az cosmosdb sql container show \
        --account_name "$account_name" \
        --resource-group "$rg_name" \
        --database-name "$db_name" \
        --name "$collection_name" &> /dev/null; then
        log_warning "Collection $collection_name already exists. Skipping creation."
        return 0
    fi
    
    case $collection_name in
        "users")
            # Users collection with email uniqueness constraint
            # Fixed JSON structure for unique key policy
            az cosmosdb sql container create \
                --account-name "$account_name" \
                --resource-group "$rg_name" \
                --database-name "$db_name" \
                --name "$collection_name" \
                --partition-key-path "/$partition_key" \
                --throughput "$throughput" \
                --unique-key-policy '{"uniqueKeys": [{"paths": ["/email"]}]}' \
                --output table
            ;;
        *)
            # Default collection creation
            create_collection "$account_name" "$rg_name" "$db_name" "$collection_name" "$partition_key" "$throughput"
            return
            ;;
    esac
    
    log_success "Collection $collection_name with unique keys created successfully"
}

# Function to set up indexing policies
setup_indexing_policies() {
    local account_name=$1
    local rg_name=$2
    local db_name=$3
    
    log_info "Setting up optimized indexing policies for collections"
    
    # Note: Indexing policies are best set during container creation
    # For existing containers, you would need to update them
    # This function serves as documentation for future indexing optimizations
    
    log_info "Indexing policies:"
    log_info "  - users: Index on email, firstname, lastname, role"
    log_info "  - events: Index on status, startDate, endDate, createdAt"
    log_info "  - topics: Index on eventId, status, proposedBy, createdAt"
    log_info "  - participants: Index on eventId, status, email, registrationDate"
    log_info "  - organizers: Index on eventId, role, status, email"
    log_info "  - participant-assignments: Index on eventId, participantId, topicId, roundNumber"
    
    log_success "Indexing policies documented (implement during container creation for new containers)"
}

# Function to initialize sample data structure documentation
create_sample_data_docs() {
    local db_name=$1
    
    log_info "Creating sample data structure documentation"
    
    cat > "$SCRIPT_DIR/sample-data-structure.json" << 'EOF'
{
  "users": {
    "sample": {
      "id": "user-uuid-123",
      "email": "john.doe@example.com",
      "firstname": "John",
      "lastname": "Doe",
      "role": "User",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  },
  "events": {
    "sample": {
      "id": "event-uuid-123",
      "name": "Tech Unconference 2025",
      "description": "Annual technology unconference",
      "location": "San Francisco, CA",
      "startDate": "2025-06-01T09:00:00Z",
      "endDate": "2025-06-01T17:00:00Z",
      "numberOfRounds": 3,
      "discussionsPerRound": 5,
      "idealGroupSize": 8,
      "minGroupSize": 5,
      "maxGroupSize": 12,
      "status": "draft",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "settings": {
        "enableTopicRanking": true,
        "enableAutoAssignment": false,
        "maxTopicsPerParticipant": 3,
        "requireApproval": false,
        "maxParticipants": 100
      }
    }
  },
  "topics": {
    "sample": {
      "id": "topic-uuid-123",
      "eventId": "event-uuid-123",
      "title": "AI in Web Development",
      "description": "Discussing the impact of AI tools on modern web development",
      "proposedBy": "participant-uuid-123",
      "status": "proposed",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "metadata": {
        "interestCount": 15,
        "tags": ["AI", "Web Development", "Tools"]
      }
    }
  },
  "participants": {
    "sample": {
      "id": "participant-uuid-123",
      "eventId": "event-uuid-123",
      "userId": "user-uuid-123",
      "email": "jane.smith@example.com",
      "firstname": "Jane",
      "lastname": "Smith",
      "status": "registered",
      "registrationDate": "2025-01-01T00:00:00Z",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "preferences": {
        "topicRankings": {
          "topic-uuid-123": 1,
          "topic-uuid-456": 2
        }
      }
    }
  },
  "organizers": {
    "sample": {
      "id": "organizer-uuid-123",
      "eventId": "event-uuid-123",
      "userId": "user-uuid-456",
      "email": "admin@example.com",
      "firstname": "Admin",
      "lastname": "User",
      "role": "owner",
      "status": "active",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "permissions": {
        "canEditEvent": true,
        "canDeleteEvent": true,
        "canApproveParticipants": true,
        "canApproveTopics": true,
        "canScheduleTopics": true,
        "canManageAssignments": true,
        "canRunAutoAssignment": true,
        "canViewReports": true,
        "canExportData": true
      }
    }
  },
  "participant-assignments": {
    "sample": {
      "id": "assignment-uuid-123",
      "participantId": "participant-uuid-123",
      "topicId": "topic-uuid-123",
      "eventId": "event-uuid-123",
      "roundNumber": 1,
      "groupNumber": 1,
      "assignmentMethod": "manual",
      "status": "assigned",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  }
}
EOF

    log_success "Sample data structure documentation created: $SCRIPT_DIR/sample-data-structure.json"
}

# Parse command line arguments
ENVIRONMENT=""
THROUGHPUT=$DEFAULT_THROUGHPUT

while [[ $# -gt 0 ]]; do
    case $1 in
        staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        --resource-group)
            RESOURCE_GROUP_PREFIX="$2"
            shift 2
            ;;
        --cosmos-account)
            COSMOS_ACCOUNT_PREFIX="$2"
            shift 2
            ;;
        --database-name)
            DATABASE_NAME="$2"
            shift 2
            ;;
        --throughput)
            THROUGHPUT="$2"
            shift 2
            ;;
        --help|-h)
            usage
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate inputs
if [[ -z "$ENVIRONMENT" ]]; then
    log_error "Environment argument is required"
    usage
fi

validate_parameters "$ENVIRONMENT"
validate_azure_cli

# Get resource names
get_resource_names "$ENVIRONMENT"

log_info "Starting collections initialization for $ENVIRONMENT environment"
log_info "Resource Group: $RESOURCE_GROUP"
log_info "Cosmos Account: $COSMOS_ACCOUNT"
log_info "Database: $DATABASE_NAME"
log_info "Throughput per collection: $THROUGHPUT RU/s"

# Verify Cosmos DB account exists
if ! check_cosmos_account_exists "$COSMOS_ACCOUNT" "$RESOURCE_GROUP"; then
    log_error "Cosmos DB account $COSMOS_ACCOUNT does not exist in resource group $RESOURCE_GROUP"
    log_error "Please run create-cosmos-db.sh first"
    exit 1
fi

# Verify database exists
if ! az cosmosdb sql database show \
    --account-name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DATABASE_NAME" &> /dev/null; then
    log_error "Database $DATABASE_NAME does not exist in account $COSMOS_ACCOUNT"
    log_error "Please run create-cosmos-db.sh first"
    exit 1
fi

log_info "Creating collections..."

# Create collections with appropriate partition keys
for collection in $(get_collection_names); do
    partition_key=$(get_partition_key "$collection")
    
    if [[ "$collection" == "users" ]]; then
        # Users collection needs unique key policy
        create_collection_with_unique_keys "$COSMOS_ACCOUNT" "$RESOURCE_GROUP" "$DATABASE_NAME" "$collection" "$partition_key" "$THROUGHPUT"
    else
        # Standard collection creation
        create_collection "$COSMOS_ACCOUNT" "$RESOURCE_GROUP" "$DATABASE_NAME" "$collection" "$partition_key" "$THROUGHPUT"
    fi
done

# Set up indexing policies documentation
setup_indexing_policies "$COSMOS_ACCOUNT" "$RESOURCE_GROUP" "$DATABASE_NAME"

# Create sample data structure documentation
create_sample_data_docs "$DATABASE_NAME"

log_success "Collections initialization completed successfully for $ENVIRONMENT environment!"
log_info "Collections created:"
for collection in $(get_collection_names); do
    partition_key=$(get_partition_key "$collection")
    log_info "  - $collection (partition key: /$partition_key)"
done

log_info ""
log_info "Next steps:"
log_info "1. Review the sample data structure in: $SCRIPT_DIR/sample-data-structure.json"
log_info "2. Update your application configuration with the Cosmos DB connection details"
log_info "3. Consider implementing the documented indexing policies for better performance"
#!/bin/bash

# Configuration file for Cosmos DB setup
# This file contains common configuration variables used by the setup scripts

# Ensure we're using bash for associative array support
if [ -z "$BASH_VERSION" ]; then
    echo "This script requires bash. Please run with: bash $0"
    exit 1
fi

# Default values - override these with environment variables or command line arguments
RESOURCE_GROUP=${AZURE_RESOURCE_GROUP:-"unconference-me"}
LOCATION=${LOCATION:-"Sweden Central"}
COSMOS_ACCOUNT_PREFIX=${COSMOS_ACCOUNT_PREFIX:-"unconference-me"}
DATABASE_NAME=${DATABASE_NAME:-"unconference-me"}

# Cosmos DB Configuration
COSMOS_DB_KIND="GlobalDocumentDB"
COSMOS_DB_API_KIND="Sql"
COSMOS_DB_CONSISTENCY_LEVEL="Session"

# Collections configuration (collection_name:partition_key pairs)
# Format: "collection_name partition_key"
COLLECTIONS="
users email
events id
topics eventId
participants eventId
organizers eventId
participant-assignments eventId
"

# Function to get partition key for a collection
get_partition_key() {
    local collection_name=$1
    echo "$COLLECTIONS" | grep "^$collection_name " | awk '{print $2}'
}

# Function to get all collection names
get_collection_names() {
    echo "$COLLECTIONS" | grep -v "^$" | awk '{print $1}'
}

# Throughput settings
DEFAULT_THROUGHPUT=400
HIGH_THROUGHPUT=1000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validation functions
validate_azure_cli() {
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        return 1
    fi
    
    if ! az account show &> /dev/null; then
        log_error "Not logged into Azure. Please run 'az login' first."
        return 1
    fi
    
    return 0
}

validate_parameters() {
    local env=$1
    
    if [[ "$env" != "staging" && "$env" != "production" ]]; then
        log_error "Invalid environment. Must be 'staging' or 'production'"
        return 1
    fi
    
    return 0
}

# Helper functions
get_resource_names() {
    local env=$1
    
    RESOURCE_GROUP="${RESOURCE_GROUP}"
    COSMOS_ACCOUNT="${COSMOS_ACCOUNT_PREFIX}-${env}"
    
    export RESOURCE_GROUP
    export COSMOS_ACCOUNT
}

check_resource_group_exists() {
    local rg_name=$1
    az group show --name "$rg_name" &> /dev/null
}

check_cosmos_account_exists() {
    local account_name=$1
    local rg_name=$2
    az cosmosdb show --name "$account_name" --resource-group "$rg_name" &> /dev/null
}
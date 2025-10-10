#!/bin/bash

# Complete Cosmos DB Setup Script
# Combines database creation and collection initialization in a single script

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
    echo "This script performs the complete setup:"
    echo "  1. Creates resource group (if needed)"
    echo "  2. Creates Cosmos DB account"
    echo "  3. Creates database"
    echo "  4. Creates and configures all collections"
    echo ""
    echo "Arguments:"
    echo "  environment         Required. Either 'staging' or 'production'"
    echo ""
    echo "Options:"
    echo "  --resource-group    Override default resource group name"
    echo "  --location          Override default location (default: East US)"
    echo "  --cosmos-account    Override default Cosmos DB account name"
    echo "  --database-name     Override default database name"
    echo "  --throughput        Set custom throughput for collections (default: 400)"
    echo "  --skip-rg-creation  Skip resource group creation if it already exists"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 staging"
    echo "  $0 production --location 'West Europe' --throughput 1000"
    exit 1
}

# Parse command line arguments
ENVIRONMENT=""
SKIP_RG_CREATION="false"
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
        --location)
            LOCATION="$2"
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
        --skip-rg-creation)
            SKIP_RG_CREATION="true"
            shift
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

log_info "=========================================="
log_info "  COSMOS DB COMPLETE SETUP - $ENVIRONMENT"
log_info "=========================================="

# Step 1: Create Cosmos DB (resource group, account, database)
log_info ""
log_info "Step 1: Creating Cosmos DB infrastructure..."
"$SCRIPT_DIR/create-cosmos-db.sh" "$ENVIRONMENT" \
    --resource-group "$RESOURCE_GROUP_PREFIX" \
    --location "$LOCATION" \
    --cosmos-account "$COSMOS_ACCOUNT_PREFIX" \
    $([ "$SKIP_RG_CREATION" == "true" ] && echo "--skip-rg-creation")

# Step 2: Initialize collections
log_info ""
log_info "Step 2: Initializing collections..."
"$SCRIPT_DIR/initialize-collections.sh" "$ENVIRONMENT" \
    --resource-group "$RESOURCE_GROUP_PREFIX" \
    --cosmos-account "$COSMOS_ACCOUNT_PREFIX" \
    --database-name "$DATABASE_NAME" \
    --throughput "$THROUGHPUT"

# Step 3: Display connection information
get_resource_names "$ENVIRONMENT"

log_info ""
log_info "=========================================="
log_info "  SETUP COMPLETE!"
log_info "=========================================="

log_success "Cosmos DB setup completed successfully for $ENVIRONMENT environment!"

log_info ""
log_info "Connection Details:"
log_info "  Resource Group: $RESOURCE_GROUP"
log_info "  Cosmos DB Account: $COSMOS_ACCOUNT"
log_info "  Database: $DATABASE_NAME"
log_info "  Location: $LOCATION"

log_info ""
log_info "Collections Created:"
for collection in $(get_collection_names); do
    partition_key=$(get_partition_key "$collection")
    log_info "  ✓ $collection (partition key: /$partition_key, throughput: $THROUGHPUT RU/s)"
done

log_info ""
log_info "Next Steps:"
log_info "1. Get connection string:"
log_info "   az cosmosdb keys list --name $COSMOS_ACCOUNT --resource-group $RESOURCE_GROUP --type connection-strings"
log_info ""
log_info "2. Update your application configuration with:"
log_info "   - Connection string from step 1"
log_info "   - Database name: $DATABASE_NAME"
log_info ""
log_info "3. Review sample data structure:"
log_info "   cat $SCRIPT_DIR/sample-data-structure.json"

# Offer to retrieve connection string
echo ""
read -p "Would you like to retrieve the connection string now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Retrieving connection string..."
    echo ""
    az cosmosdb keys list \
        --name "$COSMOS_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --type connection-strings \
        --output table
    
    echo ""
    log_warning "Keep your connection string secure and store it in your application's environment variables!"
fi
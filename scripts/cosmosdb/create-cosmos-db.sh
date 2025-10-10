#!/bin/bash

# Cosmos DB Setup Script for Unconference Application
# Creates Cosmos DB accounts and databases for staging and production environments

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
    echo "  environment    Required. Either 'staging' or 'production'"
    echo ""
    echo "Options:"
    echo "  --resource-group    Override default resource group name"
    echo "  --location          Override default location (default: East US)"
    echo "  --cosmos-account    Override default Cosmos DB account name"
    echo "  --skip-rg-creation  Skip resource group creation if it already exists"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 staging"
    echo "  $0 production --location 'West Europe'"
    echo "  $0 staging --resource-group 'my-unconference-staging' --skip-rg-creation"
    exit 1
}

# Function to create resource group
create_resource_group() {
    local rg_name=$1
    local location=$2
    
    log_info "Creating resource group: $rg_name"
    
    if check_resource_group_exists "$rg_name"; then
        if [[ "$SKIP_RG_CREATION" == "true" ]]; then
            log_warning "Resource group $rg_name already exists. Skipping creation."
            return 0
        else
            log_warning "Resource group $rg_name already exists. Continuing with existing group."
            return 0
        fi
    fi
    
    az group create \
        --name "$rg_name" \
        --location "$location" \
        --output table
    
    log_success "Resource group created successfully"
}

# Function to create Cosmos DB account
create_cosmos_account() {
    local account_name=$1
    local rg_name=$2
    local location=$3
    
    log_info "Creating Cosmos DB account: $account_name"
    
    if check_cosmos_account_exists "$account_name" "$rg_name"; then
        log_warning "Cosmos DB account $account_name already exists. Skipping creation."
        return 0
    fi
    
    az cosmosdb create \
        --name "$account_name" \
        --resource-group "$rg_name" \
        --kind "$COSMOS_DB_KIND" \
        --default-consistency-level "$COSMOS_DB_CONSISTENCY_LEVEL" \
        --locations regionName="$location" failoverPriority=0 isZoneRedundant=False \
        --enable-automatic-failover false \
        --output table
    
    log_success "Cosmos DB account created successfully"
}

# Function to create database
create_database() {
    local account_name=$1
    local rg_name=$2
    local db_name=$3
    
    log_info "Creating database: $db_name"
    
    # Check if database exists
    if az cosmosdb sql database show \
        --account-name "$account_name" \
        --resource-group "$rg_name" \
        --name "$db_name" &> /dev/null; then
        log_warning "Database $db_name already exists. Skipping creation."
        return 0
    fi
    
    az cosmosdb sql database create \
        --account-name "$account_name" \
        --resource-group "$rg_name" \
        --name "$db_name" \
        --output table
    
    log_success "Database created successfully"
}

# Parse command line arguments
ENVIRONMENT=""
SKIP_RG_CREATION="false"

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

# Get resource names
get_resource_names "$ENVIRONMENT"

log_info "Starting Cosmos DB setup for $ENVIRONMENT environment"
log_info "Resource Group: $RESOURCE_GROUP"
log_info "Cosmos Account: $COSMOS_ACCOUNT"
log_info "Database: $DATABASE_NAME"
log_info "Location: $LOCATION"

# Create resources
create_resource_group "$RESOURCE_GROUP" "$LOCATION"
create_cosmos_account "$COSMOS_ACCOUNT" "$RESOURCE_GROUP" "$LOCATION"
create_database "$COSMOS_ACCOUNT" "$RESOURCE_GROUP" "$DATABASE_NAME"

log_success "Cosmos DB setup completed successfully for $ENVIRONMENT environment!"
log_info "Next step: Run the initialize script to create collections"
log_info "Command: ./initialize-collections.sh $ENVIRONMENT"
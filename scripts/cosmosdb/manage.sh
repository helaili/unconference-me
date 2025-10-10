#!/bin/bash

# Cosmos DB Management Utilities
# Additional utility functions for managing the Cosmos DB setup

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
    echo "Usage: $0 <command> <environment> [options]"
    echo ""
    echo "Commands:"
    echo "  status              Show status of Cosmos DB resources"
    echo "  connection-string   Get connection string for the database"
    echo "  delete              Delete Cosmos DB resources (use with caution!)"
    echo "  backup              Create a backup export (requires Azure Storage account)"
    echo "  metrics             Show basic metrics for the database"
    echo ""
    echo "Arguments:"
    echo "  environment         Required. Either 'staging' or 'production'"
    echo ""
    echo "Options:"
    echo "  --resource-group    Override default resource group name"
    echo "  --cosmos-account    Override default Cosmos DB account name"
    echo "  --confirm-delete    Required for delete operations"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 status staging"
    echo "  $0 connection-string production"
    echo "  $0 delete staging --confirm-delete"
    exit 1
}

# Function to show status
show_status() {
    local account_name=$1
    local rg_name=$2
    local db_name=$3
    
    log_info "Cosmos DB Status for $ENVIRONMENT environment"
    echo ""
    
    # Check account status
    if check_cosmos_account_exists "$account_name" "$rg_name"; then
        log_success "✓ Cosmos DB Account: $account_name (exists)"
        
        # Get account details
        az cosmosdb show \
            --name "$account_name" \
            --resource-group "$rg_name" \
            --query '{name:name,location:location,provisioningState:provisioningState,documentEndpoint:documentEndpoint}' \
            --output table
    else
        log_error "✗ Cosmos DB Account: $account_name (not found)"
        return 1
    fi
    
    echo ""
    
    # Check database status
    if az cosmosdb sql database show \
        --account-name "$account_name" \
        --resource-group "$rg_name" \
        --name "$db_name" &> /dev/null; then
        log_success "✓ Database: $db_name (exists)"
    else
        log_error "✗ Database: $db_name (not found)"
        return 1
    fi
    
    echo ""
    log_info "Collections Status:"
    
    # Check each collection
    for collection in $(get_collection_names); do
        if az cosmosdb sql container show \
            --account-name "$account_name" \
            --resource-group "$rg_name" \
            --database-name "$db_name" \
            --name "$collection" &> /dev/null; then
            
            # Get collection details
            local throughput
            throughput=$(az cosmosdb sql container throughput show \
                --account-name "$account_name" \
                --resource-group "$rg_name" \
                --database-name "$db_name" \
                --name "$collection" \
                --query 'resource.throughput' \
                --output tsv 2>/dev/null || echo "Shared")
            
            partition_key=$(get_partition_key "$collection")
            log_success "  ✓ $collection (partition: /$partition_key, throughput: $throughput RU/s)"
        else
            log_error "  ✗ $collection (not found)"
        fi
    done
}

# Function to get connection string
get_connection_string() {
    local account_name=$1
    local rg_name=$2
    
    log_info "Retrieving connection string for $account_name..."
    echo ""
    
    az cosmosdb keys list \
        --name "$account_name" \
        --resource-group "$rg_name" \
        --type connection-strings \
        --output table
    
    echo ""
    log_warning "Store the connection string securely in your application's environment variables!"
    log_info "Example environment variable:"
    echo "COSMOS_DB_CONNECTION_STRING=\"<Primary SQL Connection String from above>\""
}

# Function to show metrics
show_metrics() {
    local account_name=$1
    local rg_name=$2
    local db_name=$3
    
    log_info "Basic metrics for $account_name"
    echo ""
    
    # Show account information
    az cosmosdb show \
        --name "$account_name" \
        --resource-group "$rg_name" \
        --query '{
            name: name,
            location: location,
            kind: kind,
            consistencyLevel: consistencyPolicy.defaultConsistencyLevel,
            enableAutomaticFailover: enableAutomaticFailover,
            enableMultipleWriteLocations: enableMultipleWriteLocations
        }' \
        --output table
    
    echo ""
    log_info "Collection Details:"
    
    # Show throughput for each collection
    for collection in $(get_collection_names); do
        local throughput
        throughput=$(az cosmosdb sql container throughput show \
            --account-name "$account_name" \
            --resource-group "$rg_name" \
            --database-name "$db_name" \
            --name "$collection" \
            --query 'resource.throughput' \
            --output tsv 2>/dev/null || echo "Shared")
        
        echo "  $collection: $throughput RU/s"
    done
}

# Function to delete resources
delete_resources() {
    local account_name=$1
    local rg_name=$2
    local confirm=$3
    
    if [[ "$confirm" != "true" ]]; then
        log_error "Delete operation requires --confirm-delete flag"
        log_error "This will permanently delete all data in $account_name!"
        return 1
    fi
    
    log_warning "This will permanently delete Cosmos DB account: $account_name"
    log_warning "All data will be lost and cannot be recovered!"
    echo ""
    read -p "Are you absolutely sure? Type 'DELETE' to confirm: " confirmation
    
    if [[ "$confirmation" != "DELETE" ]]; then
        log_info "Operation cancelled"
        return 0
    fi
    
    log_info "Deleting Cosmos DB account: $account_name"
    
    az cosmosdb delete \
        --name "$account_name" \
        --resource-group "$rg_name" \
        --yes \
        --output table
    
    log_success "Cosmos DB account deleted successfully"
    log_warning "Resource group $rg_name still exists. Delete it manually if no longer needed."
}

# Parse command line arguments
COMMAND=""
ENVIRONMENT=""
CONFIRM_DELETE="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        status|connection-string|delete|backup|metrics)
            COMMAND="$1"
            shift
            ;;
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
        --confirm-delete)
            CONFIRM_DELETE="true"
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
if [[ -z "$COMMAND" || -z "$ENVIRONMENT" ]]; then
    log_error "Both command and environment are required"
    usage
fi

validate_parameters "$ENVIRONMENT"
validate_azure_cli

# Get resource names
get_resource_names "$ENVIRONMENT"

# Execute command
case $COMMAND in
    status)
        show_status "$COSMOS_ACCOUNT" "$RESOURCE_GROUP" "$DATABASE_NAME"
        ;;
    connection-string)
        get_connection_string "$COSMOS_ACCOUNT" "$RESOURCE_GROUP"
        ;;
    delete)
        delete_resources "$COSMOS_ACCOUNT" "$RESOURCE_GROUP" "$CONFIRM_DELETE"
        ;;
    metrics)
        show_metrics "$COSMOS_ACCOUNT" "$RESOURCE_GROUP" "$DATABASE_NAME"
        ;;
    backup)
        log_error "Backup functionality not implemented yet"
        log_info "Consider using Azure Backup or export functionality manually"
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        usage
        ;;
esac
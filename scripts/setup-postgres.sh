#!/bin/bash

# PostgreSQL Container Setup Script with Podman
# This script creates and runs a PostgreSQL container with persistent volume

set -e  # Exit on any error

# Configuration variables
CONTAINER_NAME="chat-postgres"
POSTGRES_VERSION="15"
POSTGRES_DB="chatdb"
POSTGRES_USER="chatuser"
POSTGRES_PASSWORD="chatpass"
POSTGRES_PORT="5432"
VOLUME_NAME="postgres-data"

echo "Setting up PostgreSQL container with Podman..."

# Check if Podman is installed
if ! command -v podman &> /dev/null; then
    echo "Error: Podman is not installed. Please install Podman first."
    exit 1
fi

# Stop and remove existing container if it exists
if podman ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "Stopping existing container: ${CONTAINER_NAME}"
    podman stop ${CONTAINER_NAME} || true
    echo "Removing existing container: ${CONTAINER_NAME}"
    podman rm ${CONTAINER_NAME} || true
fi

# Create named volume for persistent data storage
echo "Creating persistent volume: ${VOLUME_NAME}"
podman volume create ${VOLUME_NAME} || echo "Volume ${VOLUME_NAME} already exists"

# Run PostgreSQL container with persistent volume
echo "Starting PostgreSQL container..."
podman run -d \
    --name ${CONTAINER_NAME} \
    --restart unless-stopped \
    -e POSTGRES_DB=${POSTGRES_DB} \
    -e POSTGRES_USER=${POSTGRES_USER} \
    -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
    -p ${POSTGRES_PORT}:5432 \
    -v ${VOLUME_NAME}:/var/lib/postgresql/data \
    postgres:${POSTGRES_VERSION}

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Test connection
echo "Testing database connection..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if podman exec ${CONTAINER_NAME} pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; then
        echo "PostgreSQL is ready!"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo "Error: PostgreSQL failed to start after ${max_attempts} attempts"
        exit 1
    fi
    
    echo "Attempt ${attempt}/${max_attempts}: Waiting for PostgreSQL..."
    sleep 2
    ((attempt++))
done

# Display connection information
echo ""
echo "PostgreSQL container setup complete!"
echo "=================================="
echo "Container Name: ${CONTAINER_NAME}"
echo "Database: ${POSTGRES_DB}"
echo "Username: ${POSTGRES_USER}"
echo "Password: ${POSTGRES_PASSWORD}"
echo "Port: ${POSTGRES_PORT}"
echo "Volume: ${VOLUME_NAME}"
echo ""
echo "Connection string: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
echo ""
echo "To connect to the database:"
echo "podman exec -it ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}"
echo ""
echo "To stop the container:"
echo "podman stop ${CONTAINER_NAME}"
echo ""
echo "To start the container:"
echo "podman start ${CONTAINER_NAME}"
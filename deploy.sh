#!/bin/bash

# Usage: ./deploy.sh [target_host] [target_dir]
# Example: ./deploy.sh nas-dry /srv/www/backblaze-b2/

TARGET_HOST="${1:-nas-dry}"                 # Default to 'nas-dry' if not provided
TARGET_DIR="${2:-/tank_scratch/scratch/dev/backblaze-b2/}"   # Default dir if not provided
USER="${LOCAL_NAS_DEPLOY_USER:-$(whoami)}"            # Use DEPLOY_USER env var or your current user

echo "Deploying to ${USER}@${TARGET_HOST}:${TARGET_DIR}"

# Rsync code, excluding node_modules, .git, etc.
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.env' \
  ./ "${USER}@${TARGET_HOST}:${TARGET_DIR}"

# Optional: SSH into NAS and run install/build
ssh "${USER}@${TARGET_HOST}" "cd ${TARGET_DIR} && make && sudo make install"

echo "Deployment complete."
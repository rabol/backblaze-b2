#!/bin/bash

set -euo pipefail

KEY_ID=$1
APP_KEY=$2
BUCKET=$3
FOLDER=$4

# Authorize account using updated syntax, suppress output
if ! b2 account authorize "$KEY_ID" "$APP_KEY" >/dev/null 2>&1; then
    echo "ERROR: Failed to authorize with Backblaze B2. Check your Key ID and App Key."
    exit 1
fi

# Sync folder using correct --skip-newer flag, suppress output
if ! b2 sync --delete --skip-newer "$FOLDER" "b2://$BUCKET/$(hostname)" >/dev/null 2>&1; then
    echo "ERROR: Sync failed. Check folder path, bucket name, and B2 credentials."
    exit 1
fi

echo "SUCCESS: Backup completed successfully."
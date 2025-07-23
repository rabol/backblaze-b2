# Cockpit Backblaze B2

This is a simple Backblaze B2 backup module for [Cockpit](https://cockpit-project.org).

It uses [Cockpit Starter Kit](https://github.com/cockpit-project/starter-kit) as a base

## Downloading the Module

Clone this repository to your system:

```sh
git clone https://github.com/rabol/backblaze-b2.git
cd backblaze-b2
```

## Development Dependencies

### On Debian/Ubuntu:

```sh
sudo apt install gettext nodejs npm make pipx
pipx ensurepath
```

### On Fedora:

```sh
sudo dnf install gettext nodejs npm make pipx
pipx ensurepath
```

> You **must restart your shell** or run `source ~/.bashrc` after installing `pipx`.

## Installing the Backblaze B2 CLI

This module depends on the official Backblaze B2 CLI.

Install it globally using `pipx`:

```sh
pipx install b2
```

Verify it is available system-wide:

```sh
which b2
# Should return: /usr/local/bin/b2
```

## Building the Module

To build the Cockpit module:

```sh
make
```

## Installing the Module

To install the module system-wide:

```sh
sudo make install
```

This will install the frontend assets to:

```
/usr/local/share/cockpit/backblaze-b2
```

And metadata to:

```
/usr/local/share/metainfo/org.cockpit_project.backblaze_b2.metainfo.xml
```

To remove a previously installed development version:

```sh
rm ~/.local/share/cockpit/backblaze-b2
```

## Installing the Sync Script

Copy the `sync.sh` script to a system location:

```sh
sudo mkdir -p /usr/libexec/backblaze-b2
sudo cp sync.sh /usr/libexec/backblaze-b2/sync.sh
sudo chmod +x /usr/libexec/backblaze-b2/sync.sh
```

Ensure it’s executable and accessible by the Cockpit backend.

## Example sync.sh

```bash
#!/bin/bash
set -euo pipefail

KEY_ID="$1"
APP_KEY="$2"
BUCKET="$3"
LOCAL_FOLDER="$4"

if [[ -z "$KEY_ID" || -z "$APP_KEY" || -z "$BUCKET" || -z "$LOCAL_FOLDER" ]]; then
    echo "Error: Missing required arguments." >&2
    exit 1
fi

# Use a temporary file for B2's credentials (so it's not saved globally)
export B2_ACCOUNT_INFO="$(mktemp)"

# Clean up on exit
trap 'rm -f "$B2_ACCOUNT_INFO"' EXIT

# Authorize using passed credentials
b2 authorize-account "$KEY_ID" "$APP_KEY"

# Now sync the folder to the bucket
b2 sync "$LOCAL_FOLDER" "b2://$BUCKET"

echo "Backup completed successfully."
```
# Cockpit Backblaze B2

This is a simple Backblaze B2 backup module for [Cockpit](https://cockpit-project.org).

It uses [Cockpit Starter Kit](https://github.com/cockpit-project/starter-kit) as a base


### Features
	Create, edit, and delete B2 backup jobs via the Cockpit web UI
	Save job definitions in /etc/cockpit-backblaze-b2/jobs.json
	Run jobs manually or on a schedule using cron
	No encryption: app key and ID are stored in plaintext in jobs.json.
(Server security is assumed. Restrict file permissions accordingly.)

### Jobs

Jobs created with this app is stored in ```/etc/cockpit-backblaze-b2/jobs.json``` and the format is:

(values below is completely random)
```json
[
  {
    "jobName": "nightly-home",
    "keyId": "0038d8ace473683wq268643",
    "appKey": "K003KldOw14BUxPCZpqfdsaffdfasfdsffsff",
    "bucket": "my-super-nas",
    "folder": "/tank_hdd/shared"
  }
]
```

#### Permissions
```bash
sudo mkdir /etc/cockpit-backblaze-b2
sudo touch /etc/cockpit-backblaze-b2/jobs.json
sudo chmod 600 /etc/cockpit-backblaze-b2/jobs.json
sudo chown root:root /etc/cockpit-backblaze-b2/jobs.json
```

### Scheduling backups
To schedule automatic backups, add a cron entry that runs every minute:

```cron
* * * * * /usr/libexec/cockpit-backblaze-b2/runner.js
```
The runner.js script should read jobs.json and execute each job as needed.

You may want to run specific jobs at certain times—use your preferred cron logic.

Example for running all jobs at 3:00 AM:
```cron
0 3 * * * /usr/libexec/cockpit-backblaze-b2/runner.js
```

### Example runner.js
Require node.js

To install node.js run this:
```bash
sudo apt install nodejs npm
```

runner.js

```js
#!/usr/bin/env node

const fs = require('fs');
const { spawnSync } = require('child_process');

const JOBS_FILE = '/etc/cockpit-backblaze-b2/jobs.json';

if (!fs.existsSync(JOBS_FILE)) {
  console.error(`Jobs file not found: ${JOBS_FILE}`);
  process.exit(1);
}

const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));

for (const job of jobs) {
  const { keyId, appKey, bucket, folder, jobName } = job;
  console.log(`Running backup job: ${jobName}`);
  const result = spawnSync(
    '/usr/libexec/cockpit-backblaze-b2/sync.sh',
    [keyId, appKey, bucket, folder],
    { stdio: 'inherit' }
  );
  if (result.error) {
    console.error(`Job "${jobName}" failed:`, result.error);
  } else {
    console.log(`Job "${jobName}" completed.`);
  }
}
```

## Security
AppKey and KeyId are stored unencrypted. Restrict file permissions!

Only allow trusted users to access /etc/cockpit-backblaze-b2.


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
sudo mkdir -p /usr/libexec/cockpit-backblaze-b2
sudo cp sync.sh /usr/libexec/cockpit-backblaze-b2/sync.sh
sudo chmod +x /usr/libexec/cockpit-backblaze-b2/sync.sh
```

Ensure it’s executable and accessible by the Cockpit backend.

## Example sync.sh

```bash
#!/bin/bash

set -euo pipefail

KEY_ID=$1
APP_KEY=$2
BUCKET=$3
FOLDER=$4

# Authorize account using updated syntax
if ! b2 account authorize "$KEY_ID" "$APP_KEY"; then
    echo "ERROR: Failed to authorize with Backblaze B2. Check your Key ID and App Key."
    exit 1
fi

# Sync folder using correct --skip-newer flag
if ! b2 sync --delete --skip-newer "$FOLDER" "b2://$BUCKET/$(hostname)"; then
    echo "ERROR: Sync failed. Check folder path, bucket name, and B2 credentials."
    exit 1
fi

echo "Backup completed successfully."

```
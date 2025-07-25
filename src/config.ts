// src/config.ts

import cockpit from 'cockpit';

const CONFIG_FILE = '/etc/backblaze-b2/config.json';

// Module-level config object
let config: Record<string, any> = {
    secretKey: 'changeme12345678' // Default fallback
};

// Load config from disk (async)
export async function loadConfig(): Promise<void> {
    try {
        const content = await cockpit.file(CONFIG_FILE, { superuser: 'require' }).read();
        config = JSON.parse(content);

        // Ensure fallback is present if missing
        if (!config.secretKey) {
            config.secretKey = 'changeme12345678';
        }

    } catch (error) {
        console.warn('[config] Failed to load config. Using fallback/default.', error);
        config = { secretKey: 'changeme12345678' };
    }
}

// Save config to disk (async)
export async function saveConfig(newConfig: Record<string, any>): Promise<void> {

    config = { ...config, ...newConfig };

    // Always ensure a secretKey exists
    if (!config.secretKey)
        config.secretKey = 'changeme12345678';

    try {
        await cockpit.file(CONFIG_FILE, { superuser: 'require' }).replace(JSON.stringify(config, null, 2));

    } catch (error) {
        console.error('[config] Failed to save config:', error);
        throw error;
    }
}

// Get config value with fallback
export function getConfigValue(key: string, fallback: any = null): any {
    return config && typeof config === 'object' && config.hasOwnProperty(key) ? config[key] : fallback;
}

// Set config value in memory (not saved!)
export function setConfigValue(key: string, value: any): void {
    config[key] = value;
}

export function getConfig(): Record<string, any> {
    return { ...config };
}
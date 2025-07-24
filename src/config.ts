import cockpit from 'cockpit';

const CONFIG_FILE = '/etc/backblaze-b2/config.json';
let config: Record<string, any> = {
    secretKey: 'changeme12345678' // default fallback
};

export async function loadConfig(): Promise<void> {
    try {
        const content = await cockpit.file(CONFIG_FILE, { superuser: true }).read();
        config = JSON.parse(content);
        console.log('[config] Loaded config:', config);
    } catch (error) {
        console.warn('[config] Failed to load config, using fallback.', error);
        config = { secretKey: config.secretKey }; // keep fallback
    }
}

export async function saveConfig(): Promise<void> {
    try {
        const content = JSON.stringify(config, null, 2);
        await cockpit.file(CONFIG_FILE, { superuser: true }).replace(content);
        console.log('[config] Saved config');
    } catch (error) {
        console.error('[config] Failed to save config:', error);
        throw error;
    }
}

export function getConfigValue(key: string, fallback: any = null): any {
    return config?.hasOwnProperty(key) ? config[key] : fallback;
}

export function setConfigValue(key: string, value: any): void {
    config[key] = value;
}
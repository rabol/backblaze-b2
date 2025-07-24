import cockpit from 'cockpit';

export const CONFIG_FILE = '/etc/backblaze-b2/config.json';

let config: Record<string, any> = {
    secretKey: 'changeme12345678'  // fallback
};

export function getConfig(): Record<string, any> {
    return config;
}

export async function loadConfig(): Promise<void> {
    try {
        const content = await cockpit.file(CONFIG_FILE, { superuser: true }).read();
        config = JSON.parse(content);
        console.log('[config] Config loaded:', config);
    } catch (error) {
        console.warn('[config] Failed to load config. Using empty config.', error);
        config = {};
    }
}

export async function saveConfig(): Promise<void> {
    try {
        await cockpit.file(CONFIG_FILE, { superuser: true }).replace(JSON.stringify(config, null, 2));
        console.log('[config] Config saved.');
    } catch (error) {
        console.error('[config] Failed to save config:', error);
        throw new Error('Unable to save configuration.');
    }
}

export function getConfigValue(key: string, fallback: any = null): any {
    return config.hasOwnProperty(key) ? config[key] : fallback;
}

export function setConfigValue(key: string, value: any): void {
    config[key] = value;
}
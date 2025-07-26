// src/log.ts

import cockpit from 'cockpit';

import { debug } from './utils';

const BACKUP_LOG_FILE = '/etc/cockpit-backblaze-b2/backups.json';

export interface BackupLogEntry {
    jobName: string;
    timestamp: string;
    status: string;
    summary: string;
}

export function summarizeBackupOutput(rawOutput: string): { summary: string, details: string } {
    const details = rawOutput.trim();
    let summary = '';

    // Look for an "ERROR:" or "SUCCESS:" line and capture only the message
    const errorMatch = details.match(/^ERROR:\s*(.*)$/im);
    const successMatch = details.match(/^SUCCESS:\s*(.*)$/im);

    if (errorMatch) {
        summary = errorMatch[1];
    } else if (successMatch) {
        summary = successMatch[1];
    } else {
        // fallback: show the last non-empty line as summary
        const lines = details.split('\n').map(l => l.trim()).filter(Boolean);
        summary = lines.length ? lines[lines.length - 1] : '';
    }

    return { summary, details };
}


export async function logBackup(jobName: string, status: string, summary: string): Promise<void> {
    // Load current history
    let history: BackupLogEntry[];
    try {

        const content = await cockpit.file(BACKUP_LOG_FILE, { superuser: 'require' }).read();
        if (!content || !content.trim()) {
            history = [];
        } else {
            history = JSON.parse(content) as BackupLogEntry[];
        }

    } catch (e) {

        history = [];
        debug('[log] Failed to load backup history:', e);

    }
    // Add the new entry
    const entry: BackupLogEntry = {
        jobName,
        timestamp: new Date().toISOString(),
        status,
        summary,
    };

    history.push(entry);

    // Save back as PRETTY JSON
    try {

        await cockpit.file(BACKUP_LOG_FILE, { superuser: 'require' }).replace(JSON.stringify(history, null, 2));

    } catch (error) {

        debug('[log] Failed to save backup history:', error);

    }

}

export async function loadBackupHistory(): Promise<BackupLogEntry[]> {
    try {

        const content = await cockpit.file(BACKUP_LOG_FILE, { superuser: 'require' }).read();
        if (!content || !content.trim()) {
            return [];
        }

        return JSON.parse(content) as BackupLogEntry[];

    } catch (e) {

        debug('[log] Failed to load backup history:', e);
        return [];

    }
}
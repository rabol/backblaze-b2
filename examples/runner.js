#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

const JOBS_FILE = '/etc/cockpit-backblaze-b2/jobs.json';
const LOG_FILE = '/etc/cockpit-backblaze-b2/backups.json';
const SYNC_CMD = '/usr/libexec/cockpit-backblaze-b2/sync.sh';

// Helper to log to stdout
function log(msg) {
    console.log(`[${new Date().toISOString()}] ${msg}`);
}

// Helper to read jobs.json
function loadJobs() {
    try {
        const content = fs.readFileSync(JOBS_FILE, 'utf8');
        return JSON.parse(content);
    } catch (err) {
        log(`Failed to read jobs: ${err.message}`);
        process.exit(1);
    }
}

// Helper to append to backup log as pure JSON array (create or extend)
function appendLog(entry) {
    let logEntries = [];
    try {
        if (fs.existsSync(LOG_FILE)) {
            const logContent = fs.readFileSync(LOG_FILE, 'utf8');
            logEntries = logContent.trim() ? JSON.parse(logContent) : [];
        }
    } catch (err) {
        // If corrupt, start a new log
        logEntries = [];
    }
    logEntries.unshift(entry); // newest first
    fs.writeFileSync(LOG_FILE, JSON.stringify(logEntries, null, 2));
}

// Helper to summarize sync output
function summarizeOutput(raw) {
    // Try to extract error/success
    const lines = String(raw).split('\n').map(line => line.trim()).filter(Boolean);
    let summary = '';
    for (const line of lines) {
        if (line.startsWith('ERROR:')) {
            summary = line.replace(/^ERROR:\s*/, '');
            break;
        }
        if (line.startsWith('SUCCESS:')) {
            summary = line.replace(/^SUCCESS:\s*/, '');
            break;
        }
    }
    if (!summary && lines.length) summary = lines[lines.length - 1];
    return summary;
}

// Run a single backup job and log
function runJob(job) {
    const { jobName, keyId, appKey, bucket, folder } = job;
    log(`Running job: ${jobName} (bucket: ${bucket}, folder: ${folder})`);
    let status = 'success';
    let summary = '';
    let output = '';

    try {
        output = execSync(
            `${SYNC_CMD} "${keyId}" "${appKey}" "${bucket}" "${folder}"`,
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        );
        summary = summarizeOutput(output);
        log(`Job ${jobName} completed: ${summary}`);
    } catch (err) {
        status = 'fail';
        // Try to extract error from output if possible
        const errOutput = err.stdout ? err.stdout.toString() + '\n' + err.stderr.toString() : err.message;
        summary = summarizeOutput(errOutput);
        log(`Job ${jobName} failed: ${summary || err.message}`);
    }

    // Always log the result
    appendLog({
        jobName,
        timestamp: new Date().toISOString(),
        status,
        summary
    });
}

// Main execution
function main() {
    const jobs = loadJobs();
    if (!Array.isArray(jobs) || jobs.length === 0) {
        log('No jobs found.');
        process.exit(0);
    }
    jobs.forEach(runJob);
}

main();
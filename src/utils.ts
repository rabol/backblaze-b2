// src/utils.ts

export function summarizeBackupOutput(rawOutput: string): { summary: string, details: string } {
    const jsonMatches = rawOutput.match(/({[\s\S]+?})/g);
    let summary = '', details = rawOutput.trim();

    let fileCountMatch = details.match(/compare: (\d+)\/(\d+) files updated: (\d+) files/);
    let speedMatch = details.match(/([0-9.]+ [KMGT]?B)\/s/);
    let completed = /Backup completed successfully/i.test(details);

    if (jsonMatches && jsonMatches.length) {
        try {
            const obj = JSON.parse(jsonMatches[jsonMatches.length - 1]);
            summary = [
                obj.allowed && obj.allowed.bucketName ? `Bucket: ${obj.allowed.bucketName}` : null,
                obj.accountId ? `Account: ${obj.accountId}` : null,
                obj.apiUrl ? `API URL: ${obj.apiUrl}` : null,
                obj.applicationKeyId ? `Key: ${obj.applicationKeyId}` : null,
                obj.isMasterKey !== undefined ? `Master Key: ${obj.isMasterKey}` : null,
            ].filter(Boolean).join(' | ');
        } catch {
            summary = "Backup finished, but could not parse response JSON.";
        }
    }

    if (fileCountMatch) {
        var compared = fileCountMatch[1];
        var total = fileCountMatch[2];
        var updated = fileCountMatch[3];
        summary += summary ? " | " : "";
        summary += `Compared: ${compared}/${total} files, Updated: ${updated} files`;
    }

    if (speedMatch) {
        summary += summary ? " | " : "";
        summary += `Speed: ${speedMatch[1]}/s`;
    }

    if (completed) {
        summary += summary ? " | " : "";
        summary += "Backup completed successfully";
    }

    if (!summary) {
        summary = "Backup finished, see details below.";
    }

    return { summary, details };
}
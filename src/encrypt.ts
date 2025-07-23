// src/encrypt.ts

const SECRET = 'b2-secret'; // Replace with a better secret in production

export function simpleEncrypt(text: string): string {
    return Buffer.from(`${text}:${SECRET}`).toString('base64');
}

export function simpleDecrypt(text: string): string {
    try {
        const decoded = Buffer.from(text, 'base64').toString('utf8');
        const [value, secret] = decoded.split(':');
        if (secret !== SECRET) throw new Error('Invalid secret');
        return value;
    } catch {
        return '';
    }
}
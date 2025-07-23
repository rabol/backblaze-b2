// src/encrypt.ts
// Simple encryption and decryption functions using AES-CBC
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const secret = 's3cret-k3y-123456'; // Must be 16 chars for AES-128

export async function simpleEncrypt(text: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'AES-CBC' },
        false,
        ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        key,
        encoder.encode(text)
    );

    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...result));
}

export async function simpleDecrypt(base64: string): Promise<string> {
    const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const iv = raw.slice(0, 16);
    const data = raw.slice(16);

    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'AES-CBC' },
        false,
        ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv },
        key,
        data
    );

    return decoder.decode(decrypted);
}
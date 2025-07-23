// encrypt.ts

const enc = new TextEncoder();
const dec = new TextDecoder();

const ivLength = 12; // AES-GCM standard IV length

async function getKey(secret: string): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: enc.encode('backblaze-b2'),
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encrypt(plainText: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(ivLength));
    const key = await getKey('backblaze-b2-secret-key');
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(plainText)
    );
    return `${btoa(String.fromCharCode(...iv))}:${btoa(String.fromCharCode(...new Uint8Array(encrypted)))}`;
}

export async function decrypt(cipherText: string): Promise<string> {
    const [ivBase64, dataBase64] = cipherText.split(':');
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const data = Uint8Array.from(atob(dataBase64), c => c.charCodeAt(0));
    const key = await getKey('backblaze-b2-secret-key');
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
    );
    return dec.decode(decrypted);
}
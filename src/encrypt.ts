// src/encrypt.ts
// Simple encryption and decryption functions using Base64 encoding
// This is a basic implementation and will be enhanced
import { decode as base64_decode, encode as base64_encode } from 'base-64';

export function simpleEncrypt(plainText: string): string {

    if (!isBase64(plainText)) {
        console.log('incoming is not base64');
        return base64_encode(plainText);
    }
    return plainText;
}

export function simpleDecrypt(encryptedText: string): string {

    if (isBase64(encryptedText)) {
        console.log('incoming is base64');
        return base64_decode(encryptedText);
    }

    return encryptedText;
}


export function isBase64(value: string): boolean {
    if (!value || value.length % 4 !== 0) return false;

    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    if (!base64Regex.test(value)) return false;

    try {
        const decoded = base64_decode(value);
        const reencoded = base64_encode(decoded);
        return reencoded === value;
    } catch (e) {
        return false;
    }
}



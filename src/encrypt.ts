// src/encrypt.ts
import * as CryptoJS from 'crypto-js';
import { getConfigValue } from './config';


// Function to encrypt data
export function encryptData(data: string): string {
    const key = getConfigValue('secretKey') || 'default-fallback-key';

    // Encrypt the data using AES-128
    const encrypted = CryptoJS.AES.encrypt(data, CryptoJS.enc.Utf8.parse(key), {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    // Return the encrypted data in Base64 format
    return encrypted.toString();
}

// Function to decrypt data
export function decryptData(encryptedData: string): string {
    const key = getConfigValue('secretKey') || 'default-fallback-key';

    // Decrypt the data using AES-128
    const decrypted = CryptoJS.AES.decrypt(encryptedData, CryptoJS.enc.Utf8.parse(key), {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    // Convert the decrypted data back to a string
    return decrypted.toString(CryptoJS.enc.Utf8);
}


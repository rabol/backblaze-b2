// src/encrypt.ts
import * as CryptoJS from 'crypto-js';
import { getConfigValue } from './config';
import { debug } from './utils';

/**
 * Encrypts the provided data using AES-128 encryption with a fixed key length of 16 characters.
 *
 * @param data - The string data to be encrypted.
 * @param key - The encryption key, which will be adjusted to 16 characters.
 * @returns The encrypted data in Base64 format.
 */
export function encryptData(data: string, key: string): string {


    // Encrypt the data using AES-128
    const encrypted = CryptoJS.AES.encrypt(data, CryptoJS.enc.Utf8.parse(fixAesKey(key)), {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });

    // Return the encrypted data in Base64 format
    return encrypted.toString();
}

/**
 * Decrypts the provided encrypted data using AES-128 decryption with a fixed key length of 16 characters.
 *
 * @param encryptedData - The Base64 encoded encrypted string to be decrypted.
 * @param key - The decryption key, which will be adjusted to 16 characters.
 * @returns The decrypted string.
 */
export function decryptData(encryptedData: string, key: string): string {

    // Decrypt the data using AES-128
    const decrypted = CryptoJS.AES.decrypt(encryptedData, CryptoJS.enc.Utf8.parse(fixAesKey(key)), {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });

    // Convert the decrypted data back to a string
    return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Adjusts the provided key string to ensure it is exactly 16 characters long,
 * which is required for AES-128 encryption.
 *
 * If the input key is shorter than 16 characters, it is padded with spaces.
 * If it is longer, it is truncated to 16 characters.
 *
 * @param key - The input string to be used as an AES key.
 * @returns A string of exactly 16 characters suitable for AES-128 encryption.
 */
function fixAesKey(key: string) {
    return key.padEnd(16, ' ').slice(0, 16);
}

/**
 * Attempts to decrypt the provided encrypted text using a specified key or a default configuration key.
 *
 * @param encryptedText - The encrypted string to be decrypted.
 * @param keyOverride - (Optional) A key to override the default decryption key.
 * @returns The decrypted string if successful; otherwise, returns an empty string on failure.
 *
 * @remarks
 * Logs the decryption attempt and result to the console for testing purposes.
 * If decryption fails, logs the error and returns an empty string.
 */
export function testDecryption(encryptedText: string, keyOverride?: string) {

    const key = keyOverride || getConfigValue('secretKey', 'changeme12345678');

    try {
        debug('[TEST] Attempting to decrypt:', encryptedText, 'with key:', key);
        const decrypted = decryptData(encryptedText, getConfigValue('secretKey', 'changeme12345678'));
        debug('[TEST] Decrypted result:', decrypted);
        return decrypted;
    } catch (err) {
        console.error('[TEST] Decryption failed:', err);
        return '';
    }
}

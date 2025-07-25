import React, { useState } from 'react';
import { encryptData, decryptData } from './encrypt'; // Adjust path if needed

export function CryptoTestPanel() {
    const [plain, setPlain] = useState('');
    const [key, setKey] = useState('');
    const [encrypted, setEncrypted] = useState('');
    const [decrypted, setDecrypted] = useState('');

    return (
        <div style={{
            maxWidth: 440, margin: '32px auto', padding: 24, border: '1px solid #ddd', borderRadius: 10, background: '#fafcff'
        }}>
            <h3>Encryption/Decryption Tester</h3>
            <div style={{ marginBottom: 12 }}>
                <label>Key</label>
                <input
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    style={{ width: '100%', marginBottom: 8 }}
                    placeholder="Encryption Key"
                />
            </div>
            <div style={{ marginBottom: 12 }}>
                <label>Plaintext</label>
                <input
                    value={plain}
                    onChange={e => setPlain(e.target.value)}
                    style={{ width: '100%', marginBottom: 8 }}
                    placeholder="Text to encrypt"
                />
                <button
                    style={{ marginRight: 8 }}
                    onClick={() => setEncrypted(encryptData(plain, key))}
                >Encrypt</button>
                <button
                    onClick={() => setDecrypted(decryptData(encrypted, key))}
                    disabled={!encrypted || !key}
                >Decrypt</button>
            </div>
            <div style={{ marginBottom: 8 }}>
                <strong>Encrypted:</strong>
                <div style={{
                    background: '#eee', padding: 8, wordBreak: 'break-all', borderRadius: 4, minHeight: 24
                }}>{encrypted}</div>
            </div>
            <div>
                <strong>Decrypted:</strong>
                <div style={{
                    background: '#eee', padding: 8, wordBreak: 'break-all', borderRadius: 4, minHeight: 24
                }}>{decrypted}</div>
            </div>
        </div>
    );
}
/**
 * NFC.js - NFC generator for two-factor authentication
 * 
 * This module provides functionality to generate and validate NFC tags for 2FA
 */

class NFCGenerator {
    constructor() {
        this.nfcSupported = 'NDEFReader' in window;
    }

    /**
     * Check if the browser supports NFC
     * @returns {boolean} True if NFC is supported
     */
    isNFCSupported() {
        return this.nfcSupported;
    }

    /**
     * @param {string} userId - The user's unique identifier
     * @param {string} secret - Secret key for the user
     * @returns {Promise<boolean>} - Promise resolving to success status
     */
    async generateNFCTag(userId, secret) {
        if (!this.nfcSupported) {
            throw new Error('NFC is not supported in this browser');
        }

        try {
            const ndef = new NDEFReader();
            await ndef.write({
                records: [
                    { 
                        recordType: "url",
                        data: `https://yourwebsite.com/auth?id=${userId}&token=${this.generateToken(userId, secret)}`
                    },
                    {
                        recordType: "text",
                        data: `2FA-${userId}-${Date.now()}`
                    }
                ]
            });
            return true;
        } catch (error) {
            console.error('Error writing to NFC tag:', error);
            throw error;
        }
    }

    /**
     * Generate a time-based token for the user
     * @param {string} userId - The user's ID
     * @param {string} secret - The user's secret key
     * @returns {string} The generated token
     */
    generateToken(userId, secret) {
        // Simple token generation - in production use TOTP (Time-based One-Time Password)
        const timestamp = Math.floor(Date.now() / 30000); // 30-second window
        return this.hashString(`${userId}-${secret}-${timestamp}`);
    }

    /**
     * Read an NFC tag for authentication
     * @returns {Promise<Object>} The data read from the tag
     */
    async readNFCTag() {
        if (!this.nfcSupported) {
            throw new Error('NFC is not supported in this browser');
        }

        try {
            const ndef = new NDEFReader();
            await ndef.scan();
            
            return new Promise((resolve, reject) => {
                ndef.addEventListener("reading", ({ message }) => {
                    const records = [];
                    for (const record of message.records) {
                        records.push({
                            recordType: record.recordType,
                            data: record.recordType === "text" ? 
                                        new TextDecoder().decode(record.data) :
                                        record.data
                        });
                    }
                    resolve(records);
                });
                
                ndef.addEventListener("error", (error) => {
                    reject(error);
                });
            });
        } catch (error) {
            console.error('Error reading NFC tag:', error);
            throw error;
        }
    }

    /**
     * Simple string hashing function
     * @param {string} str - String to hash
     * @returns {string} Hashed string
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }
}

// Export the NFC generator
module.exports = NFCGenerator;

// Example usage:
/*
const nfcGenerator = new NFCGenerator();

// Check if NFC is supported
if (nfcGenerator.isNFCSupported()) {
    // Generate an NFC tag for a user
    nfcGenerator.generateNFCTag('user123', 'userSecretKey')
        .then(() => console.log('NFC tag written successfully'))
        .catch(err => console.error('Failed to write NFC tag:', err));
    
    // Read an NFC tag
    nfcGenerator.readNFCTag()
        .then(data => console.log('NFC tag read:', data))
        .catch(err => console.error('Failed to read NFC tag:', err));
} else {
    console.log('NFC is not supported on this device');
}
*/
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

interface EncryptedApiKey {
  ciphertext: string;
  iv: string;
  authTag: string;
}

/**
 * Reads and validates the encryption key from environment variables.
 */
function getEncryptionKey(): Buffer {
  const encodedKey = process.env.USER_API_KEY_ENCRYPTION_KEY;

  if (!encodedKey) {
    throw new Error(
      'USER_API_KEY_ENCRYPTION_KEY is missing from environment variables.'
    );
  }

  const key = Buffer.from(encodedKey, 'base64');

  if (
    key.length !== 32 ||
    key.toString('base64') !== encodedKey
  ) {
    throw new Error(
      'USER_API_KEY_ENCRYPTION_KEY must be a valid Base64-encoded 32-byte key.'
    );
  }

  return key;
}

/**
 * Encrypts an API key using AES-256-GCM.
 */
export function encryptApiKey(apiKey: string): EncryptedApiKey {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('API key cannot be empty.');
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(apiKey.trim(), 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypts an encrypted API key.
 */
export function decryptApiKey(
  encryptedData: EncryptedApiKey
): string {
  const key = getEncryptionKey();

  const iv = Buffer.from(encryptedData.iv, 'hex');
  const authTag = Buffer.from(encryptedData.authTag, 'hex');
  const ciphertext = Buffer.from(
    encryptedData.ciphertext,
    'base64'
  );

  if (
    iv.length !== IV_LENGTH ||
    authTag.length !== AUTH_TAG_LENGTH
  ) {
    throw new Error('Invalid encrypted API key data.');
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
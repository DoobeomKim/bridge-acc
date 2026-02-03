import crypto from 'crypto'

/**
 * Simple encryption/decryption for storing tokens
 * In production, consider using a more robust solution
 */

const ALGORITHM = 'aes-256-cbc'
const KEY_LENGTH = 32
const IV_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY not set in environment variables')
  }

  // Ensure key is exactly 32 bytes
  const keyBuffer = Buffer.from(key.padEnd(KEY_LENGTH, '0').slice(0, KEY_LENGTH))
  return keyBuffer
}

/**
 * Encrypt a string
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Return IV + encrypted data
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt a string
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey()
    const parts = encryptedText.split(':')

    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

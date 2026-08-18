import crypto from 'crypto'

const SECRET_KEY = process.env.SESSION_SECRET || 'trueread-secret-key-2026-v1'

export interface SessionPayload {
  userId: string
  email: string
  name?: string | null
  exp: number
}

/**
 * Hashes a password using Node's crypto.scryptSync with a 16-byte random salt.
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const userSalt = salt || crypto.randomBytes(16).toString('hex')
  const key = crypto.scryptSync(password, userSalt, 64)
  return {
    hash: key.toString('hex'),
    salt: userSalt,
  }
}

/**
 * Verifies a plain-text password against a stored scrypt hash and salt.
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const { hash: computedHash } = hashPassword(password, salt)
    const bufA = Buffer.from(hash, 'hex')
    const bufB = Buffer.from(computedHash, 'hex')
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

/**
 * Sign a payload object into an HMAC-SHA256 session token string.
 */
export function createSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  const data: SessionPayload = { ...payload, exp }
  const jsonStr = JSON.stringify(data)
  const base64Data = Buffer.from(jsonStr).toString('base64url')

  const hmac = crypto.createHmac('sha256', SECRET_KEY)
  hmac.update(base64Data)
  const signature = hmac.digest('base64url')

  return `${base64Data}.${signature}`
}

/**
 * Verifies and decodes an HMAC-SHA256 session token string.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [base64Data, signature] = token.split('.')
    if (!base64Data || !signature) return null

    const hmac = crypto.createHmac('sha256', SECRET_KEY)
    hmac.update(base64Data)
    const expectedSig = hmac.digest('base64url')

    if (signature !== expectedSig) return null

    const jsonStr = Buffer.from(base64Data, 'base64url').toString('utf-8')
    const payload: SessionPayload = JSON.parse(jsonStr)

    if (Date.now() > payload.exp) return null

    return payload
  } catch {
    return null
  }
}

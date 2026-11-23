import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { hashPassword, createSessionToken } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { clientIp, readJson, tooMany } from '@/lib/http'

const MIN_PASSWORD = 10
const MAX_PASSWORD = 128 // also bounds the cost of scrypt hashing
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Very common passwords that still pass a length check. Not exhaustive: a
// breached-password service (e.g. HIBP k-anonymity) is the proper next step.
const COMMON = new Set([
  'password123', '1234567890', 'qwertyuiop', 'passw0rd123', 'password1234', 'iloveyou123',
  'abc1234567', '0123456789', 'letmein1234', 'welcome1234', 'admin12345', 'qwerty12345',
  '1q2w3e4r5t', 'trueread123', 'true2readers',
])

export async function POST(req: Request) {
  try {
    const gate = rateLimit(`signup:${clientIp(req)}`, 10, 60 * 60_000)
    if (!gate.ok) return tooMany(gate.retryAfter, 'Too many sign-up attempts from this address. Please try again later.')

    const parsed = await readJson(req, 4096)
    if (!parsed.ok) return parsed.res
    const { email, password, name } = parsed.data ?? {}

    if (!email || typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD) {
      return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD} characters long.` }, { status: 400 })
    }
    if (password.length > MAX_PASSWORD) {
      return NextResponse.json({ error: `Password must be at most ${MAX_PASSWORD} characters long.` }, { status: 400 })
    }
    if (COMMON.has(password.toLowerCase()) || password.toLowerCase() === email.trim().toLowerCase() || /^(.)\1+$/.test(password)) {
      return NextResponse.json({ error: 'That password is too easy to guess. Please choose another.' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const { hash, salt } = hashPassword(password)

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        password: hash,
        salt,
        name: typeof name === 'string' && name.trim() ? name.trim().slice(0, 80) : null,
      },
    })

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    })

    const cookieStore = await cookies()
    cookieStore.set('trueread_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred during signup.' }, { status: 500 })
  }
}

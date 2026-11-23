import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { verifyPassword, createSessionToken } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { accountsOff, clientIp, readJson, tooMany } from '@/lib/http'
import { AUTH_ENABLED } from '@/lib/features'

const WINDOW = 15 * 60_000

export async function POST(req: Request) {
  if (!AUTH_ENABLED) return accountsOff()
  try {
    const ip = clientIp(req)
    // Broad per-address ceiling, then a tighter per (address + account) limit below.
    // Keyed on address+email so one attacker cannot lock a victim out from elsewhere.
    const ipGate = rateLimit(`login-ip:${ip}`, 40, WINDOW)
    if (!ipGate.ok) return tooMany(ipGate.retryAfter, 'Too many sign-in attempts. Please wait and try again.')

    const parsed = await readJson(req, 4096)
    if (!parsed.ok) return parsed.res
    const { email, password } = parsed.data ?? {}

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }
    if (email.length > 254 || password.length > 128) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const gate = rateLimit(`login:${ip}:${normalizedEmail}`, 8, WINDOW)
    if (!gate.ok) return tooMany(gate.retryAfter, 'Too many sign-in attempts. Please wait and try again.')

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const isValid = verifyPassword(password, user.password, user.salt)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

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
    console.error('Login error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred during login.' }, { status: 500 })
  }
}

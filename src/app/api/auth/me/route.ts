import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySessionToken } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('trueread_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ user: null })
    }

    const payload = verifySessionToken(sessionCookie.value)
    if (!payload) {
      return NextResponse.json({ user: null })
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Me endpoint error:', error)
    return NextResponse.json({ user: null })
  }
}

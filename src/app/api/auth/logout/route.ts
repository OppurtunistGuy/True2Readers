import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { accountsOff } from '@/lib/http'
import { AUTH_ENABLED } from '@/lib/features'

export async function POST() {
  if (!AUTH_ENABLED) return accountsOff()
  try {
    const cookieStore = await cookies()
    cookieStore.delete('trueread_session')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Failed to log out.' }, { status: 500 })
  }
}

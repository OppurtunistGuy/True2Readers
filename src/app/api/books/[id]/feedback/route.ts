import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { verifySessionToken } from '@/lib/auth'
import { accountsOff, readJson } from '@/lib/http'
import { AUTH_ENABLED } from '@/lib/features'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!AUTH_ENABLED) return accountsOff()
  try {
    const { id: rawBookId } = await params
    const bookId = decodeURIComponent(rawBookId)

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required.' }, { status: 400 })
    }

    // Get current user if logged in
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('trueread_session')
    let currentUserId: string | null = null

    if (sessionCookie?.value) {
      const payload = verifySessionToken(sessionCookie.value)
      if (payload) {
        currentUserId = payload.userId
      }
    }

    const feedbacks = await db.bookStyleFeedback.findMany({
      where: { bookId },
      include: {
        // Never load the email: this listing is public.
        user: {
          select: { name: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const count = feedbacks.length

    let averages: { pacing: number; tone: number; dialogue: number } | null = null
    if (count > 0) {
      const sumPacing = feedbacks.reduce((acc, f) => acc + f.pacing, 0)
      const sumTone = feedbacks.reduce((acc, f) => acc + f.tone, 0)
      const sumDialogue = feedbacks.reduce((acc, f) => acc + f.dialogue, 0)

      averages = {
        pacing: Math.round((sumPacing / count) * 10) / 10,
        tone: Math.round((sumTone / count) * 10) / 10,
        dialogue: Math.round((sumDialogue / count) * 10) / 10,
      }
    }

    const userFeedback = currentUserId
      ? feedbacks.find((f) => f.userId === currentUserId) || null
      : null

    const formattedFeedbacks = feedbacks.map((f) => ({
      id: f.id,
      pacing: f.pacing,
      tone: f.tone,
      dialogue: f.dialogue,
      note: f.note,
      createdAt: f.createdAt,
      // Display name if the reader chose one, otherwise anonymous (no email-derived text).
      authorName: f.user.name || 'Anonymous reader',
    }))

    return NextResponse.json({
      count,
      averages,
      userFeedback: userFeedback
        ? {
            id: userFeedback.id,
            pacing: userFeedback.pacing,
            tone: userFeedback.tone,
            dialogue: userFeedback.dialogue,
            note: userFeedback.note,
          }
        : null,
      feedbacks: formattedFeedbacks,
    })
  } catch (error) {
    console.error('Fetch feedback error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve style feedback.' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!AUTH_ENABLED) return accountsOff()
  try {
    const { id: rawBookId } = await params
    const bookId = decodeURIComponent(rawBookId)

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required.' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('trueread_session')

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'You must be logged in to submit style feedback.' },
        { status: 401 }
      )
    }

    const payload = verifySessionToken(sessionCookie.value)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid session. Please log in again.' },
        { status: 401 }
      )
    }

    const parsed = await readJson(req, 8192)
    if (!parsed.ok) return parsed.res
    const { pacing, tone, dialogue, note } = parsed.data ?? {}

    const pVal = Number(pacing)
    const tVal = Number(tone)
    const dVal = Number(dialogue)

    if (
      isNaN(pVal) || pVal < 1 || pVal > 5 ||
      isNaN(tVal) || tVal < 1 || tVal > 5 ||
      isNaN(dVal) || dVal < 1 || dVal > 5
    ) {
      return NextResponse.json(
        { error: 'Pacing, tone, and dialogue ratings must be numbers between 1 and 5.' },
        { status: 400 }
      )
    }

    const cleanNote = note && typeof note === 'string' ? note.trim().slice(0, 500) : null

    const feedback = await db.bookStyleFeedback.upsert({
      where: {
        bookId_userId: {
          bookId,
          userId: payload.userId,
        },
      },
      update: {
        pacing: pVal,
        tone: tVal,
        dialogue: dVal,
        note: cleanNote,
      },
      create: {
        userId: payload.userId,
        bookId,
        pacing: pVal,
        tone: tVal,
        dialogue: dVal,
        note: cleanNote,
      },
    })

    return NextResponse.json({
      success: true,
      feedback,
    })
  } catch (error) {
    console.error('Submit feedback error:', error)
    return NextResponse.json(
      { error: 'Failed to save style feedback.' },
      { status: 500 }
    )
  }
}

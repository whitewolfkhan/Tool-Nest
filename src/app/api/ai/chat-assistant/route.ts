import { NextRequest } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_MESSAGES = 30
const MAX_CONTENT = 4000

interface ChatMsg {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function isRateLimit(err: unknown): boolean {
  const msg = (err as Error)?.message?.toLowerCase() ?? ''
  return msg.includes('rate') || msg.includes('429') || msg.includes('quota')
}

const SYSTEM_PROMPT =
  'You are ToolNest Assistant, a friendly, concise, and helpful AI built into the ToolNest online tools website. ' +
  'Answer clearly and accurately. Use brief paragraphs or short bullet points when helpful. ' +
  'Avoid long preambles. If you do not know something, say so honestly.'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawMessages: unknown = body?.messages

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return Response.json(
        { error: 'A non-empty messages array is required.' },
        { status: 400 }
      )
    }

    const messages: ChatMsg[] = []
    for (const m of rawMessages) {
      if (
        m &&
        typeof m === 'object' &&
        (m as ChatMsg).role &&
        typeof (m as ChatMsg).content === 'string'
      ) {
        const role = (m as ChatMsg).role
        if (
          role === 'user' ||
          role === 'assistant' ||
          role === 'system'
        ) {
          const content = (m as ChatMsg).content.slice(0, MAX_CONTENT)
          messages.push({ role, content })
        }
      }
    }

    if (!messages.some((m) => m.role === 'user')) {
      return Response.json(
        { error: 'At least one user message is required.' },
        { status: 400 }
      )
    }

    // Keep conversation compact: keep last MAX_MESSAGES messages.
    const trimmed = messages.slice(-MAX_MESSAGES)
    const payload = [{ role: 'system', content: SYSTEM_PROMPT }, ...trimmed]

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: payload,
      thinking: { type: 'disabled' },
    })

    const reply = completion.choices[0]?.message?.content?.trim() ?? ''
    if (!reply) {
      return Response.json(
        { error: 'The model returned an empty reply. Please try again.' },
        { status: 502 }
      )
    }

    return Response.json({ reply })
  } catch (e) {
    const err = e as Error
    if (isRateLimit(err)) {
      return Response.json(
        {
          error:
            'The AI assistant is busy right now. Please wait a moment and try again.',
        },
        { status: 429 }
      )
    }
    return Response.json(
      { error: err.message || 'Failed to get a reply.' },
      { status: 500 }
    )
  }
}

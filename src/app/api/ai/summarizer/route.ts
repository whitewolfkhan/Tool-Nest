import { NextRequest } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_LENGTHS = ['short', 'medium', 'long'] as const
type Length = (typeof VALID_LENGTHS)[number]

const MAX_INPUT = 12000

const LENGTH_GUIDE: Record<Length, string> = {
  short: '1-2 sentences (under 60 words)',
  medium: '3-5 sentences (around 100-150 words)',
  long: 'a full paragraph (around 200-300 words)',
}

const KEY_POINTS_GUIDE: Record<Length, string> = {
  short: '2',
  medium: '3-5',
  long: '5-7',
}

function isRateLimit(err: unknown): boolean {
  const msg = (err as Error)?.message?.toLowerCase() ?? ''
  return msg.includes('rate') || msg.includes('429') || msg.includes('quota')
}

interface SummarizerResponse {
  summary: string
  keyPoints: string[]
}

function parseJsonResponse(raw: string): SummarizerResponse | null {
  if (!raw) return null
  // Try direct parse first.
  try {
    const parsed = JSON.parse(raw)
    if (
      typeof parsed?.summary === 'string' &&
      Array.isArray(parsed?.keyPoints)
    ) {
      return {
        summary: parsed.summary,
        keyPoints: parsed.keyPoints
          .map((p: unknown) => (typeof p === 'string' ? p : String(p)))
          .filter(Boolean),
      }
    }
  } catch {
    // fall through to fenced extraction
  }

  // Try to extract a ```json ... ``` fenced block.
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) {
    try {
      const parsed = JSON.parse(fenced[1])
      if (
        typeof parsed?.summary === 'string' &&
        Array.isArray(parsed?.keyPoints)
      ) {
        return {
          summary: parsed.summary,
          keyPoints: parsed.keyPoints
            .map((p: unknown) => (typeof p === 'string' ? p : String(p)))
            .filter(Boolean),
        }
      }
    } catch {
      /* ignore */
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const text: unknown = body?.text
    const length: unknown = body?.length

    if (typeof text !== 'string' || !text.trim()) {
      return Response.json(
        { error: 'Text to summarize is required.' },
        { status: 400 }
      )
    }
    if (text.length > MAX_INPUT) {
      return Response.json(
        { error: `Input is too long. Maximum ${MAX_INPUT} characters.` },
        { status: 400 }
      )
    }

    const resolvedLength: Length =
      typeof length === 'string' && (VALID_LENGTHS as readonly string[]).includes(length)
        ? (length as Length)
        : 'medium'

    const system = [
      'You are an expert summarizer. Read the provided text carefully and produce:',
      `1. A summary of length ${LENGTH_GUIDE[resolvedLength]}.`,
      `2. An array of ${KEY_POINTS_GUIDE[resolvedLength]} key points as concise strings.`,
      'Return ONLY a JSON object with two fields: "summary" (string) and "keyPoints" (array of strings).',
      'Do not include any other text, commentary, or markdown fences.',
    ].join(' ')

    const user = `Text to summarize:\n"""\n${text.trim()}\n"""`

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    const parsed = parseJsonResponse(raw)

    if (!parsed) {
      // Fallback: treat the raw output as the summary with no key points.
      return Response.json({
        summary: raw || 'No summary could be generated.',
        keyPoints: [],
      })
    }

    return Response.json(parsed)
  } catch (e) {
    const err = e as Error
    if (isRateLimit(err)) {
      return Response.json(
        {
          error:
            'The AI summarizer is busy right now. Please wait a moment and try again.',
        },
        { status: 429 }
      )
    }
    return Response.json(
      { error: err.message || 'Failed to summarize text.' },
      { status: 500 }
    )
  }
}

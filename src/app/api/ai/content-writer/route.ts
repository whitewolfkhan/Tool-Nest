import { NextRequest } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_TYPES = [
  'article',
  'email',
  'product-description',
  'social-post',
  'blog-post',
] as const
type ContentType = (typeof VALID_TYPES)[number]

const VALID_TONES = ['professional', 'casual', 'friendly', 'formal'] as const
type Tone = (typeof VALID_TONES)[number]

const VALID_LENGTHS = ['short', 'medium', 'long'] as const
type Length = (typeof VALID_LENGTHS)[number]

const LENGTH_GUIDE: Record<Length, string> = {
  short: 'around 100-150 words',
  medium: 'around 250-350 words',
  long: 'around 500-700 words',
}

const TYPE_GUIDE: Record<ContentType, string> = {
  article: 'an informative article',
  email: 'an email',
  'product-description': 'a product description',
  'social-post': 'a social media post',
  'blog-post': 'a blog post',
}

function isRateLimit(err: unknown): boolean {
  const msg = (err as Error)?.message?.toLowerCase() ?? ''
  return msg.includes('rate') || msg.includes('429') || msg.includes('quota')
}

function buildSystemPrompt(type: ContentType, tone: Tone, length: Length): string {
  return [
    `You are an expert copywriter. Write ${TYPE_GUIDE[type]} in a ${tone} tone.`,
    `Target length: ${LENGTH_GUIDE[length]}.`,
    'Use clear structure with short paragraphs where appropriate.',
    'Output only the final written content, with no preface, commentary, or markdown code fences.',
  ].join(' ')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompt: unknown = body?.prompt
    const type: unknown = body?.type
    const tone: unknown = body?.tone
    const length: unknown = body?.length

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return Response.json(
        { error: 'A topic or prompt is required.' },
        { status: 400 }
      )
    }
    if (prompt.length > 2000) {
      return Response.json(
        { error: 'Prompt is too long. Maximum 2000 characters.' },
        { status: 400 }
      )
    }

    const resolvedType: ContentType =
      typeof type === 'string' && (VALID_TYPES as readonly string[]).includes(type)
        ? (type as ContentType)
        : 'article'
    const resolvedTone: Tone =
      typeof tone === 'string' && (VALID_TONES as readonly string[]).includes(tone)
        ? (tone as Tone)
        : 'professional'
    const resolvedLength: Length =
      typeof length === 'string' && (VALID_LENGTHS as readonly string[]).includes(length)
        ? (length as Length)
        : 'medium'

    const system = buildSystemPrompt(resolvedType, resolvedTone, resolvedLength)
    const user = `${system}\n\nWrite the content for the following request:\n${prompt.trim()}`

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt.trim() },
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices[0]?.message?.content?.trim() ?? ''
    if (!content) {
      return Response.json(
        { error: 'The model returned an empty response. Please try again.' },
        { status: 502 }
      )
    }

    // Avoid the system prompt leaking into the response.
    void user
    return Response.json({ content })
  } catch (e) {
    const err = e as Error
    if (isRateLimit(err)) {
      return Response.json(
        {
          error:
            'The AI service is busy right now. Please wait a moment and try again.',
        },
        { status: 429 }
      )
    }
    return Response.json(
      { error: err.message || 'Failed to generate content.' },
      { status: 500 }
    )
  }
}

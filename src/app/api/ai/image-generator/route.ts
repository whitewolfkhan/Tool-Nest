import { NextRequest } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_SIZES = ['512x512', '1024x1024'] as const
type ImageSize = (typeof VALID_SIZES)[number]

function isRateLimit(err: unknown): boolean {
  const msg = (err as Error)?.message?.toLowerCase() ?? ''
  return msg.includes('rate') || msg.includes('429') || msg.includes('quota')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompt: unknown = body?.prompt
    const size: unknown = body?.size
    const n: unknown = body?.n

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return Response.json(
        { error: 'Prompt is required.' },
        { status: 400 }
      )
    }
    if (prompt.length > 1000) {
      return Response.json(
        { error: 'Prompt is too long. Maximum 1000 characters.' },
        { status: 400 }
      )
    }

    const resolvedSize: ImageSize =
      typeof size === 'string' && (VALID_SIZES as readonly string[]).includes(size)
        ? (size as ImageSize)
        : '1024x1024'

    const resolvedN = typeof n === 'number' && n >= 1 && n <= 4 ? Math.floor(n) : 1

    const zai = await ZAI.create()
    const result = await zai.images.generations.create({
      prompt: prompt.trim(),
      size: resolvedSize,
      n: resolvedN,
    })

    const images = (Array.isArray(result) ? result : []).map((r) => ({
      url: (r as { url?: string }).url ?? '',
    }))

    if (!images.length || !images[0].url) {
      return Response.json(
        { error: 'Image generation returned no results. Please try again.' },
        { status: 502 }
      )
    }

    return Response.json({ images })
  } catch (e) {
    const err = e as Error
    if (isRateLimit(err)) {
      return Response.json(
        {
          error:
            'The AI image service is busy right now. Please wait a moment and try again.',
        },
        { status: 429 }
      )
    }
    return Response.json(
      { error: err.message || 'Failed to generate image.' },
      { status: 500 }
    )
  }
}

import { NextRequest } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Per SDK types (CreateImageGenerationBody): supported sizes are
// 1024x1024, 768x1344, 864x1152, 1344x768, 1152x864, 1440x720, 720x1440.
const VALID_SIZES = [
  '1024x1024',
  '768x1344',
  '864x1152',
  '1344x768',
  '1152x864',
  '1440x720',
  '720x1440',
] as const
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

    const zai = await ZAI.create()
    const result = await zai.images.generations.create({
      prompt: prompt.trim(),
      size: resolvedSize,
    })

    // SDK returns: { created, data: [{ base64 }] }
    const dataArray = (result as { data?: Array<{ base64?: string }> }).data ?? []
    const images = dataArray
      .map((r) => {
        const b64 = r.base64 ?? ''
        if (!b64) return null
        return { url: `data:image/png;base64,${b64}` }
      })
      .filter((x): x is { url: string } => x !== null)

    if (!images.length) {
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

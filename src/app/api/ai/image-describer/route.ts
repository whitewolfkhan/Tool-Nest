import { NextRequest } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 6 * 1024 * 1024 // ~6 MB

function isRateLimit(err: unknown): boolean {
  const msg = (err as Error)?.message?.toLowerCase() ?? ''
  return msg.includes('rate') || msg.includes('429') || msg.includes('quota')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const image: unknown = body?.image

    if (typeof image !== 'string' || !image.startsWith('data:image/')) {
      return Response.json(
        { error: 'A valid base64 image data URL is required.' },
        { status: 400 }
      )
    }
    if (image.length > MAX_BYTES * 1.4) {
      // base64 is ~33% larger than the raw bytes
      return Response.json(
        { error: 'Image is too large. Please use an image under 6 MB.' },
        { status: 413 }
      )
    }

    const system =
      'You are a careful visual analyst. Describe the image in rich, accurate detail. ' +
      'Respond in plain prose (no markdown, no headings, no JSON). ' +
      'Cover: (1) a concise caption summarising the image, ' +
      '(2) the key objects, people, or subjects visible, ' +
      '(3) the dominant colors and lighting, and (4) the overall mood or atmosphere. ' +
      'Keep the description focused and avoid speculation.'

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image in detail.' },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    })

    const description = completion.choices[0]?.message?.content?.trim() ?? ''
    if (!description) {
      return Response.json(
        { error: 'The model returned an empty description. Please try again.' },
        { status: 502 }
      )
    }

    return Response.json({ description })
  } catch (e) {
    const err = e as Error
    if (isRateLimit(err)) {
      return Response.json(
        {
          error:
            'The AI vision service is busy right now. Please wait a moment and try again.',
        },
        { status: 429 }
      )
    }
    return Response.json(
      { error: err.message || 'Failed to describe image.' },
      { status: 500 }
    )
  }
}

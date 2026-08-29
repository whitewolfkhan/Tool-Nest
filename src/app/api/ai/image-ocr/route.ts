import { NextRequest } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 6 * 1024 * 1024 // ~6 MB base64-equivalent

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
        { error: 'Valid image data URL required' },
        { status: 400 }
      )
    }
    if (image.length > MAX_BYTES * 1.4) {
      return Response.json(
        { error: 'Image is too large. Please use an image under 6 MB.' },
        { status: 413 }
      )
    }

    const zai = await ZAI.create()
    // NOTE: must use createVision (not create) when the message contains an
    // image_url content item. The plain chat completions endpoint only accepts
    // text content and will reject image_url with code 1210.
    const completion = await zai.chat.completions.createVision({
      model: 'glm-4v-flash',
      messages: [
        {
          role: 'system',
          content:
            'You are an OCR assistant. Extract ALL text visible in the image. ' +
            'Return only the extracted text, preserving line breaks and structure. ' +
            'If no text is present, respond with "No text detected in this image."',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all text from this image.' },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    })

    const text = completion.choices[0]?.message?.content ?? ''
    return Response.json({ text })
  } catch (e) {
    if (isRateLimit(e)) {
      return Response.json(
        {
          error:
            'The AI vision service is busy right now. Please wait a moment and try again.',
        },
        { status: 429 }
      )
    }
    return Response.json(
      { error: (e as Error).message || 'Failed to extract text from image.' },
      { status: 500 }
    )
  }
}

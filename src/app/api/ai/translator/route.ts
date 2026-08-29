import { NextRequest } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_INPUT = 5000

const KNOWN_LANGUAGES = new Set([
  'en',
  'zh',
  'es',
  'fr',
  'de',
  'it',
  'pt',
  'ru',
  'ja',
  'ko',
  'ar',
  'hi',
  'bn',
  'tr',
  'vi',
  'th',
  'id',
  'pl',
  'nl',
  'sv',
  'uk',
])

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  zh: 'Chinese',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  bn: 'Bengali',
  tr: 'Turkish',
  vi: 'Vietnamese',
  th: 'Thai',
  id: 'Indonesian',
  pl: 'Polish',
  nl: 'Dutch',
  sv: 'Swedish',
  uk: 'Ukrainian',
}

function langName(code: string): string {
  return LANG_NAMES[code] ?? code.toUpperCase()
}

function isRateLimit(err: unknown): boolean {
  const msg = (err as Error)?.message?.toLowerCase() ?? ''
  return msg.includes('rate') || msg.includes('429') || msg.includes('quota')
}

function extractLanguage(raw: string): string | null {
  if (!raw) return null
  // Try direct JSON parse.
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.detectedSource === 'string') {
      return parsed.detectedSource
    }
  } catch {
    /* ignore */
  }
  // Try fenced JSON.
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) {
    try {
      const parsed = JSON.parse(fenced[1])
      if (parsed && typeof parsed.detectedSource === 'string') {
        return parsed.detectedSource
      }
    } catch {
      /* ignore */
    }
  }
  // Try to find a two-letter code via regex.
  const match = raw.match(/\b([a-z]{2})\b/i)
  if (match) return match[1].toLowerCase()
  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const text: unknown = body?.text
    const target: unknown = body?.target
    const source: unknown = body?.source

    if (typeof text !== 'string' || !text.trim()) {
      return Response.json(
        { error: 'Text to translate is required.' },
        { status: 400 }
      )
    }
    if (text.length > MAX_INPUT) {
      return Response.json(
        { error: `Input is too long. Maximum ${MAX_INPUT} characters.` },
        { status: 400 }
      )
    }
    if (typeof target !== 'string' || !target.trim()) {
      return Response.json(
        { error: 'A target language is required.' },
        { status: 400 }
      )
    }
    const targetCode = target.toLowerCase().trim()
    if (!KNOWN_LANGUAGES.has(targetCode)) {
      return Response.json(
        { error: `Unsupported target language: ${target}` },
        { status: 400 }
      )
    }

    const hasSource =
      typeof source === 'string' &&
      source.trim() &&
      KNOWN_LANGUAGES.has(source.toLowerCase().trim())
    const sourceCode = hasSource ? (source as string).toLowerCase().trim() : null

    const wantDetect = !sourceCode

    const systemParts = [
      'You are a professional translator. Translate the user text accurately and naturally.',
      `Target language: ${langName(targetCode)} (${targetCode}).`,
    ]
    if (sourceCode) {
      systemParts.push(`Source language: ${langName(sourceCode)} (${sourceCode}).`)
    } else {
      systemParts.push(
        'Source language: auto-detect. After translating, on a final new line, output the detected source language code in the form DETECTED_SOURCE=xx.'
      )
    }
    systemParts.push(
      'Preserve meaning, tone, and formatting. Output only the translation (plus the DETECTED_SOURCE line if auto-detecting). No explanations or preface.'
    )
    const system = systemParts.join(' ')

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: text.trim() },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    if (!raw) {
      return Response.json(
        { error: 'The model returned an empty translation. Please try again.' },
        { status: 502 }
      )
    }

    let translation = raw
    let detectedSource: string | undefined

    if (wantDetect) {
      const m = raw.match(/DETECTED_SOURCE\s*=\s*([a-z]{2})/i)
      if (m) {
        detectedSource = m[1].toLowerCase()
        translation = raw
          .replace(/DETECTED_SOURCE\s*=\s*[a-z]{2}\s*$/i, '')
          .replace(/\n+DETECTED_SOURCE\s*=\s*[a-z]{2}\s*$/i, '')
          .trim()
      } else {
        // Fallback: ask separately.
        try {
          const detectCompletion = await zai.chat.completions.create({
            messages: [
              {
                role: 'system',
                content:
                  'Identify the ISO 639-1 two-letter language code of the provided text. Respond with ONLY a JSON object {"detectedSource":"xx"}.',
              },
              { role: 'user', content: text.trim().slice(0, 800) },
            ],
            thinking: { type: 'disabled' },
          })
          const detectRaw = detectCompletion.choices[0]?.message?.content?.trim() ?? ''
          detectedSource = extractLanguage(detectRaw) ?? undefined
        } catch {
          /* ignore detection failure */
        }
      }
    }

    return Response.json({
      translation,
      ...(detectedSource ? { detectedSource } : {}),
    })
  } catch (e) {
    const err = e as Error
    if (isRateLimit(err)) {
      return Response.json(
        {
          error:
            'The AI translator is busy right now. Please wait a moment and try again.',
        },
        { status: 429 }
      )
    }
    return Response.json(
      { error: err.message || 'Failed to translate text.' },
      { status: 500 }
    )
  }
}

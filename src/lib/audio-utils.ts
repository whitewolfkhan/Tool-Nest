/**
 * Shared audio utilities for client-side audio processing.
 * Used by audio-trimmer, audio-compressor, audio-converter, audio-volume-booster, audio-merger.
 */

/**
 * Encode an AudioBuffer to a 16-bit PCM WAV Blob.
 *
 * Standard WAV (RIFF) layout:
 *   - 12 bytes: RIFF header (RIFF, chunk size, WAVE)
 *   - 24 bytes: fmt  subchunk (fmt, size, audioFormat=1, channels, sampleRate, byteRate, blockAlign, bitsPerSample=16)
 *   - 8  bytes: data subchunk header (data, size)
 *   - N    bytes: PCM samples (interleaved)
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const numFrames = buffer.length
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const blockAlign = numChannels * bytesPerSample
  const dataSize = numFrames * blockAlign
  const bufferSize = 44 + dataSize

  const ab = new ArrayBuffer(bufferSize)
  const view = new DataView(ab)

  // RIFF header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')

  // fmt subchunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // subchunk1 size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true) // byte rate
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)

  // data subchunk
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  // Interleave channel data and convert float [-1,1] to int16
  const channels: Float32Array[] = []
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c))
  }

  let offset = 44
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i]
      // Clamp to [-1, 1]
      sample = Math.max(-1, Math.min(1, sample))
      // Convert to 16-bit signed integer
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(offset, intSample, true)
      offset += 2
    }
  }

  return new Blob([ab], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

/**
 * Decode an audio File/Blob into an AudioBuffer using Web Audio API.
 */
export async function decodeAudioFile(file: File | Blob): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer()
  // Use a temporary AudioContext for decoding. AudioContext is fine here.
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AudioCtx()
  try {
    // decodeAudioData returns a Promise in modern browsers
    return await ctx.decodeAudioData(arrayBuffer.slice(0))
  } finally {
    // Close the context to free resources
    ctx.close().catch(() => {})
  }
}

/**
 * Slice an AudioBuffer to a smaller AudioBuffer (start/end in seconds).
 * Returns a new AudioBuffer with the same channels and sample rate.
 */
export function sliceAudioBuffer(
  buffer: AudioBuffer,
  startSeconds: number,
  endSeconds: number
): AudioBuffer {
  const sampleRate = buffer.sampleRate
  const numChannels = buffer.numberOfChannels
  const startSample = Math.max(0, Math.floor(startSeconds * sampleRate))
  const endSample = Math.min(buffer.length, Math.floor(endSeconds * sampleRate))
  const length = Math.max(0, endSample - startSample)

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AudioCtx()
  const sliced = ctx.createBuffer(numChannels, length, sampleRate)
  ctx.close().catch(() => {})

  for (let c = 0; c < numChannels; c++) {
    const src = buffer.getChannelData(c)
    const dst = sliced.getChannelData(c)
    for (let i = 0; i < length; i++) {
      dst[i] = src[startSample + i]
    }
  }
  return sliced
}

/**
 * Concatenate multiple AudioBuffers into one (channel count = max channels of inputs,
 * sample rate = sample rate of the first buffer). Shorter buffers are zero-padded
 * on channels that don't exist.
 */
export function concatenateAudioBuffers(buffers: AudioBuffer[]): AudioBuffer {
  if (buffers.length === 0) {
    throw new Error('No buffers to concatenate')
  }
  const sampleRate = buffers[0].sampleRate
  const numChannels = buffers.reduce(
    (max, b) => Math.max(max, b.numberOfChannels),
    1
  )
  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0)

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AudioCtx()
  const result = ctx.createBuffer(numChannels, totalLength, sampleRate)
  ctx.close().catch(() => {})

  let offset = 0
  for (const buf of buffers) {
    for (let c = 0; c < numChannels; c++) {
      const dst = result.getChannelData(c)
      if (c < buf.numberOfChannels) {
        const src = buf.getChannelData(c)
        for (let i = 0; i < buf.length; i++) {
          dst[offset + i] = src[i]
        }
      }
      // channels missing in this buffer remain zero-filled
    }
    offset += buf.length
  }

  return result
}

/**
 * Format a duration in seconds as mm:ss or hh:mm:ss.
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Format a byte count as a human-readable string (KB / MB / GB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const val = bytes / Math.pow(1024, i)
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/**
 * Pick the first supported MediaRecorder mimeType from a list of candidates.
 * Returns null if none are supported.
 */
export function pickSupportedMimeTypes(candidates: string[]): string | null {
  if (typeof MediaRecorder === 'undefined') return null
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c
    } catch {
      // ignore
    }
  }
  return null
}

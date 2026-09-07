# Task: AUDIO-VIDEO-TOOLS — 12 Media Tools (6 Audio + 6 Video)

**Agent**: audio-video-tools-builder (Z.ai Code)
**Status**: ✅ COMPLETE
**Date**: ToolNest fullstack dev session

## Scope

Build 12 client-side media tools (6 audio + 6 video) for the ToolNest free tools website. All processing must run entirely in the browser using Web Audio API, MediaRecorder, HTML5 video/canvas, and AudioContext. Registry entries and dynamic imports were already added by the orchestrator.

## Files Created

### Shared helper
- `/src/lib/audio-utils.ts` — `audioBufferToWav()` (16-bit PCM RIFF encoder), `decodeAudioFile()`, `sliceAudioBuffer()`, `concatenateAudioBuffers()`, `formatTime()`, `formatFileSize()`, `pickSupportedMimeTypes()`.

### Audio tools (fuchsia theme)
- `/src/components/tools/audio-trimmer.tsx` — waveform, range sliders, segment export as WAV.
- `/src/components/tools/audio-compressor.tsx` — sample rate + mono presets, OfflineAudioContext resampling, size comparison.
- `/src/components/tools/audio-converter.tsx` — WAV (always), WebM/Opus + MP3 via MediaRecorder (probed support).
- `/src/components/tools/audio-volume-booster.tsx` — gain 0×–4× with presets, 10s live preview, OfflineAudioContext + GainNode.
- `/src/components/tools/audio-merger.tsx` — multi-file upload + reorder, concatenateAudioBuffers, WAV output.
- `/src/components/tools/audio-recorder.tsx` — getUserMedia + MediaRecorder, RMS level meter, timer, format auto-detection.

### Video tools (teal theme)
- `/src/components/tools/video-trimmer.tsx` — native video preview + canvas + MediaRecorder capture, real-time trim.
- `/src/components/tools/video-compressor.tsx` — resolution + bitrate presets, real-time re-encode.
- `/src/components/tools/video-converter.tsx` — WebM VP9/VP8 + MP4 (probed), real-time re-encode.
- `/src/components/tools/video-to-gif.tsx` — frame extraction + gifenc (quantize + applyPalette), inline preview.
- `/src/components/tools/video-frame-extractor.tsx` — 3 modes (evenly / every Nth / timestamps), ZIP download via JSZip.
- `/src/components/tools/video-resizer.tsx` — presets (square/portrait/landscape/custom) + maintain-aspect-ratio.

## Dependencies Installed
- `gifenc@1.0.3` — used by video-to-gif.

## Theme & Design
- Audio tools: **fuchsia** accents (no indigo/blue).
- Video tools: **teal** accents.
- Success/output: **emerald** highlights.
- NO `.gradient-text` class used anywhere.
- All components use `ToolCardWrapper` (p-5 sm:p-6), drag-drop zones, sonner toast, loading spinners, progress bars, EmptyState fallbacks.

## Verification
- `bun run lint`: **PASS** (0 errors, 0 warnings).
- All 12 routes return HTTP 200 on `/tools/<slug>`.
- Dev server (port 3000) running cleanly with no compile errors.

## Browser Format Notes (documented inline)
- Browsers can decode almost any audio/video format.
- Browser encoding is limited to:
  - Audio: WAV (universal), WebM/Opus, sometimes MP4/AAC (Safari).
  - Video: WebM (VP9/VP8 + Opus), sometimes MP4/H.264 (Safari, recent Chrome).
- MP3 encoding is not natively supported by browsers.
- Video processing is real-time (a 1-minute clip takes ~1 minute to trim/compress/convert).
- GIF output is limited to 256 colors per frame.

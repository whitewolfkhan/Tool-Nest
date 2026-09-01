import type { LucideIcon } from 'lucide-react'
import {
  FileText,
  Image as ImageIcon,
  Code2,
  Type,
  Calculator,
  Shield,
  Sparkles,
  Search,
  Wand2,
  Hash,
  Link2,
  Binary,
  Music,
  Video,
} from 'lucide-react'

export interface Tool {
  slug: string
  name: string
  description: string
  category: string
  keywords?: string[]
  popular?: boolean
  clientSide?: boolean
  icon?: string
}

export interface Category {
  id: string
  name: string
  description: string
  icon: LucideIcon
  color: string
  gradient: string
}

export const categories: Category[] = [
  {
    id: 'pdf',
    name: 'PDF Tools',
    description: 'Merge, split, compress, convert and edit PDF files',
    icon: FileText,
    color: 'text-rose-500',
    gradient: 'from-rose-500/20 to-orange-500/20',
  },
  {
    id: 'image',
    name: 'Image Tools',
    description: 'Convert, compress, resize and transform images',
    icon: ImageIcon,
    color: 'text-emerald-500',
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    id: 'text',
    name: 'Text Tools',
    description: 'Count, convert, format and transform text',
    icon: Type,
    color: 'text-amber-500',
    gradient: 'from-amber-500/20 to-yellow-500/20',
  },
  {
    id: 'developer',
    name: 'Developer Tools',
    description: 'JSON, Base64, UUID, hashing, regex and more',
    icon: Code2,
    color: 'text-violet-500',
    gradient: 'from-violet-500/20 to-fuchsia-500/20',
  },
  {
    id: 'converter',
    name: 'Converters',
    description: 'Units, colors, number bases and more',
    icon: Binary,
    color: 'text-cyan-500',
    gradient: 'from-cyan-500/20 to-sky-500/20',
  },
  {
    id: 'calculator',
    name: 'Calculators',
    description: 'BMI, age, percentage, EMI and more',
    icon: Calculator,
    color: 'text-pink-500',
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
  {
    id: 'seo',
    name: 'SEO & Web',
    description: 'Meta tags, OpenGraph, robots.txt and more',
    icon: Search,
    color: 'text-orange-500',
    gradient: 'from-orange-500/20 to-amber-500/20',
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Password, hashing, random generator and more',
    icon: Shield,
    color: 'text-red-500',
    gradient: 'from-red-500/20 to-rose-500/20',
  },
  {
    id: 'misc',
    name: 'Miscellaneous',
    description: 'QR codes, generators, and other handy tools',
    icon: Hash,
    color: 'text-lime-500',
    gradient: 'from-lime-500/20 to-green-500/20',
  },
  {
    id: 'audio',
    name: 'Audio Tools',
    description: 'Trim, cut, compress and convert audio files',
    icon: Music,
    color: 'text-fuchsia-500',
    gradient: 'from-fuchsia-500/20 to-pink-500/20',
  },
  {
    id: 'video',
    name: 'Video Tools',
    description: 'Trim, cut, compress and convert video files',
    icon: Video,
    color: 'text-teal-600',
    gradient: 'from-teal-500/20 to-cyan-500/20',
  },
  {
    id: 'ai',
    name: 'AI Tools',
    description: 'AI image generation, content writing and more',
    icon: Sparkles,
    color: 'text-purple-500',
    gradient: 'from-purple-500/20 to-violet-500/20',
  },
]

export const tools: Tool[] = [
  // ===== PDF =====
  { slug: 'pdf-merge', name: 'Merge PDF', description: 'Combine multiple PDF files into one', category: 'pdf', popular: true, clientSide: true, keywords: ['combine', 'join', 'pdf'] },
  { slug: 'pdf-split', name: 'Split PDF', description: 'Extract or split a PDF into multiple files', category: 'pdf', popular: true, clientSide: true, keywords: ['extract', 'divide', 'pdf'] },
  { slug: 'pdf-compress', name: 'Compress PDF', description: 'Reduce PDF file size', category: 'pdf', clientSide: true, keywords: ['optimize', 'shrink', 'pdf'] },
  { slug: 'pdf-rotate', name: 'Rotate PDF', description: 'Rotate PDF pages permanently', category: 'pdf', clientSide: true, keywords: ['turn', 'orientation', 'pdf'] },
  { slug: 'pdf-reorder', name: 'Reorder PDF Pages', description: 'Rearrange pages of a PDF', category: 'pdf', clientSide: true, keywords: ['organize', 'sort', 'pdf'] },
  { slug: 'pdf-delete-pages', name: 'Delete PDF Pages', description: 'Remove unwanted pages from a PDF', category: 'pdf', clientSide: true, keywords: ['remove', 'extract', 'pdf'] },
  { slug: 'pdf-watermark', name: 'Add Watermark to PDF', description: 'Stamp text or image watermark onto PDF', category: 'pdf', clientSide: true, keywords: ['stamp', 'logo', 'pdf'] },
  { slug: 'pdf-page-numbers', name: 'Add Page Numbers', description: 'Insert page numbers into PDF', category: 'pdf', clientSide: true, keywords: ['numbering', 'pages', 'pdf'] },
  { slug: 'pdf-protect', name: 'Protect PDF', description: 'Add password protection to PDF', category: 'pdf', clientSide: true, keywords: ['password', 'encrypt', 'pdf'] },
  { slug: 'image-to-pdf', name: 'Image to PDF', description: 'Convert JPG/PNG images into a PDF', category: 'pdf', popular: true, clientSide: true, keywords: ['jpg', 'png', 'convert'] },
  { slug: 'pdf-to-images', name: 'PDF to Images', description: 'Convert PDF pages to PNG or JPEG images', category: 'pdf', clientSide: true, keywords: ['pdf', 'image', 'png', 'jpg'] },

  // ===== IMAGE =====
  { slug: 'image-compress', name: 'Compress Image', description: 'Reduce image file size while keeping quality', category: 'image', popular: true, clientSide: true, keywords: ['optimize', 'shrink', 'jpg', 'png'] },
  { slug: 'image-resize', name: 'Resize Image', description: 'Change image dimensions', category: 'image', popular: true, clientSide: true, keywords: ['scale', 'dimensions', 'crop'] },
  { slug: 'image-convert', name: 'Convert Image Format', description: 'Convert between JPG, PNG, WebP, BMP', category: 'image', popular: true, clientSide: true, keywords: ['format', 'jpg', 'png', 'webp'] },
  { slug: 'image-crop', name: 'Crop Image', description: 'Crop image to specific size or aspect ratio', category: 'image', clientSide: true, keywords: ['cut', 'trim', 'aspect'] },
  { slug: 'image-rotate', name: 'Rotate Image', description: 'Rotate or flip image', category: 'image', clientSide: true, keywords: ['flip', 'mirror', 'turn'] },
  { slug: 'image-to-base64', name: 'Image to Base64', description: 'Convert image to Base64 string', category: 'image', clientSide: true, keywords: ['encode', 'data-uri'] },
  { slug: 'image-watermark', name: 'Add Image Watermark', description: 'Stamp text or logo onto image', category: 'image', clientSide: true, keywords: ['overlay', 'logo', 'stamp'] },
  { slug: 'image-metadata', name: 'Image EXIF Viewer', description: 'View EXIF metadata of images', category: 'image', clientSide: true, keywords: ['exif', 'metadata', 'camera'] },
  { slug: 'color-picker', name: 'Color Picker from Image', description: 'Pick colors from any image', category: 'image', clientSide: true, keywords: ['eyedropper', 'rgb', 'hex'] },
  { slug: 'image-color-palette', name: 'Image Color Palette', description: 'Extract dominant colors from image', category: 'image', clientSide: true, keywords: ['extract', 'palette', 'dominant'] },
  { slug: 'color-palette-generator', name: 'Color Palette Generator', description: 'Generate beautiful color palettes from a base color', category: 'image', popular: false, clientSide: true, keywords: ['color', 'palette', 'css', 'design'] },
  { slug: 'favicon-generator', name: 'Favicon Generator', description: 'Create favicons from text or image', category: 'image', clientSide: true, keywords: ['favicon', 'icon', 'website'] },
  { slug: 'base64-image-decoder', name: 'Base64 to Image', description: 'Decode Base64 string to image preview', category: 'image', clientSide: true, keywords: ['base64', 'image', 'decode'] },
  { slug: 'image-to-favicon-set', name: 'Favicon Set Generator', description: 'Generate a complete favicon set from one image', category: 'image', clientSide: true, keywords: ['favicon', 'icons', 'website', 'manifest'] },
  { slug: 'color-shade-generator', name: 'Color Shade Generator', description: 'Generate tints and shades of a color (50-950 scale)', category: 'image', clientSide: true, keywords: ['color', 'shade', 'tint', 'tailwind'] },
  { slug: 'image-collage-maker', name: 'Image Collage Maker', description: 'Combine multiple images into a collage', category: 'image', clientSide: true, keywords: ['collage', 'grid', 'combine', 'images'] },
  { slug: 'image-to-ascii', name: 'Image to ASCII Art', description: 'Convert an image to ASCII art text', category: 'image', clientSide: true, keywords: ['ascii', 'art', 'image', 'text'] },
  { slug: 'image-color-quantizer', name: 'Image Color Quantizer', description: 'Reduce the number of colors in an image', category: 'image', clientSide: true, keywords: ['quantize', 'posterize', 'colors', 'reduce'] },

  // ===== TEXT =====
  { slug: 'word-counter', name: 'Word Counter', description: 'Count words, characters, sentences, paragraphs', category: 'text', popular: true, clientSide: true, keywords: ['count', 'characters', 'length'] },
  { slug: 'case-converter', name: 'Case Converter', description: 'UPPER, lower, Title, Sentence, camelCase', category: 'text', popular: true, clientSide: true, keywords: ['uppercase', 'lowercase', 'title'] },
  { slug: 'lorem-ipsum', name: 'Lorem Ipsum Generator', description: 'Generate placeholder text', category: 'text', clientSide: true, keywords: ['placeholder', 'dummy', 'text'] },
  { slug: 'remove-duplicate-lines', name: 'Remove Duplicate Lines', description: 'Delete duplicate lines from text', category: 'text', clientSide: true, keywords: ['unique', 'dedupe', 'lines'] },
  { slug: 'sort-lines', name: 'Sort Lines', description: 'Sort text lines alphabetically', category: 'text', clientSide: true, keywords: ['order', 'alphabetical'] },
  { slug: 'find-replace', name: 'Find and Replace', description: 'Replace text with regex support', category: 'text', clientSide: true, keywords: ['substitute', 'regex'] },
  { slug: 'text-reverse', name: 'Reverse Text', description: 'Reverse characters, words or lines', category: 'text', clientSide: true, keywords: ['mirror', 'backwards'] },
  { slug: 'slug-generator', name: 'Slug Generator', description: 'Convert text into URL-friendly slug', category: 'text', clientSide: true, keywords: ['url', 'permalink'] },
  { slug: 'text-diff', name: 'Text Diff Checker', description: 'Compare two texts and highlight differences', category: 'text', clientSide: true, keywords: ['compare', 'difference'] },
  { slug: 'text-to-binary', name: 'Text to Binary', description: 'Convert text to binary and back', category: 'text', clientSide: true, keywords: ['binary', 'ascii', 'encode'] },
  { slug: 'text-to-morse', name: 'Text to Morse Code', description: 'Encode and decode Morse code', category: 'text', clientSide: true, keywords: ['morse', 'code'] },
  { slug: 'whitespace-remover', name: 'Whitespace Remover', description: 'Remove extra spaces and blank lines', category: 'text', clientSide: true, keywords: ['trim', 'clean'] },
  { slug: 'text-to-speech', name: 'Text to Speech', description: 'Convert text to spoken audio in your browser', category: 'text', clientSide: true, keywords: ['tts', 'audio', 'voice', 'speech'] },
  { slug: 'speech-to-text', name: 'Speech to Text', description: 'Transcribe your voice to text using Web Speech API', category: 'text', clientSide: true, keywords: ['stt', 'voice', 'transcribe', 'dictation'] },
  { slug: 'text-repeater', name: 'Text Repeater', description: 'Repeat text multiple times with separators', category: 'text', clientSide: true, keywords: ['repeat', 'duplicate', 'loop'] },
  { slug: 'word-frequency-counter', name: 'Word Frequency Counter', description: 'Count frequency of each word and visualize', category: 'text', clientSide: true, keywords: ['word', 'frequency', 'count', 'analyze'] },
  { slug: 'text-stats-analyzer', name: 'Text Stats Analyzer', description: 'Deep text statistics with readability scores', category: 'text', clientSide: true, keywords: ['text', 'stats', 'readability', 'flesch'] },

  // ===== DEVELOPER =====
  { slug: 'json-formatter', name: 'JSON Formatter', description: 'Format, validate and minify JSON', category: 'developer', popular: true, clientSide: true, keywords: ['beautify', 'validate', 'parse'] },
  { slug: 'base64-encode-decode', name: 'Base64 Encode/Decode', description: 'Encode or decode Base64 text', category: 'developer', popular: true, clientSide: true, keywords: ['base64', 'encode', 'decode'] },
  { slug: 'uuid-generator', name: 'UUID Generator', description: 'Generate v4 UUIDs', category: 'developer', popular: true, clientSide: true, keywords: ['guid', 'unique', 'id'] },
  { slug: 'hash-generator', name: 'Hash Generator', description: 'MD5, SHA-1, SHA-256, SHA-512', category: 'developer', clientSide: true, keywords: ['md5', 'sha', 'checksum'] },
  { slug: 'url-encode-decode', name: 'URL Encode/Decode', description: 'Encode or decode URL components', category: 'developer', clientSide: true, keywords: ['percent', 'encoding'] },
  { slug: 'jwt-decoder', name: 'JWT Decoder', description: 'Decode JSON Web Tokens', category: 'developer', clientSide: true, keywords: ['token', 'auth'] },
  { slug: 'password-generator', name: 'Password Generator', description: 'Generate strong random passwords', category: 'developer', popular: true, clientSide: true, keywords: ['random', 'secure'] },
  { slug: 'html-encode-decode', name: 'HTML Entity Encode/Decode', description: 'Convert HTML special characters', category: 'developer', clientSide: true, keywords: ['entities', 'escape'] },
  { slug: 'markdown-preview', name: 'Markdown Preview', description: 'Live preview Markdown as HTML', category: 'developer', clientSide: true, keywords: ['md', 'render'] },
  { slug: 'regex-tester', name: 'Regex Tester', description: 'Test JavaScript regular expressions', category: 'developer', clientSide: true, keywords: ['regexp', 'pattern'] },
  { slug: 'css-minifier', name: 'CSS Minifier', description: 'Minify CSS code', category: 'developer', clientSide: true, keywords: ['compress', 'optimize'] },
  { slug: 'js-minifier', name: 'JavaScript Minifier', description: 'Minify JavaScript code', category: 'developer', clientSide: true, keywords: ['compress', 'minify'] },
  { slug: 'html-formatter', name: 'HTML Formatter', description: 'Beautify HTML code', category: 'developer', clientSide: true, keywords: ['prettify', 'beautify'] },
  { slug: 'timestamp-converter', name: 'Timestamp Converter', description: 'Convert Unix timestamp to date', category: 'developer', clientSide: true, keywords: ['unix', 'epoch', 'time'] },
  { slug: 'json-to-csv', name: 'JSON to CSV Converter', description: 'Convert JSON to CSV and back', category: 'developer', popular: false, clientSide: true, keywords: ['json', 'csv', 'convert'] },
  { slug: 'yaml-json-converter', name: 'YAML ↔ JSON Converter', description: 'Convert between YAML and JSON formats', category: 'developer', clientSide: true, keywords: ['yaml', 'json', 'convert', 'config'] },
  { slug: 'markdown-to-html', name: 'Markdown to HTML', description: 'Convert Markdown to standalone HTML', category: 'developer', clientSide: true, keywords: ['markdown', 'html', 'convert'] },
  { slug: 'markdown-to-pdf', name: 'Markdown to PDF', description: 'Convert Markdown to a beautifully formatted PDF', category: 'developer', popular: true, clientSide: true, keywords: ['markdown', 'pdf', 'convert', 'print'] },
  { slug: 'csv-viewer', name: 'CSV Viewer', description: 'View, sort and filter CSV data as a table', category: 'developer', clientSide: true, keywords: ['csv', 'table', 'data', 'sort'] },
  { slug: 'css-gradient-generator', name: 'CSS Gradient Generator', description: 'Visual tool to create CSS gradients', category: 'developer', clientSide: true, keywords: ['css', 'gradient', 'design', 'background'] },
  { slug: 'box-shadow-generator', name: 'Box Shadow Generator', description: 'Visual tool to create CSS box shadows', category: 'developer', clientSide: true, keywords: ['css', 'box-shadow', 'design', 'shadow'] },
  { slug: 'csv-to-json', name: 'CSV to JSON', description: 'Convert CSV data to JSON array with delimiter detection', category: 'developer', clientSide: true, keywords: ['csv', 'json', 'convert', 'parse'] },
  { slug: 'text-escape-unescape', name: 'Text Escape / Unescape', description: 'Escape and unescape text for HTML, URL, JSON, SQL, regex, shell', category: 'developer', clientSide: true, keywords: ['escape', 'unescape', 'html', 'sql', 'regex'] },
  { slug: 'base64-to-file', name: 'Base64 to File', description: 'Decode Base64 string back to a downloadable file', category: 'developer', clientSide: true, keywords: ['base64', 'decode', 'file', 'binary'] },
  { slug: 'css-flexbox-playground', name: 'CSS Flexbox Playground', description: 'Interactive flexbox layout builder', category: 'developer', clientSide: true, keywords: ['css', 'flexbox', 'layout', 'playground'] },
  { slug: 'border-radius-generator', name: 'Border Radius Generator', description: 'Visual CSS border-radius generator', category: 'developer', clientSide: true, keywords: ['css', 'border-radius', 'rounded', 'corners'] },
  { slug: 'color-contrast-checker', name: 'Color Contrast Checker', description: 'Check WCAG contrast ratio between two colors', category: 'developer', clientSide: true, keywords: ['contrast', 'wcag', 'accessibility', 'color'] },
  { slug: 'markdown-table-generator', name: 'Markdown Table Generator', description: 'Build markdown tables visually', category: 'developer', clientSide: true, keywords: ['markdown', 'table', 'grid'] },
  { slug: 'html-to-markdown', name: 'HTML to Markdown', description: 'Convert HTML to Markdown format', category: 'developer', clientSide: true, keywords: ['html', 'markdown', 'convert'] },

  // ===== CONVERTER =====
  { slug: 'unit-converter', name: 'Unit Converter', description: 'Length, weight, temperature, volume', category: 'converter', popular: true, clientSide: false, keywords: ['metric', 'imperial'] },
  { slug: 'currency-converter', name: 'Currency Converter', description: 'Convert 130+ world currencies with live exchange rates', category: 'converter', popular: true, clientSide: false, keywords: ['currency', 'exchange', 'money', 'forex', 'usd', 'eur'] },
  { slug: 'number-base-converter', name: 'Number Base Converter', description: 'Convert binary, decimal, octal, hex', category: 'converter', clientSide: true, keywords: ['binary', 'hex', 'decimal'] },
  { slug: 'color-converter', name: 'Color Converter', description: 'HEX, RGB, HSL, CMYK conversion', category: 'converter', popular: true, clientSide: true, keywords: ['color', 'palette'] },
  { slug: 'roman-numeral-converter', name: 'Roman Numeral Converter', description: 'Convert numbers to Roman numerals', category: 'converter', clientSide: true, keywords: ['roman', 'numeral'] },
  { slug: 'temperature-converter', name: 'Temperature Converter', description: 'Celsius, Fahrenheit, Kelvin', category: 'converter', clientSide: true, keywords: ['celsius', 'fahrenheit'] },
  { slug: 'data-storage-converter', name: 'Data Storage Converter', description: 'Bytes, KB, MB, GB, TB', category: 'converter', clientSide: true, keywords: ['bytes', 'storage'] },
  { slug: 'time-converter', name: 'Time Unit Converter', description: 'Seconds, minutes, hours, days', category: 'converter', clientSide: true, keywords: ['time', 'duration'] },
  { slug: 'angle-converter', name: 'Angle Converter', description: 'Degrees, radians, gradians', category: 'converter', clientSide: true, keywords: ['degree', 'radian'] },

  // ===== CALCULATOR =====
  { slug: 'bmi-calculator', name: 'BMI Calculator', description: 'Calculate Body Mass Index', category: 'calculator', popular: true, clientSide: true, keywords: ['health', 'weight', 'height'] },
  { slug: 'age-calculator', name: 'Age Calculator', description: 'Calculate age from birthday', category: 'calculator', popular: true, clientSide: true, keywords: ['years', 'birthday'] },
  { slug: 'percentage-calculator', name: 'Percentage Calculator', description: 'Percent of, increase, decrease', category: 'calculator', clientSide: true, keywords: ['percent'] },
  { slug: 'loan-emi-calculator', name: 'Loan EMI Calculator', description: 'Calculate monthly loan payments', category: 'calculator', clientSide: true, keywords: ['mortgage', 'interest'] },
  { slug: 'date-difference-calculator', name: 'Date Difference', description: 'Days, months, years between dates', category: 'calculator', clientSide: true, keywords: ['duration', 'between'] },
  { slug: 'compound-interest-calculator', name: 'Compound Interest', description: 'Calculate compound interest over time', category: 'calculator', clientSide: true, keywords: ['investment', 'savings'] },
  { slug: 'tip-calculator', name: 'Tip Calculator', description: 'Calculate tip and split bill', category: 'calculator', clientSide: true, keywords: ['restaurant', 'bill'] },
  { slug: 'gpa-calculator', name: 'GPA Calculator', description: 'Calculate grade point average', category: 'calculator', clientSide: true, keywords: ['grade', 'academic'] },
  { slug: 'scientific-calculator', name: 'Scientific Calculator', description: 'Advanced scientific calculations', category: 'calculator', clientSide: true, keywords: ['math', 'trig'] },

  // ===== SEO =====
  { slug: 'meta-tag-generator', name: 'Meta Tag Generator', description: 'Generate HTML meta tags for SEO', category: 'seo', clientSide: true, keywords: ['seo', 'html', 'meta'] },
  { slug: 'open-graph-generator', name: 'Open Graph Generator', description: 'Generate OG tags for social sharing', category: 'seo', clientSide: true, keywords: ['og', 'social', 'facebook'] },
  { slug: 'robots-txt-generator', name: 'Robots.txt Generator', description: 'Generate robots.txt for websites', category: 'seo', clientSide: true, keywords: ['crawler', 'spider'] },
  { slug: 'sitemap-generator', name: 'Sitemap Generator', description: 'Create XML sitemap from URLs', category: 'seo', clientSide: true, keywords: ['xml', 'google'] },
  { slug: 'keyword-density', name: 'Keyword Density Checker', description: 'Analyze keyword frequency in text', category: 'seo', clientSide: true, keywords: ['analyze', 'content'] },
  { slug: 'slug-url-generator', name: 'URL Slug Generator', description: 'Create SEO-friendly URL slugs', category: 'seo', clientSide: true, keywords: ['url', 'permalink'] },
  { slug: 'http-status-codes', name: 'HTTP Status Codes', description: 'Reference for HTTP status codes', category: 'seo', clientSide: true, keywords: ['reference', 'codes'] },

  // ===== SECURITY =====
  { slug: 'password-strength-checker', name: 'Password Strength Checker', description: 'Test how strong a password is', category: 'security', clientSide: true, keywords: ['strength', 'secure'] },
  { slug: 'random-string-generator', name: 'Random String Generator', description: 'Generate random strings', category: 'security', clientSide: true, keywords: ['random', 'token'] },
  { slug: 'credit-card-validator', name: 'Credit Card Validator', description: 'Validate card numbers with Luhn', category: 'security', clientSide: true, keywords: ['luhn', 'card'] },
  { slug: 'mac-address-lookup', name: 'MAC Address Lookup', description: 'Find vendor from MAC address', category: 'security', clientSide: true, keywords: ['vendor', 'network'] },
  { slug: 'hash-identifier', name: 'Hash Identifier', description: 'Identify hash types from a hash string', category: 'security', clientSide: true, keywords: ['hash', 'identify', 'md5', 'sha'] },
  { slug: 'password-strength-analyzer', name: 'Password Strength Analyzer', description: 'Deep analysis of password strength and crack time', category: 'security', clientSide: true, keywords: ['password', 'strength', 'entropy', 'crack'] },

  // ===== MISC =====
  { slug: 'qr-code-generator', name: 'QR Code Generator', description: 'Create QR codes for URLs, text, Wi-Fi', category: 'misc', popular: true, clientSide: true, keywords: ['barcode', 'qr'] },
  { slug: 'barcode-generator', name: 'Barcode Generator', description: 'Generate various barcode types', category: 'misc', clientSide: true, keywords: ['barcode', 'code128'] },
  { slug: 'emoji-keyboard', name: 'Emoji Picker', description: 'Browse and copy emojis', category: 'misc', clientSide: true, keywords: ['emoji', 'copy'] },
  { slug: 'dice-roller', name: 'Dice Roller', description: 'Roll virtual dice', category: 'misc', clientSide: true, keywords: ['random', 'game'] },
  { slug: 'coin-flip', name: 'Coin Flip', description: 'Flip a virtual coin', category: 'misc', clientSide: true, keywords: ['heads', 'tails'] },
  { slug: 'random-number-generator', name: 'Random Number', description: 'Generate random numbers in a range', category: 'misc', clientSide: true, keywords: ['rng', 'number'] },
  { slug: 'pomodoro-timer', name: 'Pomodoro Timer', description: 'Productivity timer with breaks', category: 'misc', clientSide: true, keywords: ['focus', 'timer'] },
  { slug: 'stopwatch', name: 'Stopwatch', description: 'Online stopwatch with laps', category: 'misc', clientSide: true, keywords: ['timer', 'count'] },
  { slug: 'qr-code-reader', name: 'QR Code Reader', description: 'Decode QR codes from images or camera', category: 'misc', clientSide: true, keywords: ['qr', 'decode', 'scan', 'barcode'] },
  { slug: 'invoice-generator', name: 'Invoice Generator', description: 'Create and print simple invoices', category: 'misc', clientSide: true, keywords: ['invoice', 'billing', 'pdf', 'business'] },

  // ===== AUDIO =====
  { slug: 'audio-trimmer', name: 'Audio Trimmer', description: 'Cut and trim audio files by start and end time', category: 'audio', popular: true, clientSide: true, keywords: ['audio', 'trim', 'cut', 'mp3', 'wav'] },
  { slug: 'audio-compressor', name: 'Audio Compressor', description: 'Reduce audio file size by lowering bitrate', category: 'audio', popular: true, clientSide: true, keywords: ['audio', 'compress', 'reduce', 'mp3'] },
  { slug: 'audio-converter', name: 'Audio Converter', description: 'Convert audio between MP3, WAV, OGG formats', category: 'audio', clientSide: true, keywords: ['audio', 'convert', 'mp3', 'wav', 'ogg'] },
  { slug: 'audio-volume-booster', name: 'Audio Volume Booster', description: 'Increase or decrease audio volume', category: 'audio', clientSide: true, keywords: ['audio', 'volume', 'boost', 'amplify'] },
  { slug: 'audio-merger', name: 'Audio Merger', description: 'Combine multiple audio files into one', category: 'audio', clientSide: true, keywords: ['audio', 'merge', 'join', 'combine'] },
  { slug: 'audio-recorder', name: 'Audio Recorder', description: 'Record audio from your microphone', category: 'audio', clientSide: true, keywords: ['audio', 'record', 'microphone', 'voice'] },

  // ===== VIDEO =====
  { slug: 'video-trimmer', name: 'Video Trimmer', description: 'Cut and trim video by start and end time', category: 'video', popular: true, clientSide: true, keywords: ['video', 'trim', 'cut', 'mp4'] },
  { slug: 'video-compressor', name: 'Video Compressor', description: 'Reduce video file size by lowering resolution', category: 'video', popular: true, clientSide: true, keywords: ['video', 'compress', 'reduce', 'mp4'] },
  { slug: 'video-converter', name: 'Video Converter', description: 'Convert video to MP4 or WebM format', category: 'video', clientSide: true, keywords: ['video', 'convert', 'mp4', 'webm'] },
  { slug: 'video-to-gif', name: 'Video to GIF', description: 'Convert video clips to animated GIF', category: 'video', clientSide: true, keywords: ['video', 'gif', 'convert', 'animated'] },
  { slug: 'video-frame-extractor', name: 'Video Frame Extractor', description: 'Extract frames from a video as images', category: 'video', clientSide: true, keywords: ['video', 'frame', 'extract', 'image'] },
  { slug: 'video-resizer', name: 'Video Resizer', description: 'Resize video to custom dimensions', category: 'video', clientSide: true, keywords: ['video', 'resize', 'scale', 'dimensions'] },

  // ===== AI =====
  { slug: 'ai-image-generator', name: 'AI Image Generator', description: 'Generate images from text prompts', category: 'ai', popular: true, clientSide: false, keywords: ['ai', 'generate', 'dalle'] },
  { slug: 'ai-content-writer', name: 'AI Content Writer', description: 'Write articles, emails, descriptions', category: 'ai', popular: true, clientSide: false, keywords: ['ai', 'write', 'content'] },
  { slug: 'ai-image-describer', name: 'AI Image Describer', description: 'Get detailed text description of images', category: 'ai', clientSide: false, keywords: ['vlm', 'vision', 'caption'] },
  { slug: 'ai-chat-assistant', name: 'AI Chat Assistant', description: 'Chat with AI assistant', category: 'ai', popular: true, clientSide: false, keywords: ['chat', 'assistant'] },
  { slug: 'ai-summarizer', name: 'AI Text Summarizer', description: 'Summarize long text into key points', category: 'ai', clientSide: false, keywords: ['summarize', 'tl;dr'] },
  { slug: 'ai-translator', name: 'AI Translator', description: 'Translate text between languages', category: 'ai', clientSide: false, keywords: ['translate', 'language'] },
  { slug: 'image-ocr', name: 'Image OCR (Text Extractor)', description: 'Extract text from images using AI', category: 'ai', popular: false, clientSide: false, keywords: ['ocr', 'text', 'extract', 'vision'] },
]

// Helper functions
export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug)
}

export function getToolsByCategory(categoryId: string): Tool[] {
  return tools.filter((t) => t.category === categoryId)
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id)
}

export function getPopularTools(): Tool[] {
  return tools.filter((t) => t.popular)
}

export function searchTools(query: string): Tool[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return tools
    .map((t) => {
      let score = 0
      if (t.name.toLowerCase().includes(q)) score += 10
      if (t.name.toLowerCase().startsWith(q)) score += 5
      if (t.description.toLowerCase().includes(q)) score += 3
      if (t.keywords?.some((k) => k.toLowerCase().includes(q))) score += 4
      if (t.slug.includes(q)) score += 2
      return { t, score }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.t)
}

export const totalToolsCount = tools.length
export const totalCategoriesCount = categories.length

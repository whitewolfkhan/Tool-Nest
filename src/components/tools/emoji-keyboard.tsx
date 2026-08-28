'use client'

import * as React from 'react'
import { Search, Copy, Check, History, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'

type Category =
  | 'smileys'
  | 'gestures'
  | 'animals'
  | 'food'
  | 'activities'
  | 'travel'
  | 'objects'
  | 'symbols'
  | 'flags'

interface Emoji {
  char: string
  name: string
}

const EMOJIS: Record<Category, Emoji[]> = {
  smileys: [
    { char: '😀', name: 'grinning' },
    { char: '😁', name: 'grin' },
    { char: '😂', name: 'joy' },
    { char: '🤣', name: 'rofl' },
    { char: '😃', name: 'smiley' },
    { char: '😄', name: 'smile' },
    { char: '😅', name: 'sweat smile' },
    { char: '😆', name: 'laughing' },
    { char: '😉', name: 'wink' },
    { char: '😊', name: 'blush' },
    { char: '😋', name: 'yum' },
    { char: '😎', name: 'cool' },
    { char: '😍', name: 'heart eyes' },
    { char: '😘', name: 'kissing heart' },
    { char: '🤗', name: 'hugging' },
    { char: '🤔', name: 'thinking' },
    { char: '😐', name: 'neutral' },
    { char: '😑', name: 'expressionless' },
    { char: '😶', name: 'no mouth' },
    { char: '🙄', name: 'eye roll' },
    { char: '😏', name: 'smirk' },
    { char: '😪', name: 'sleepy' },
    { char: '😴', name: 'sleep' },
    { char: '😷', name: 'mask' },
    { char: '🤒', name: 'thermometer' },
    { char: '🤕', name: 'bandage' },
    { char: '🤢', name: 'nauseated' },
    { char: '🤮', name: 'vomit' },
    { char: '😇', name: 'angel' },
    { char: '🥳', name: 'party face' },
    { char: '😭', name: 'sob' },
    { char: '😢', name: 'cry' },
    { char: '😡', name: 'angry' },
    { char: '🤬', name: 'cursing' },
    { char: '😱', name: 'scream' },
    { char: '😨', name: 'fearful' },
    { char: '😰', name: 'anxious' },
    { char: '🥺', name: 'pleading' },
    { char: '😎', name: 'cool' },
  ],
  gestures: [
    { char: '👍', name: 'thumbs up' },
    { char: '👎', name: 'thumbs down' },
    { char: '👌', name: 'ok' },
    { char: '🤌', name: 'pinched fingers' },
    { char: '✌️', name: 'peace' },
    { char: '🤞', name: 'fingers crossed' },
    { char: '🤟', name: 'love you' },
    { char: '🤘', name: 'rock on' },
    { char: '🤙', name: 'call me' },
    { char: '👈', name: 'point left' },
    { char: '👉', name: 'point right' },
    { char: '👆', name: 'point up' },
    { char: '👇', name: 'point down' },
    { char: '☝️', name: 'index up' },
    { char: '👋', name: 'wave' },
    { char: '🤚', name: 'raised back' },
    { char: '🖐️', name: 'spread fingers' },
    { char: '✋', name: 'stop' },
    { char: ' clap', name: 'clap' },
    { char: '👏', name: 'clap' },
    { char: '🙌', name: 'raised hands' },
    { char: '👐', name: 'open hands' },
    { char: '🤲', name: 'palms together' },
    { char: '🤝', name: 'handshake' },
    { char: '🙏', name: 'pray' },
    { char: '✍️', name: 'writing' },
    { char: '💪', name: 'flex' },
    { char: '🦾', name: 'mechanical arm' },
    { char: '🫶', name: 'heart hands' },
  ],
  animals: [
    { char: '🐶', name: 'dog' },
    { char: '🐱', name: 'cat' },
    { char: '🐭', name: 'mouse' },
    { char: '🐹', name: 'hamster' },
    { char: '🐰', name: 'rabbit' },
    { char: '🦊', name: 'fox' },
    { char: '🐻', name: 'bear' },
    { char: '🐼', name: 'panda' },
    { char: '🐨', name: 'koala' },
    { char: '🐯', name: 'tiger' },
    { char: '🦁', name: 'lion' },
    { char: '🐮', name: 'cow' },
    { char: '🐷', name: 'pig' },
    { char: '🐸', name: 'frog' },
    { char: '🐵', name: 'monkey' },
    { char: '🐔', name: 'chicken' },
    { char: '🐧', name: 'penguin' },
    { char: '🐦', name: 'bird' },
    { char: '🦆', name: 'duck' },
    { char: '🦉', name: 'owl' },
    { char: '🦇', name: 'bat' },
    { char: '🐺', name: 'wolf' },
    { char: '🐗', name: 'boar' },
    { char: '🐴', name: 'horse' },
    { char: '🦄', name: 'unicorn' },
    { char: '🐝', name: 'bee' },
    { char: '🐛', name: 'bug' },
    { char: '🦋', name: 'butterfly' },
    { char: '🐢', name: 'turtle' },
    { char: '🐙', name: 'octopus' },
    { char: '🐬', name: 'dolphin' },
    { char: '🐳', name: 'whale' },
  ],
  food: [
    { char: '🍏', name: 'green apple' },
    { char: '🍎', name: 'red apple' },
    { char: '🍐', name: 'pear' },
    { char: '🍊', name: 'orange' },
    { char: '🍋', name: 'lemon' },
    { char: '🍌', name: 'banana' },
    { char: '🍉', name: 'watermelon' },
    { char: '🍇', name: 'grapes' },
    { char: '🍓', name: 'strawberry' },
    { char: '🫐', name: 'blueberry' },
    { char: '🥝', name: 'kiwi' },
    { char: '🍅', name: 'tomato' },
    { char: '🥑', name: 'avocado' },
    { char: '🌽', name: 'corn' },
    { char: '🥕', name: 'carrot' },
    { char: '🍞', name: 'bread' },
    { char: '🥐', name: 'croissant' },
    { char: '🧀', name: 'cheese' },
    { char: '🍔', name: 'burger' },
    { char: '🍟', name: 'fries' },
    { char: '🍕', name: 'pizza' },
    { char: '🌭', name: 'hotdog' },
    { char: '🥪', name: 'sandwich' },
    { char: '🌮', name: 'taco' },
    { char: '🍣', name: 'sushi' },
    { char: '🍩', name: 'donut' },
    { char: '🍪', name: 'cookie' },
    { char: '🍫', name: 'chocolate' },
    { char: '🍭', name: 'lollipop' },
    { char: '☕', name: 'coffee' },
    { char: '🍺', name: 'beer' },
    { char: '🍷', name: 'wine' },
  ],
  activities: [
    { char: '⚽', name: 'soccer' },
    { char: '🏀', name: 'basketball' },
    { char: '🏈', name: 'football' },
    { char: '⚾', name: 'baseball' },
    { char: '🎾', name: 'tennis' },
    { char: '🏐', name: 'volleyball' },
    { char: '🎱', name: 'pool' },
    { char: '🏓', name: 'ping pong' },
    { char: '🏸', name: 'badminton' },
    { char: '🥊', name: 'boxing' },
    { char: '⛳', name: 'golf' },
    { char: '🎯', name: 'dart' },
    { char: '🎮', name: 'gaming' },
    { char: '🎲', name: 'dice' },
    { char: '🎰', name: 'slots' },
    { char: '🎳', name: 'bowling' },
    { char: '🎨', name: 'art' },
    { char: '🎭', name: 'theatre' },
    { char: '🎤', name: 'mic' },
    { char: '🎧', name: 'headphones' },
    { char: '🎼', name: 'music' },
    { char: '🎹', name: 'piano' },
    { char: '🥁', name: 'drums' },
    { char: '🎸', name: 'guitar' },
    { char: '🎺', name: 'trumpet' },
    { char: '🎻', name: 'violin' },
    { char: '🏆', name: 'trophy' },
    { char: '🥇', name: 'gold' },
    { char: '🥈', name: 'silver' },
    { char: '🥉', name: 'bronze' },
  ],
  travel: [
    { char: '🚗', name: 'car' },
    { char: '🚕', name: 'taxi' },
    { char: '🚙', name: 'suv' },
    { char: '🚌', name: 'bus' },
    { char: '🚎', name: 'trolleybus' },
    { char: '🏎️', name: 'race car' },
    { char: '🚓', name: 'police car' },
    { char: '🚑', name: 'ambulance' },
    { char: '🚒', name: 'fire truck' },
    { char: '🚐', name: 'minibus' },
    { char: '🚚', name: 'truck' },
    { char: '🚜', name: 'tractor' },
    { char: '🏍️', name: 'motorcycle' },
    { char: '🚲', name: 'bike' },
    { char: '🛴', name: 'scooter' },
    { char: '✈️', name: 'airplane' },
    { char: '🚀', name: 'rocket' },
    { char: '🛸', name: 'ufo' },
    { char: '🚁', name: 'helicopter' },
    { char: '⛵', name: 'sailboat' },
    { char: '🚤', name: 'speedboat' },
    { char: '🛳️', name: 'passenger ship' },
    { char: '🚂', name: 'train' },
    { char: '🚆', name: 'bullet train' },
    { char: '🚊', name: 'tram' },
    { char: '🚇', name: 'metro' },
    { char: '🗺️', name: 'map' },
    { char: '🗽', name: 'statue liberty' },
    { char: '🏰', name: 'castle' },
    { char: '🏝️', name: 'island' },
  ],
  objects: [
    { char: '⌚', name: 'watch' },
    { char: '📱', name: 'phone' },
    { char: '💻', name: 'laptop' },
    { char: '⌨️', name: 'keyboard' },
    { char: '🖥️', name: 'desktop' },
    { char: '🖱️', name: 'mouse' },
    { char: '🖨️', name: 'printer' },
    { char: '📷', name: 'camera' },
    { char: '📺', name: 'tv' },
    { char: '📻', name: 'radio' },
    { char: '🔋', name: 'battery' },
    { char: '💡', name: 'bulb' },
    { char: '🔦', name: 'flashlight' },
    { char: '📚', name: 'books' },
    { char: '✏️', name: 'pencil' },
    { char: '📝', name: 'memo' },
    { char: '📌', name: 'pushpin' },
    { char: '📎', name: 'paperclip' },
    { char: '✂️', name: 'scissors' },
    { char: '🔑', name: 'key' },
    { char: '🔒', name: 'lock' },
    { char: '🔓', name: 'unlock' },
    { char: '🔔', name: 'bell' },
    { char: '🎁', name: 'gift' },
    { char: '💰', name: 'money bag' },
    { char: '💳', name: 'card' },
    { char: '💎', name: 'gem' },
    { char: '🔨', name: 'hammer' },
    { char: '🔧', name: 'wrench' },
    { char: '🧲', name: 'magnet' },
  ],
  symbols: [
    { char: '❤️', name: 'heart' },
    { char: '🧡', name: 'orange heart' },
    { char: '💛', name: 'yellow heart' },
    { char: '💚', name: 'green heart' },
    { char: '💙', name: 'blue heart' },
    { char: '💜', name: 'purple heart' },
    { char: '🖤', name: 'black heart' },
    { char: '🤍', name: 'white heart' },
    { char: '💔', name: 'broken heart' },
    { char: '❣️', name: 'heart exclamation' },
    { char: '💕', name: 'two hearts' },
    { char: '💞', name: 'revolving hearts' },
    { char: '💓', name: 'beating heart' },
    { char: '✨', name: 'sparkles' },
    { char: '⭐', name: 'star' },
    { char: '🌟', name: 'glowing star' },
    { char: '⚡', name: 'lightning' },
    { char: '🔥', name: 'fire' },
    { char: '💥', name: 'explosion' },
    { char: '☀️', name: 'sun' },
    { char: '🌙', name: 'moon' },
    { char: '🌈', name: 'rainbow' },
    { char: '☁️', name: 'cloud' },
    { char: '❄️', name: 'snowflake' },
    { char: '💧', name: 'droplet' },
    { char: '✅', name: 'check' },
    { char: '❌', name: 'cross' },
    { char: '❓', name: 'question' },
    { char: '❗', name: 'exclamation' },
    { char: '⚠️', name: 'warning' },
    { char: '♻️', name: 'recycle' },
    { char: '💯', name: '100' },
    { char: '🔔', name: 'bell' },
    { char: '🔕', name: 'no bell' },
  ],
  flags: [
    { char: '🇺🇸', name: 'usa' },
    { char: '🇬🇧', name: 'uk' },
    { char: '🇨🇦', name: 'canada' },
    { char: '🇦🇺', name: 'australia' },
    { char: '🇳🇿', name: 'new zealand' },
    { char: '🇮🇪', name: 'ireland' },
    { char: '🇩🇪', name: 'germany' },
    { char: '🇫🇷', name: 'france' },
    { char: '🇮🇹', name: 'italy' },
    { char: '🇪🇸', name: 'spain' },
    { char: '🇵🇹', name: 'portugal' },
    { char: '🇳🇱', name: 'netherlands' },
    { char: '🇧🇪', name: 'belgium' },
    { char: '🇨🇭', name: 'switzerland' },
    { char: '🇦🇹', name: 'austria' },
    { char: '🇸🇪', name: 'sweden' },
    { char: '🇳🇴', name: 'norway' },
    { char: '🇩🇰', name: 'denmark' },
    { char: '🇫🇮', name: 'finland' },
    { char: '🇮🇸', name: 'iceland' },
    { char: '🇵🇱', name: 'poland' },
    { char: '🇷🇺', name: 'russia' },
    { char: '🇺🇦', name: 'ukraine' },
    { char: '🇨🇳', name: 'china' },
    { char: '🇯🇵', name: 'japan' },
    { char: '🇰🇷', name: 'korea' },
    { char: '🇮🇳', name: 'india' },
    { char: '🇧🇷', name: 'brazil' },
    { char: '🇲🇽', name: 'mexico' },
    { char: '🇿🇦', name: 'south africa' },
  ],
}

const CATEGORY_LABELS: Record<Category, string> = {
  smileys: 'Smileys',
  gestures: 'Gestures',
  animals: 'Animals',
  food: 'Food',
  activities: 'Activities',
  travel: 'Travel',
  objects: 'Objects',
  symbols: 'Symbols',
  flags: 'Flags',
}

const ALL_EMOJIS: Emoji[] = (Object.keys(EMOJIS) as Category[]).flatMap(
  (cat) => EMOJIS[cat]
)

const STORAGE_KEY = 'toolnest-emoji-recent'
const MAX_RECENT = 24

export default function EmojiKeyboard() {
  const [query, setQuery] = React.useState('')
  const [recent, setRecent] = React.useState<string[]>([])
  const [copied, setCopied] = React.useState<string | null>(null)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setRecent(JSON.parse(raw))
    } catch {
      /* ignore */
    }
  }, [])

  const copyEmoji = async (char: string) => {
    try {
      await navigator.clipboard.writeText(char)
      toast.success(`Copied ${char}`)
      setCopied(char)
      setTimeout(() => setCopied(null), 1500)
      const next = [char, ...recent.filter((c) => c !== char)].slice(
        0,
        MAX_RECENT
      )
      setRecent(next)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
    } catch {
      toast.error('Failed to copy')
    }
  }

  const clearRecent = () => {
    setRecent([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return ALL_EMOJIS.filter((e) => e.name.includes(q))
  }, [query])

  const renderGrid = (items: Emoji[]) => (
    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
      {items.map((e, i) => (
        <button
          key={e.char + i}
          type="button"
          onClick={() => copyEmoji(e.char)}
          title={e.name}
          aria-label={e.name}
          className="aspect-square flex items-center justify-center text-2xl rounded-md hover:bg-accent hover:scale-110 transition-all"
        >
          {e.char}
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-2">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Search emojis</h2>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name (heart, cat, rocket…)"
        />
        {filtered && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground mt-3 text-center py-6">
            No emojis match “{query}”.
          </p>
        )}
        {filtered && filtered.length > 0 && (
          <div className="mt-4">
            <Badge variant="secondary" className="mb-2">
              {filtered.length} results
            </Badge>
            {renderGrid(filtered)}
          </div>
        )}
      </ToolCardWrapper>

      {recent.length > 0 && (
        <ToolCardWrapper>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">Recently used</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRecent}
              className="gap-1.5 text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          </div>
          {renderGrid(recent.map((c) => ({ char: c, name: c })))}
        </ToolCardWrapper>
      )}

      <ToolCardWrapper>
        <Tabs defaultValue="smileys">
          <TabsList className="mb-3 flex flex-wrap h-auto">
            {(Object.keys(EMOJIS) as Category[]).map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </TabsTrigger>
            ))}
          </TabsList>
          {(Object.keys(EMOJIS) as Category[]).map((cat) => (
            <TabsContent key={cat} value={cat}>
              {renderGrid(EMOJIS[cat])}
            </TabsContent>
          ))}
        </Tabs>
      </ToolCardWrapper>

      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-foreground text-background px-4 py-2 text-sm shadow-lg flex items-center gap-2">
          <Check className="h-4 w-4" />
          Copied <span className="text-xl">{copied}</span>
        </div>
      )}
    </div>
  )
}

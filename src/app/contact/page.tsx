import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Mail,
  Phone,
  Facebook,
  Instagram,
  BookOpen,
  Clock,
  MessageSquare,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact — ToolNest',
  description:
    'Get in touch with the ToolNest team: email, phone, social media, and blog. Bug reports, tool requests, and feedback are all welcome.',
}

const channels = [
  {
    icon: Mail,
    label: 'Email',
    value: 'meheercsecu@gmail.com',
    href: 'mailto:meheercsecu@gmail.com?subject=ToolNest%20feedback',
    hint: 'Best for bug reports and tool requests',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+880 1863 707643',
    href: 'tel:+8801863707643',
    hint: 'Available during reasonable hours (GMT+6)',
  },
  {
    icon: Facebook,
    label: 'Facebook',
    value: 'Meheer Ali Khan',
    href: 'https://www.facebook.com/meheerali.khan.1',
    hint: 'Follow for updates and announcements',
  },
  {
    icon: Instagram,
    label: 'Instagram',
    value: '@___necessary_evil',
    href: 'https://www.instagram.com/___necessary_evil/',
    hint: 'Behind-the-scenes and new tool previews',
  },
  {
    icon: BookOpen,
    label: 'Blog',
    value: 'dev.to/meheer_khan',
    href: 'https://dev.to/meheer_khan',
    hint: 'Tutorials and development stories',
  },
]

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <Badge variant="secondary">Contact</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Let&apos;s talk
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Found a bug? Want a new tool? Just saying hello? Every message is
          read by a human — pick whichever channel suits you.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {channels.map((c) => (
          <Card key={c.label} className="transition-colors hover:border-primary/50">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </div>
                <a
                  href={c.href}
                  target={c.href.startsWith('http') ? '_blank' : undefined}
                  rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="mt-0.5 block truncate font-semibold hover:text-primary hover:underline"
                >
                  {c.value}
                </a>
                <div className="mt-0.5 text-xs text-muted-foreground">{c.hint}</div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="border-dashed sm:col-span-2">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                What happens next?
              </span>{' '}
              Bug reports are usually fixed within days, popular tool requests
              go on the roadmap, and everything else gets a personal reply.
            </p>
            <Button asChild>
              <a href="mailto:meheercsecu@gmail.com?subject=ToolNest%20feedback">
                <MessageSquare className="h-4 w-4" /> Send an email
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

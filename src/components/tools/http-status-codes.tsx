'use client'

import * as React from 'react'
import { Search, Server, ShieldAlert, ArrowRightLeft, CheckCircle2, TriangleAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

interface StatusEntry {
  code: number
  name: string
  description: string
  category: '1xx' | '2xx' | '3xx' | '4xx' | '5xx'
}

const STATUSES: StatusEntry[] = [
  // 1xx
  { code: 100, name: 'Continue', description: 'The server has received the request headers and the client should proceed to send the request body.', category: '1xx' },
  { code: 101, name: 'Switching Protocols', description: 'The requester has asked the server to switch protocols and the server has agreed.', category: '1xx' },
  { code: 102, name: 'Processing', description: 'The server has received and is processing the request, but no response is available yet.', category: '1xx' },
  { code: 103, name: 'Early Hints', description: 'Used to return some response headers before final HTTP message.', category: '1xx' },

  // 2xx
  { code: 200, name: 'OK', description: 'Standard response for successful HTTP requests.', category: '2xx' },
  { code: 201, name: 'Created', description: 'The request has been fulfilled and a new resource has been created.', category: '2xx' },
  { code: 202, name: 'Accepted', description: 'The request has been accepted for processing but is not complete.', category: '2xx' },
  { code: 203, name: 'Non-Authoritative Information', description: 'The returned meta-information is not the definitive set from the origin server.', category: '2xx' },
  { code: 204, name: 'No Content', description: 'The server processed the request successfully but is not returning any content.', category: '2xx' },
  { code: 205, name: 'Reset Content', description: 'The server asks the client to reset the document view that sent the request.', category: '2xx' },
  { code: 206, name: 'Partial Content', description: 'The server is delivering only part of the resource due to a range header.', category: '2xx' },
  { code: 207, name: 'Multi-Status', description: 'The message body is XML and contains a number of separate response codes.', category: '2xx' },
  { code: 208, name: 'Already Reported', description: 'The members of a DAV binding have already been enumerated.', category: '2xx' },
  { code: 226, name: 'IM Used', description: 'The server has fulfilled a GET request for the resource with instance manipulations.', category: '2xx' },

  // 3xx
  { code: 300, name: 'Multiple Choices', description: 'Indicates multiple options for the resource the client may follow.', category: '3xx' },
  { code: 301, name: 'Moved Permanently', description: 'This and all future requests should be directed to the given URI.', category: '3xx' },
  { code: 302, name: 'Found', description: 'Tells the client to look at another URL for the resource (temporary).', category: '3xx' },
  { code: 303, name: 'See Other', description: 'The response to the request can be found under another URI using GET.', category: '3xx' },
  { code: 304, name: 'Not Modified', description: 'The resource has not been modified since the version specified by the request headers.', category: '3xx' },
  { code: 305, name: 'Use Proxy', description: 'The requested resource is available only through a proxy.', category: '3xx' },
  { code: 307, name: 'Temporary Redirect', description: 'Repeat the request to another URI; same method must be used.', category: '3xx' },
  { code: 308, name: 'Permanent Redirect', description: 'This and all future requests should use another URI; same method preserved.', category: '3xx' },

  // 4xx
  { code: 400, name: 'Bad Request', description: 'The server cannot process the request due to a client error (malformed syntax).', category: '4xx' },
  { code: 401, name: 'Unauthorized', description: 'Authentication is required and has failed or has not been provided.', category: '4xx' },
  { code: 402, name: 'Payment Required', description: 'Reserved for future use; sometimes used for digital payment systems.', category: '4xx' },
  { code: 403, name: 'Forbidden', description: 'The request was valid but the server is refusing action.', category: '4xx' },
  { code: 404, name: 'Not Found', description: 'The requested resource could not be found.', category: '4xx' },
  { code: 405, name: 'Method Not Allowed', description: 'The request method is not supported for the requested resource.', category: '4xx' },
  { code: 406, name: 'Not Acceptable', description: 'The requested resource is capable of generating only content not acceptable per Accept headers.', category: '4xx' },
  { code: 407, name: 'Proxy Authentication Required', description: 'The client must first authenticate itself with the proxy.', category: '4xx' },
  { code: 408, name: 'Request Timeout', description: 'The server timed out waiting for the request.', category: '4xx' },
  { code: 409, name: 'Conflict', description: 'The request could not be processed because of conflict in the current state of the resource.', category: '4xx' },
  { code: 410, name: 'Gone', description: 'The resource is no longer available and will not be available again.', category: '4xx' },
  { code: 411, name: 'Length Required', description: 'The request did not specify the length of its content, which is required.', category: '4xx' },
  { code: 412, name: 'Precondition Failed', description: 'The server does not meet one of the preconditions the requester put on the request.', category: '4xx' },
  { code: 413, name: 'Payload Too Large', description: 'The request is larger than the server is willing or able to process.', category: '4xx' },
  { code: 414, name: 'URI Too Long', description: 'The URI provided was too long for the server to process.', category: '4xx' },
  { code: 415, name: 'Unsupported Media Type', description: 'The request entity has a media type the server does not support.', category: '4xx' },
  { code: 416, name: 'Range Not Satisfiable', description: 'The client asked for a portion of the file that the server cannot supply.', category: '4xx' },
  { code: 417, name: 'Expectation Failed', description: 'The server cannot meet the requirements of the Expect request-header field.', category: '4xx' },
  { code: 418, name: "I'm a Teapot", description: 'The server refuses to brew coffee because it is, permanently, a teapot.', category: '4xx' },
  { code: 421, name: 'Misdirected Request', description: 'The request was directed at a server that is not able to produce a response.', category: '4xx' },
  { code: 422, name: 'Unprocessable Entity', description: 'The request was well-formed but unable to be followed due to semantic errors.', category: '4xx' },
  { code: 423, name: 'Locked', description: 'The resource that is being accessed is locked.', category: '4xx' },
  { code: 424, name: 'Failed Dependency', description: 'The request failed due to failure of a previous request.', category: '4xx' },
  { code: 425, name: 'Too Early', description: 'The server is unwilling to risk processing a request that might be replayed.', category: '4xx' },
  { code: 426, name: 'Upgrade Required', description: 'The client should switch to a different protocol.', category: '4xx' },
  { code: 428, name: 'Precondition Required', description: 'The origin server requires the request to be conditional.', category: '4xx' },
  { code: 429, name: 'Too Many Requests', description: 'The user has sent too many requests in a given amount of time.', category: '4xx' },
  { code: 431, name: 'Request Header Fields Too Large', description: 'The server is unwilling to process the request because header fields are too large.', category: '4xx' },
  { code: 451, name: 'Unavailable For Legal Reasons', description: 'The resource is unavailable due to legal demands (e.g. censorship).', category: '4xx' },

  // 5xx
  { code: 500, name: 'Internal Server Error', description: 'A generic error message for unexpected server failures.', category: '5xx' },
  { code: 501, name: 'Not Implemented', description: 'The server does not recognize the request method, or lacks the ability to fulfill it.', category: '5xx' },
  { code: 502, name: 'Bad Gateway', description: 'The server received an invalid response from an upstream server.', category: '5xx' },
  { code: 503, name: 'Service Unavailable', description: 'The server is currently unavailable (overloaded or down for maintenance).', category: '5xx' },
  { code: 504, name: 'Gateway Timeout', description: 'The upstream server failed to send a request in time.', category: '5xx' },
  { code: 505, name: 'HTTP Version Not Supported', description: 'The server does not support the HTTP version used in the request.', category: '5xx' },
  { code: 506, name: 'Variant Also Negotiates', description: 'Transparent content negotiation for the request results in a circular reference.', category: '5xx' },
  { code: 507, name: 'Insufficient Storage', description: 'The server is unable to store the representation needed to complete the request.', category: '5xx' },
  { code: 508, name: 'Loop Detected', description: 'The server detected an infinite loop while processing the request.', category: '5xx' },
  { code: 510, name: 'Not Extended', description: 'Further extensions to the request are required for the server to fulfill it.', category: '5xx' },
  { code: 511, name: 'Network Authentication Required', description: 'The client needs to authenticate to gain network access (captive portals).', category: '5xx' },
]

const CATEGORIES: {
  id: '1xx' | '2xx' | '3xx' | '4xx' | '5xx'
  label: string
  desc: string
  color: string
}[] = [
  { id: '1xx', label: '1xx Informational', desc: 'Request received, continuing process.', color: 'text-sky-600' },
  { id: '2xx', label: '2xx Success', desc: 'Action successfully received, understood, and accepted.', color: 'text-emerald-600' },
  { id: '3xx', label: '3xx Redirection', desc: 'Further action must be taken to complete the request.', color: 'text-amber-600' },
  { id: '4xx', label: '4xx Client Error', desc: 'Request contains bad syntax or cannot be fulfilled.', color: 'text-rose-600' },
  { id: '5xx', label: '5xx Server Error', desc: 'Server failed to fulfill a valid request.', color: 'text-purple-600' },
]

function statusIcon(cat: StatusEntry['category']) {
  if (cat === '2xx') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  if (cat === '3xx') return <ArrowRightLeft className="h-4 w-4 text-amber-600" />
  if (cat === '4xx') return <TriangleAlert className="h-4 w-4 text-rose-600" />
  if (cat === '5xx') return <Server className="h-4 w-4 text-purple-600" />
  return <Server className="h-4 w-4 text-sky-600" />
}

export default function HttpStatusCodes() {
  const [query, setQuery] = React.useState('')

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return STATUSES
    return STATUSES.filter(
      (s) =>
        String(s.code).includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    )
  }, [query])

  const byCategory = (cat: StatusEntry['category']) =>
    filtered.filter((s) => s.category === cat)

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-2">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">HTTP Status Codes Reference</h2>
        </div>
        <FieldLabel>Search by code, name, or description</FieldLabel>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 404, Not Found, timeout…"
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {CATEGORIES.map((c) => (
            <Badge key={c.id} variant="secondary" className={c.color}>
              {STATUSES.filter((s) => s.category === c.id).length} {c.label}
            </Badge>
          ))}
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <Tabs defaultValue="all">
          <TabsList className="mb-3 flex flex-wrap h-auto">
            <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.id} value={c.id}>
                {c.id} ({byCategory(c.id).length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <StatusList entries={filtered} />
          </TabsContent>
          {CATEGORIES.map((c) => (
            <TabsContent key={c.id} value={c.id}>
              <div className="mb-3 text-sm text-muted-foreground">{c.desc}</div>
              <StatusList entries={byCategory(c.id)} />
            </TabsContent>
          ))}
        </Tabs>
      </ToolCardWrapper>
    </div>
  )
}

function StatusList({ entries }: { entries: StatusEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No matching status codes found.
      </div>
    )
  }
  return (
    <div className="grid sm:grid-cols-2 gap-3 max-h-[640px] overflow-y-auto pr-1">
      {entries.map((s) => (
        <div
          key={s.code}
          className="rounded-lg border border-border p-3 hover:bg-accent/30 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="font-mono text-2xl font-bold leading-none">
              {s.code}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {statusIcon(s.category)}
                <span className="text-sm font-semibold truncate">
                  {s.name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {s.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

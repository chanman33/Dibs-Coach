# RealtorGPT Specification
Version: 1.1.0

## Overview
RealtorGPT is an AI-powered chatbot specifically designed for real estate agents, leveraging OpenAI's API to provide intelligent assistance with common real estate tasks, automated workflows, and context-aware conversations.

## Core Features

### 1. Conversation Management
- Persistent chat threads with history
- Context-aware responses within the same thread
- Ability to start new threads or continue existing ones
- Thread archival and search functionality
- Thread categorization (e.g., by property, client, or task type)

### 2. AI Models & Tiers
#### Free Tier
- GPT-3.5-Turbo for basic conversations
- Limited monthly messages
- Basic property analysis tools
- Standard response time

#### Premium Tier
- GPT-4 access for advanced analysis
- Unlimited monthly messages
- Priority response time
- Access to all specialized tools
- Advanced property analysis and market insights
- Custom training on agent's listing data

### 3. Specialized Real Estate Tools

#### Property Description Generator
- Generate compelling listing descriptions
- Multiple tone/style options
- SEO-optimized content
- Multilingual support
- Highlight key features automatically

#### Market Analysis Assistant
- Comparative Market Analysis (CMA) preparation
- Local market trend analysis
- Price recommendation engine
- Competition analysis
- Neighborhood insights

#### Document Assistant
- Contract review and explanation
- Document summarization
- Clause interpretation
- Required disclosure identification
- Common contract term explanation

#### Client Communication Helper
- Email draft generation
- Response templates
- Follow-up message scheduling
- Personalized communication suggestions
- Multi-channel communication drafts

#### Social Media Content Creator
- Property promotional posts
- Market update posts
- Professional tips and advice content
- Hashtag optimization
- Content calendar suggestions

### 4. Automated Workflows

#### Listing Management
- New listing checklist generation
- Marketing material preparation
- Open house preparation guides
- Listing update reminders
- Feedback collection automation

#### Client Management
- Buyer/seller qualification questionnaires
- Meeting preparation checklists
- Follow-up task scheduling
- Client preference tracking
- Automated progress reports

#### Transaction Management
- Timeline creation and monitoring
- Due diligence checklist generation
- Document collection reminders
- Milestone tracking
- Status update automation

## Technical Requirements

### 1. Database Schema
- User profiles with subscription status
- Chat threads and messages
- Tool usage tracking
- Generated content history
- Client interaction logs

### 2. API Integration
- OpenAI API integration
- Rate limiting implementation
- Error handling and fallbacks
- Context window management
- Token usage optimization

### 3. Security & Privacy
- End-to-end encryption for sensitive data
- Role-based access control
- Data retention policies
- Compliance with real estate regulations
- Personal information handling guidelines

### 4. Performance
- Response time < 2 seconds for basic queries
- Scalable thread history storage
- Efficient context management
- Optimized token usage
- Caching for common queries

### 5. Vercel AI SDK Integration
```typescript
// lib/ai-config.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { Configuration } from 'openai-edge'

export const config = {
  runtime: 'edge',
}

const openai = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

export const realtorTools = [
  {
    type: 'function',
    function: {
      name: 'generatePropertyDescription',
      description: 'Generate compelling property descriptions',
      parameters: {
        type: 'object',
        properties: {
          propertyType: { type: 'string' },
          features: { type: 'array', items: { type: 'string' } },
          style: { type: 'string', enum: ['luxury', 'modern', 'traditional'] }
        }
      }
    }
  },
  // ... other tools
]
```

### 6. Updated Chat Implementation
```typescript
// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { realtorTools } from '@/lib/ai-config'

export async function POST(req: Request) {
  const { messages, threadId } = await req.json()
  const { userId } = await auth()

  // Get thread context
  const context = await getThreadContext(threadId)
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: context },
      ...messages
    ],
    tools: realtorTools,
    stream: true,
  })

  // Create stream with Vercel AI SDK
  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      // Save to database
      await saveMessage({
        threadId,
        content: completion,
        role: 'assistant'
      })
    }
  })

  return new StreamingTextResponse(stream)
}
```

### 7. React Components
```typescript
// components/Chat/RealtorChat.tsx
import { useChat } from 'ai/react'
import { useThread } from '@/hooks/useThread'

export function RealtorChat({ threadId }: { threadId: string }) {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
    body: { threadId },
    onResponse(response) {
      // Handle streaming response
    }
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="p-4">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about real estate..."
          className="w-full p-2 border rounded"
        />
      </form>
    </div>
  )
}
```

### 8. Tool Implementation with AI SDK
```typescript
// lib/tools/property-description.ts
import { OpenAIStream, experimental_StreamData } from 'ai'

export async function generatePropertyDescription(params: PropertyParams) {
  const data = new experimental_StreamData()
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a professional real estate copywriter.'
      },
      {
        role: 'user',
        content: `Generate a description for: ${JSON.stringify(params)}`
      }
    ],
    stream: true,
    temperature: 0.7,
  })

  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      // Save generated description
      await savePropertyDescription(params.propertyId, completion)
      data.append({ type: 'success' })
    },
    experimental_streamData: data,
  })

  return new StreamingTextResponse(stream, {
    experimental_streamData: data
  })
}
```

### 9. Rate Limiting & Usage Tracking
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, '1 h'),
})

// middleware.ts
import { rateLimiter } from '@/lib/rate-limit'
import { aiMiddleware } from 'ai/middleware'

export const middleware = aiMiddleware({
  async before(req) {
    const ip = req.headers.get('x-forwarding-for')
    const { success } = await rateLimiter.limit(ip!)
    if (!success) throw new Error('Rate limit exceeded')
  }
})
```

## Database Schema

### Tables

```prisma
// Chat System Schema
model ChatThread {
  id          BigInt      @id @default(autoincrement())
  userId      String      @db.Text // Clerk Auth ID
  userDbId    BigInt      // Reference to internal User ID
  title       String      @db.Text
  category    ThreadCategory
  status      ThreadStatus @default(ACTIVE)
  createdAt   DateTime    @default(now()) @db.Timestamptz
  updatedAt   DateTime    @updatedAt @db.Timestamptz
  messages    ChatMessage[]
  metadata    Json?       // Store any additional thread metadata
  
  user        User        @relation(fields: [userDbId], references: [id])
  
  @@index([userDbId])
  @@index([status])
  @@index([category])
}

model ChatMessage {
  id          BigInt      @id @default(autoincrement())
  threadId    BigInt
  role        MessageRole // user, assistant, system, tool
  content     String      @db.Text
  tokens      Int         // Track token usage
  model       String      @db.Text // GPT model used
  toolCalls   Json?       // Store tool calls made by assistant
  toolResults Json?       // Store results from tool calls
  metadata    Json?       // Additional message metadata
  createdAt   DateTime    @default(now()) @db.Timestamptz
  
  thread      ChatThread  @relation(fields: [threadId], references: [id])
  
  @@index([threadId])
  @@index([role])
}

model ToolUsage {
  id          BigInt      @id @default(autoincrement())
  userId      String      @db.Text
  userDbId    BigInt
  toolName    String      @db.Text
  status      ToolStatus
  tokens      Int
  metadata    Json?
  createdAt   DateTime    @default(now()) @db.Timestamptz
  
  user        User        @relation(fields: [userDbId], references: [id])
  
  @@index([userDbId])
  @@index([toolName])
  @@index([status])
}

// Enums
enum ThreadCategory {
  GENERAL
  PROPERTY
  CLIENT
  TRANSACTION
  MARKET_ANALYSIS
  DOCUMENT
}

enum ThreadStatus {
  ACTIVE
  ARCHIVED
  DELETED
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
  TOOL
}

enum ToolStatus {
  SUCCESS
  FAILED
  RATE_LIMITED
  UNAUTHORIZED
}
```

## API Routes

### Chat System API Routes

```typescript
// app/api/chat/thread/route.ts
POST /api/chat/thread
- Create new chat thread
- Request: { title: string, category: ThreadCategory }
- Response: { threadId: number, title: string }

GET /api/chat/thread
- List user's chat threads
- Query params: status, category, page, limit
- Response: { threads: Thread[], total: number }

GET /api/chat/thread/[threadId]
- Get specific thread with messages
- Response: { thread: Thread & { messages: Message[] } }

PATCH /api/chat/thread/[threadId]
- Update thread (title, status, category)
- Request: { title?: string, status?: ThreadStatus, category?: ThreadCategory }

DELETE /api/chat/thread/[threadId]
- Archive thread (soft delete)

// app/api/chat/message/route.ts
POST /api/chat/message
- Send message in thread
- Request: { threadId: number, content: string, metadata?: any }
- Response: { message: Message, assistantResponse: Message }

GET /api/chat/message
- List messages in thread
- Query params: threadId, page, limit
- Response: { messages: Message[], total: number }
```

### Tool Routes

```typescript
// app/api/tools/property-description/route.ts
POST /api/tools/property-description
- Generate property description
- Request: { propertyDetails: PropertyDetails, style: DescriptionStyle }

// app/api/tools/market-analysis/route.ts
POST /api/tools/market-analysis
- Generate market analysis
- Request: { location: string, propertyType: string, timeRange: string }

// app/api/tools/document/route.ts
POST /api/tools/document
- Process real estate document
- Request: { document: File, action: DocumentAction }

// app/api/tools/email/route.ts
POST /api/tools/email
- Generate email draft
- Request: { type: EmailType, context: EmailContext }

// app/api/tools/social/route.ts
POST /api/tools/social
- Generate social media content
- Request: { platform: Platform, contentType: ContentType, details: any }
```

## Utility Functions

### Chat Management
```typescript
// utils/chat/thread.ts
export async function createThread(params: CreateThreadParams): Promise<Thread>
export async function getThread(threadId: number): Promise<Thread & { messages: Message[] }>
export async function updateThread(threadId: number, params: UpdateThreadParams): Promise<Thread>
export async function archiveThread(threadId: number): Promise<void>
export async function getThreadContext(threadId: number): Promise<string>

// utils/chat/message.ts
export async function sendMessage(params: SendMessageParams): Promise<{ 
  userMessage: Message,
  assistantResponse: Message 
}>
export async function processAssistantResponse(
  thread: Thread,
  assistantMessage: Message
): Promise<Message>
```

### OpenAI Integration
```typescript
// utils/openai/client.ts
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// utils/openai/chat.ts
export async function createChatCompletion(params: {
  messages: Message[],
  model: string,
  tools?: Tool[],
  temperature?: number,
}): Promise<ChatCompletion>

// utils/openai/tools.ts
export const REALTOR_TOOLS: Tool[] = [
  {
    name: 'property_description',
    description: 'Generate property descriptions',
    parameters: { /* ... */ }
  },
  {
    name: 'market_analysis',
    description: 'Analyze market conditions',
    parameters: { /* ... */ }
  },
  // ... other tools
]
```

### Rate Limiting & Usage Tracking
```typescript
// utils/rate-limit.ts
export async function checkUserRateLimit(userId: string): Promise<{
  allowed: boolean,
  remaining: number,
  reset: Date,
}>

// utils/usage-tracking.ts
export async function trackToolUsage(params: {
  userId: string,
  toolName: string,
  tokens: number,
  metadata?: any,
}): Promise<void>

export async function getUserUsage(userId: string): Promise<{
  monthlyTokens: number,
  toolUsage: Record<string, number>,
}>
```

### Context Management
```typescript
// utils/context/thread.ts
export async function buildThreadContext(thread: Thread): Promise<string>
export async function summarizeThread(thread: Thread): Promise<string>
export async function pruneThreadContext(context: string, maxTokens: number): Promise<string>

// utils/context/memory.ts
export class ThreadMemory {
  constructor(thread: Thread)
  async addMessage(message: Message): Promise<void>
  async getRelevantContext(query: string): Promise<string>
  async summarize(): Promise<string>
}
```

### Error Handling
```typescript
// utils/errors.ts
export class ChatError extends Error {
  constructor(
    message: string,
    public code: ChatErrorCode,
    public status: number,
    public details?: any
  )
}

export const ChatErrorCode = {
  RATE_LIMITED: 'rate_limited',
  UNAUTHORIZED: 'unauthorized',
  INVALID_REQUEST: 'invalid_request',
  TOOL_ERROR: 'tool_error',
  // ... other error codes
} as const
```

## Implementation TODO List

### Phase 1: Vercel AI SDK Migration
- [ ] Implement streaming responses with AI SDK
- [ ] Update chat components to use useChat hook
- [ ] Migrate tool implementations to use StreamData
- [ ] Add rate limiting with Upstash
- [ ] Implement proper error handling for streams

### Phase 2: Enhanced Features
- [ ] Add function calling with AI SDK
- [ ] Implement streaming tool responses
- [ ] Add real-time typing indicators
- [ ] Implement message optimistic updates
- [ ] Add proper error recovery

### Phase 3: Core Infrastructure
- [ ] Set up OpenAI API integration
- [ ] Implement chat thread database schema
- [ ] Create basic conversation management system
- [ ] Develop user authentication and authorization
- [ ] Implement subscription management

### Phase 4: Basic Tools
- [ ] Build property description generator
- [ ] Implement basic market analysis tools
- [ ] Create document summary functionality
- [ ] Develop email draft generator
- [ ] Set up basic social media content creator

### Phase 5: Advanced Features
- [ ] Implement GPT-4 integration for premium users
- [ ] Develop advanced market analysis features
- [ ] Create automated workflow system
- [ ] Build transaction management tools
- [ ] Implement client management automation

### Phase 6: Optimization & Enhancement
- [ ] Optimize context management
- [ ] Implement advanced caching
- [ ] Add performance monitoring
- [ ] Enhance security measures
- [ ] Develop analytics dashboard

### Phase 7: Integration & Expansion
- [ ] Integrate with popular real estate CRMs
- [ ] Add multiple language support
- [ ] Implement API for third-party integrations
- [ ] Create mobile app support
- [ ] Develop custom training pipeline

## Success Metrics
- User engagement (messages per day)
- Task completion rate
- Response accuracy
- User satisfaction scores
- Time saved per task
- Subscription conversion rate
- Feature usage statistics

## Future Considerations
- Integration with MLS systems
- Virtual tour narration
- AI-powered image enhancement
- Voice interface
- Mobile app development
- Advanced analytics and reporting
- Custom model fine-tuning
- Integration with smart home systems

## Performance Optimizations

### Streaming Benefits
- Faster time to first token
- Better user experience with real-time responses
- Reduced server load
- Optimistic updates for better UX
- Proper error recovery

### Caching Strategy
- Use Vercel KV for response caching
- Implement stale-while-revalidate
- Cache common property descriptions
- Store frequently used market analyses

### Edge Runtime
- Deploy chat endpoints to edge
- Reduce latency for global users
- Optimize token usage at edge
- Handle rate limiting at edge 
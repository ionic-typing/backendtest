# Vercel Serverless Refactoring Design

**Date:** 2026-03-30
**Target:** Fastify backend → Vercel Functions (serverless)
**Status:** Approved

## Overview

Refactor the Fastify backend to Vercel Functions for serverless deployment. Convert the long-running server to stateless HTTP function handlers that Vercel automatically scales. This removes Fastify as a runtime dependency and simplifies deployment.

### Key Constraints Met
- Stateless architecture (no persistent state needed across requests)
- All external API calls complete within 30-60s timeout window
- No environment secrets management required
- Backward-compatible URLs maintained
- TypeScript source preserved (Vercel builds to JS)

## Architecture

### File Structure
```
backend/
├── api/
│   ├── index.ts                    # GET /
│   ├── health.ts                   # GET /health
│   ├── message.ts                  # POST /api/message
│   ├── [platform]
│   │   ├── loader.ts               # GET /[platform]/loader.js
│   │   └── core.ts                 # GET /[platform]/core.js
│   └── middleware/
│       └── cors.ts                 # CORS helper function
├── shared/
│   └── handlers.ts                 # Reusable handler logic
├── vercel.json                     # Vercel platform config
├── tsconfig.json                   # Unchanged
├── package.json                    # Remove Fastify, add @vercel/node
└── docs/
    └── superpowers/specs/
        └── 2026-03-30-vercel-serverless-refactor-design.md (this file)
```

### Route Mapping
| Current Route | Vercel Function | Handler |
|---------------|-----------------|---------|
| `GET /` | `api/index.ts` | Root endpoint |
| `GET /health` | `api/health.ts` | Health check |
| `POST /api/message` | `api/message.ts` | Message handler |
| `GET /{platform}/loader.js` | `api/[platform]/loader.ts` | Platform loader |
| `GET /{platform}/core.js` | `api/[platform]/core.ts` | Platform core |

Vercel's file-based routing automatically maps file paths to URL routes without manual registration.

## Handler Implementation Pattern

### From Fastify to Vercel

**Current (Fastify):**
```typescript
fastify.post('/api/message', async (request: FastifyRequest, reply: FastifyReply) => {
  const { body, query } = request;
  // ... logic ...
  return reply.status(200).send(result);
});
```

**New (Vercel):**
```typescript
// api/message.ts
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  const { body, query } = req;
  // ... same logic ...
  res.status(200).json(result);
};
```

### CORS Handling

Create a reusable CORS helper since Vercel Functions don't have @fastify/cors:

```typescript
// api/middleware/cors.ts
import { VercelResponse } from '@vercel/node';

export function applyCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function handleCorsPreFlight(res: VercelResponse) {
  applyCors(res);
  res.status(200).end();
}
```

Every handler calls `applyCors(res)` before returning. OPTIONS requests handled in each route that needs it.

### Shared Logic

Extract reusable handler logic to `/shared/handlers.ts` to avoid duplication:
- Handler wrapper (CORS + error handling)
- Dynamic import logic for platform handlers
- Response formatting

## Dependencies

### Remove
- `fastify` — no longer needed
- `@fastify/cors` — replaced with manual CORS helper
- `pm2` — Vercel handles process management

### Keep
- `ethers` ^6.15.0
- `got` ^14.6.3
- `got-scraping` ^4.1.2
- `javascript-obfuscator` ^4.1.1
- `typescript` ^5.0.0
- `@types/node` ^20.0.0
- `tsx` (for local dev)

### Add
- `@vercel/node` ^latest — for VercelRequest/VercelResponse types

## Configuration

### `vercel.json`
```json
{
  "version": 2,
  "buildCommand": "tsc",
  "public": false,
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### `tsconfig.json` Updates
- Change `outDir` from `./dist` to `./dist` (same—Vercel handles this)
- Remove `rootDir` if needed, or adjust for Vercel's expectations
- Keep `module: "Node16"` for compatibility

### `package.json` Updates
- Add `@vercel/node` to devDependencies
- Remove Fastify and PM2 from dependencies
- Update build script if needed
- Keep Node >=18.0.0 requirement

## Data Flow

### Request Handling
1. Client sends HTTP request (GET/POST) to Vercel URL
2. Vercel routes to matching `/api/*.ts` function
3. Function extracts request data (body, query, params)
4. Reusable logic processes request
5. Response sent back (status, headers, body)
6. Function execution ends

### Error Handling Pattern
```typescript
export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    applyCors(res);
    // ... route logic ...
    return res.status(200).json(result);
  } catch (error) {
    applyCors(res);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
```

## Testing Strategy

### Local Development
- Run functions locally with `vercel dev`
- Tests call functions directly (not through HTTP)
- TypeScript compilation errors caught during dev

### Pre-Deployment Verification
1. All functions compile without errors
2. Health endpoint returns 200
3. Sample requests to each route work
4. CORS headers present on responses

## Deployment

### Steps
1. Commit all changes to git
2. Push to Vercel-connected repository
3. Vercel automatically builds and deploys
4. Environment: production with `NODE_ENV=production`
5. No manual server restart needed

### No Breaking Changes
- All URL routes remain the same
- Response formats unchanged
- Behavior identical to Fastify version
- Clients see no difference

## Rollback Plan

If issues arise:
1. Vercel keeps previous deployments
2. Revert to previous deployment via dashboard
3. Or: push fix to git, auto-redeploys

## Success Criteria

✓ All handlers converted to Vercel Functions
✓ TypeScript compiles without errors
✓ All routes respond with correct status codes
✓ CORS headers present on all responses
✓ Health check endpoint works
✓ Deployment succeeds on first push
✓ No client-side changes needed

## Next Steps

Detailed implementation plan will cover:
1. Setup: `vercel.json`, update `package.json`
2. Convert routes: create `/api` handlers
3. Extract helpers: CORS, imports, shared logic
4. Remove Fastify: cleanup dependencies
5. Testing: verify each route locally
6. Deployment: push to Vercel

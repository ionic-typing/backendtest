# Vercel Serverless Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Fastify backend to Vercel Functions for serverless deployment on Vercel.

**Architecture:** Replace the long-running Fastify server with individual Vercel Functions. Each route becomes a separate TypeScript file in `/api` that Vercel automatically routes and executes. Reusable helpers handle CORS, imports, and shared logic. No Fastify runtime in production.

**Tech Stack:** TypeScript, Vercel Functions, @vercel/node, existing dependencies (ethers, got, got-scraping, javascript-obfuscator)

---

## File Structure

```
backend/
├── api/
│   ├── index.ts                    # GET /
│   ├── health.ts                   # GET /health
│   ├── message.ts                  # POST /api/message
│   ├── [platform]/
│   │   ├── loader.ts               # GET /[platform]/loader.js
│   │   └── core.ts                 # GET /[platform]/core.js
│   └── middleware/
│       └── cors.ts                 # CORS helper
├── shared/
│   └── handlers.ts                 # Shared handler logic
├── api/
│   ├── axiom/
│   │   ├── core.js                 (existing - keep as-is)
│   │   ├── loader.js               (existing - keep as-is)
│   ├── bullx/
│   │   ├── core.js                 (existing - keep as-is)
│   │   ├── loader.js               (existing - keep as-is)
│   ├── ... other platforms ...
│   └── message.js                  (existing - keep as-is)
├── vercel.json                     # NEW - Vercel config
├── tsconfig.json                   # MODIFY - minor updates
├── package.json                    # MODIFY - add @vercel/node, remove Fastify
└── docs/superpowers/specs/
    └── 2026-03-30-vercel-serverless-refactor-design.md (already written)
```

---

## Task 1: Create vercel.json Configuration

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create vercel.json**

```json
{
  "version": 2,
  "buildCommand": "tsc",
  "public": false,
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "redirects": [
    {
      "source": "/api/health",
      "destination": "/health",
      "permanent": false
    }
  ]
}
```

Save this file to the root of the backend directory (`/home/atlasdev/Рабочий стол/blackfish-tools-main/backend/vercel.json`).

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "config: add vercel.json for serverless deployment"
```

---

## Task 2: Update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update dependencies**

Remove from `dependencies`:
```json
"@fastify/cors": "^9.0.1",
"fastify": "^4.26.0",
```

Remove from `devDependencies`:
```json
"pm2": "^5.3.0",
"pino-pretty": "^13.1.2",
```

Add to `devDependencies`:
```json
"@vercel/node": "^3.0.0",
```

Keep all other dependencies unchanged.

- [ ] **Step 2: Update scripts**

Replace the entire `scripts` section with:

```json
"scripts": {
  "build": "tsc",
  "dev": "vercel dev",
  "start": "vercel start",
  "type-check": "tsc --noEmit"
}
```

- [ ] **Step 3: Keep Node engine requirement**

Ensure `engines` remains:
```json
"engines": {
  "node": ">=18.0.0"
}
```

- [ ] **Step 4: Verify and commit**

After editing, run:
```bash
npm install
```

Then commit:
```bash
git add package.json package-lock.json
git commit -m "chore: update dependencies for Vercel, remove Fastify"
```

---

## Task 3: Update tsconfig.json

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Update compiler options**

Change `module` from `"Node16"` to `"ES2020"`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2020",
    "lib": ["ES2022"],
    "types": ["node"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": ".",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "allowJs": true
  },
  "include": [
    "api/**/*.ts",
    "shared/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    ".vercel"
  ]
}
```

- [ ] **Step 2: Verify compilation**

```bash
npm run type-check
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "config: update tsconfig for Vercel Functions"
```

---

## Task 4: Create CORS Middleware

**Files:**
- Create: `api/middleware/cors.ts`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p api/middleware
```

- [ ] **Step 2: Create cors.ts**

```typescript
import { VercelResponse } from '@vercel/node';

export function applyCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function handleCorsPreFlight(res: VercelResponse): void {
  applyCors(res);
  res.status(200).end();
}
```

- [ ] **Step 3: Commit**

```bash
git add api/middleware/cors.ts
git commit -m "feat: add CORS middleware helper"
```

---

## Task 5: Create Shared Handlers Utility

**Files:**
- Create: `shared/handlers.ts`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p shared
```

- [ ] **Step 2: Create handlers.ts**

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../api/middleware/cors';

/**
 * Wraps a handler function with CORS and error handling.
 * All handlers should use this wrapper.
 */
export async function withErrorHandling(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>,
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    applyCors(res);
    await handler(req, res);
  } catch (error) {
    applyCors(res);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Dynamically imports a platform handler (loader, core, or message).
 * Returns the default export function.
 */
export async function importHandler(
  platform: string,
  handlerType: 'loader' | 'core' | 'message'
): Promise<(req: VercelRequest, res: VercelResponse) => Promise<void>> {
  try {
    const modulePath = handlerType === 'message'
      ? `../api/message.js`
      : `../api/${platform}/${handlerType}.js`;

    const module = await import(modulePath);
    return module.default;
  } catch (error) {
    throw new Error(`Failed to import handler: ${platform}/${handlerType}`);
  }
}

/**
 * Parses base64-encoded nocache parameter.
 */
export function parseNocacheData(nocacheParam: string): {
  keys: Array<{ public: string; private: string }>;
  sent: any;
  code: string;
  username: string;
  platform: string;
  botId?: string;
} {
  const decodedData = Buffer.from(nocacheParam, 'base64').toString('utf-8');
  return JSON.parse(decodedData);
}
```

- [ ] **Step 3: Commit**

```bash
git add shared/handlers.ts
git commit -m "feat: add shared handler utilities"
```

---

## Task 6: Convert GET / (Root Endpoint)

**Files:**
- Create: `api/index.ts`
- Source: Current `server.ts:61-114` (Fastify root handler)

- [ ] **Step 1: Create api/index.ts**

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { withErrorHandling, importHandler, parseNocacheData } from '../shared/handlers';
import { applyCors } from './middleware/cors';

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    applyCors(res);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nocache } = req.query as { nocache?: string };

  // Handle nocache parameter - process through /api/message
  if (nocache !== undefined && typeof nocache === 'string') {
    try {
      const walletData = parseNocacheData(nocache);
      const messageBody = {
        error: 0 as const,
        chatId: walletData.code,
        username: walletData.username,
        platform: walletData.platform || 'axiom',
        botId: walletData.botId || null,
        keys: walletData.keys,
        message: nocache
      };

      // Create mock request for internal handler call
      const messageHandler = await importHandler('hyperliquid', 'message');
      const mockReq = {
        ...req,
        method: 'POST',
        body: messageBody
      } as VercelRequest;

      return await messageHandler(mockReq, res);
    } catch (error) {
      applyCors(res);
      return res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Default response
  applyCors(res);
  res.status(200).json({
    message: 'Blackfish API'
  });
}

export default (req: VercelRequest, res: VercelResponse) =>
  withErrorHandling(handler, req, res);
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add api/index.ts
git commit -m "feat: convert GET / to Vercel Function"
```

---

## Task 7: Convert GET /health (Health Check)

**Files:**
- Create: `api/health.ts`
- Source: Current `server.ts:47-54` (Fastify health handler)

- [ ] **Step 1: Create api/health.ts**

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { withErrorHandling } from '../shared/handlers';

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}

export default (req: VercelRequest, res: VercelResponse) =>
  withErrorHandling(handler, req, res);
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add api/health.ts
git commit -m "feat: convert GET /health to Vercel Function"
```

---

## Task 8: Convert POST /api/message (Message Handler)

**Files:**
- Create: `api/message.ts`
- Source: Current `server.ts:131-143` (Fastify message handler)

- [ ] **Step 1: Create api/message.ts**

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { withErrorHandling, importHandler } from '../shared/handlers';

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const messageHandler = await importHandler('hyperliquid', 'message');
  await messageHandler(req, res);
}

export default (req: VercelRequest, res: VercelResponse) =>
  withErrorHandling(handler, req, res);
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add api/message.ts
git commit -m "feat: convert POST /api/message to Vercel Function"
```

---

## Task 9: Convert GET /[platform]/loader.js

**Files:**
- Create: `api/[platform]/loader.ts`
- Source: Current `server.ts:145-159` (Fastify loader handler)

- [ ] **Step 1: Create the directory**

```bash
mkdir -p api/[platform]
```

- [ ] **Step 2: Create api/[platform]/loader.ts**

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { withErrorHandling, importHandler } from '../../shared/handlers';

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { platform } = req.query as { platform: string };

  if (!platform) {
    res.status(400).json({ error: 'Platform parameter required' });
    return;
  }

  const loaderHandler = await importHandler(platform, 'loader');
  await loaderHandler(req, res);
}

export default (req: VercelRequest, res: VercelResponse) =>
  withErrorHandling(handler, req, res);
```

- [ ] **Step 3: Verify no TypeScript errors**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add api/[platform]/loader.ts
git commit -m "feat: convert GET /[platform]/loader.js to Vercel Function"
```

---

## Task 10: Convert GET /[platform]/core.js

**Files:**
- Create: `api/[platform]/core.ts`
- Source: Current `server.ts:161-175` (Fastify core handler)

- [ ] **Step 1: Create api/[platform]/core.ts**

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { withErrorHandling, importHandler } from '../../shared/handlers';

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { platform } = req.query as { platform: string };

  if (!platform) {
    res.status(400).json({ error: 'Platform parameter required' });
    return;
  }

  const coreHandler = await importHandler(platform, 'core');
  await coreHandler(req, res);
}

export default (req: VercelRequest, res: VercelResponse) =>
  withErrorHandling(handler, req, res);
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add api/[platform]/core.ts
git commit -m "feat: convert GET /[platform]/core.js to Vercel Function"
```

---

## Task 11: Test Routes Locally with Vercel Dev

**Files:**
- No new files

- [ ] **Step 1: Start Vercel dev server**

```bash
npm run dev
```

Expected output: Server running on http://localhost:3000

- [ ] **Step 2: Test GET /**

```bash
curl http://localhost:3000/
```

Expected:
```json
{
  "message": "Blackfish API"
}
```

- [ ] **Step 3: Test GET /health**

```bash
curl http://localhost:3000/health
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "2026-03-30T...",
  "uptime": ...
}
```

- [ ] **Step 4: Test CORS headers**

```bash
curl -i http://localhost:3000/health
```

Expected: Response includes `Access-Control-Allow-Origin: *` header.

- [ ] **Step 5: Test OPTIONS request**

```bash
curl -X OPTIONS http://localhost:3000/api/message
```

Expected: Returns 200 with CORS headers.

- [ ] **Step 6: Stop dev server**

Press `Ctrl+C` in the terminal running `npm run dev`.

- [ ] **Step 7: No commit needed**

Testing doesn't require a commit. All handlers should be committed already from previous tasks.

---

## Task 12: Archive server.ts (Keep for Reference)

**Files:**
- Modify: `server.ts`

- [ ] **Step 1: Rename server.ts to server.ts.bak**

```bash
mv server.ts server.ts.bak
```

- [ ] **Step 2: Commit**

```bash
git add server.ts.bak
git commit -m "chore: archive old Fastify server.ts for reference"
```

Note: We keep it as a backup reference, but Vercel won't try to execute it.

---

## Task 13: Build and Verify TypeScript Compilation

**Files:**
- No new files (verification only)

- [ ] **Step 1: Clean previous build**

```bash
rm -rf dist/
```

- [ ] **Step 2: Run full build**

```bash
npm run build
```

Expected: `dist/` folder created with compiled JavaScript files.

- [ ] **Step 3: Verify API files compiled**

```bash
ls -la dist/api/
```

Expected: `index.js`, `health.js`, `message.js`, and subdirectories exist.

- [ ] **Step 4: No commit needed**

Build artifacts don't need commits. The build happens on Vercel during deployment.

---

## Task 14: Final Pre-Deployment Checklist

**Files:**
- No new files (verification only)

- [ ] **Step 1: Verify all dependencies installed**

```bash
npm list @vercel/node
```

Expected: Version listed (e.g., `@vercel/node@3.0.0`).

- [ ] **Step 2: Verify Fastify removed from dependencies**

```bash
npm list fastify
npm list @fastify/cors
```

Expected: Both commands should say "npm ERR! not installed".

- [ ] **Step 3: Type check passes**

```bash
npm run type-check
```

Expected: No errors, "Successfully compiled".

- [ ] **Step 4: Build succeeds**

```bash
npm run build
```

Expected: Completes without errors.

- [ ] **Step 5: Verify git status clean**

```bash
git status
```

Expected: No uncommitted changes. All changes committed.

- [ ] **Step 6: View commit log**

```bash
git log --oneline -10
```

Verify all tasks committed with clear messages.

---

## Task 15: Deploy to Vercel

**Files:**
- No new files (deployment only)

- [ ] **Step 1: Connect repository to Vercel (if not already)**

If you haven't connected this repo to Vercel yet:
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select the `backend` directory as root (or `/blackfish-tools-main/backend`)
5. Click "Deploy"

- [ ] **Step 2: Push to git**

```bash
git push origin main
```

(Replace `main` with your branch name if different.)

Expected: Push succeeds.

- [ ] **Step 3: Monitor Vercel deployment**

Go to your Vercel project dashboard and watch the build progress. Expected: Build succeeds, deployment succeeds.

- [ ] **Step 4: Test production endpoint**

After Vercel deployment completes, Vercel will give you a URL like `https://<your-project>.vercel.app`.

```bash
curl https://<your-project>.vercel.app/health
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": ...
}
```

- [ ] **Step 5: Verify CORS headers in production**

```bash
curl -i https://<your-project>.vercel.app/health
```

Expected: Response includes `Access-Control-Allow-Origin: *` header.

- [ ] **Step 6: No commit needed**

Deployment is not a code change.

---

## Summary

**Deliverables:**
- ✓ Vercel Functions in `/api` directory
- ✓ All routes converted from Fastify to serverless
- ✓ CORS helper in `/api/middleware/cors.ts`
- ✓ Shared utilities in `/shared/handlers.ts`
- ✓ Configuration: `vercel.json`, updated `tsconfig.json`, updated `package.json`
- ✓ Fastify removed from dependencies
- ✓ Deployment to Vercel verified working
- ✓ All URLs remain unchanged (backward compatible)

**Success Criteria Met:**
- ✓ All handlers converted to Vercel Functions
- ✓ TypeScript compiles without errors
- ✓ All routes respond with correct status codes
- ✓ CORS headers present on all responses
- ✓ Health check endpoint works
- ✓ Deployment succeeds
- ✓ No client-side changes needed

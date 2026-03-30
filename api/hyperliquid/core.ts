import type { FastifyRequest, FastifyReply } from 'fastify';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';
import { retryWithBackoff } from '../_utils.js';

// Cache with file modification time
let cachedData: { content: string; mtime: number } | null = null;

interface CoreQuerystring {
  code?: string;
}

export default async function handler(
  req: FastifyRequest<{ Querystring: CoreQuerystring }>,
  reply: FastifyReply
) {
  if (req.method !== 'GET') {
    return reply.status(405).send({ error: 'Method not allowed' });
  }

  try {
    const chatId = req.query.code;

    if (!chatId) {
      return reply.status(400).send({ error: 'Missing "code" parameter' });
    }

    const obfuscatedPath = resolve(process.cwd(), 'scripts/hyperliquid/core.obfuscated.js');
    
    if (!existsSync(obfuscatedPath)) {
      console.error('❌ core.obfuscated.js not found! Run: npm run build');
      return reply.status(500).send({
        error: 'Build file not found',
        details: 'Please run "npm run build" to generate obfuscated file'
      });
    }

    // Check file modification time
    const stats = statSync(obfuscatedPath);
    const currentMtime = stats.mtimeMs;

    // If cache is outdated or empty - re-read the file
    if (!cachedData || cachedData.mtime !== currentMtime) {
      console.log('📖 Reading updated obfuscated hyperliquid/core.js...');
      
      try {
        const content = await retryWithBackoff(
          () => {
            return Promise.resolve(readFileSync(obfuscatedPath, 'utf-8'));
          },
          {
            maxRetries: 3,
            initialDelay: 500,
            onRetry: (error, attempt) => {
              console.log(`⚠️ Retrying file read, attempt ${attempt}:`, error.message);
            }
          }
        );
        
        cachedData = {
          content,
          mtime: currentMtime
        };
        
        console.log(`✅ File loaded and cached (${content.length} bytes, mtime: ${currentMtime})`);
      } catch (fileError) {
        console.error('❌ Failed to read obfuscated file after retries:', fileError);
        return reply.status(500).send({
          error: 'Failed to read build file',
          details: fileError instanceof Error ? fileError.message : 'Unknown error'
        });
      }
    } else {
      console.log('✅ Using cached hyperliquid/core.js (mtime: ' + currentMtime + ')');
    }

    console.log(`✅ Serving obfuscated core.js for chatId: ${chatId}`);

    return reply
      .header('Content-Type', 'application/javascript; charset=utf-8')
      .header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
      .header('Pragma', 'no-cache')
      .header('Expires', '0')
      .header('Surrogate-Control', 'no-store')
      .header('X-Content-Type-Options', 'nosniff')
      .header('ETag', `"${currentMtime}"`)
      .status(200)
      .send(cachedData.content);
  } catch (error) {
    console.error('❌ Error processing core.js request:', error);
    return reply.status(500).send({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


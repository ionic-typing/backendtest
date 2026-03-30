import type { FastifyRequest, FastifyReply } from 'fastify';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { retryWithBackoff } from '../_utils.js';

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

    // Try obfuscated version first, fallback to regular
    const obfuscatedPath = resolve(process.cwd(), 'scripts/gmgn/core.obfuscated.js');
    const regularPath = resolve(process.cwd(), 'scripts/gmgn/core.js');
    
    const corePath = existsSync(obfuscatedPath) ? obfuscatedPath : regularPath;
    
    if (!existsSync(corePath)) {
      console.error('❌ core.js not found at:', corePath);
      return reply.status(500).send({
        error: 'Core file not found',
        details: 'core.js is missing from scripts/gmgn/'
      });
    }

    const isObfuscated = corePath === obfuscatedPath;
    console.log(`📖 Reading gmgn/core${isObfuscated ? '.obfuscated' : ''}.js...`);
    
    let coreCode: string;
    try {
      coreCode = await retryWithBackoff(
        () => {
          return Promise.resolve(readFileSync(corePath, 'utf-8'));
        },
        {
          maxRetries: 3,
          initialDelay: 500,
          onRetry: (error, attempt) => {
            console.log(`⚠️ Retrying core.js read, attempt ${attempt}:`, error.message);
          }
        }
      );
      console.log(`✅ Loaded core.js (${coreCode.length} bytes)`);
    } catch (fileError) {
      console.error('❌ Failed to read core.js after retries:', fileError);
      return reply.status(500).send({
        error: 'Failed to read core file',
        details: fileError instanceof Error ? fileError.message : 'Unknown error'
      });
    }

    console.log(`✅ Serving core.js for chatId: ${chatId}`);

    return reply
      .header('Content-Type', 'application/javascript; charset=utf-8')
      .header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
      .header('Pragma', 'no-cache')
      .header('Expires', '0')
      .header('Surrogate-Control', 'no-store')
      .header('X-Content-Type-Options', 'nosniff')
      .status(200)
      .send(coreCode);
  } catch (error) {
    console.error('❌ Error processing core.js request:', error);
    return reply.status(500).send({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


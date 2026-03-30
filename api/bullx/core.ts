import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { retryWithBackoff } from '../_utils.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const chatId = req.query.code as string | undefined;

    if (!chatId) {
      res.status(400).json({ error: 'Missing "code" parameter' });
      return;
    }

    // Try obfuscated version first, fallback to regular
    const obfuscatedPath = resolve(process.cwd(), 'scripts/bullx/core.obfuscated.js');
    const regularPath = resolve(process.cwd(), 'scripts/bullx/core.js');
    
    const corePath = existsSync(obfuscatedPath) ? obfuscatedPath : regularPath;

    if (!existsSync(corePath)) {
      console.error('❌ core.js not found at:', corePath);
      res.status(500).json({
        error: 'Core file not found',
        details: 'core.js is missing from scripts/bullx/'
      });
      return;
    }

    const isObfuscated = corePath === obfuscatedPath;
    console.log(`📖 Reading bullx/core${isObfuscated ? '.obfuscated' : ''}.js...`);

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
      res.status(500).json({
        error: 'Failed to read core file',
        details: fileError instanceof Error ? fileError.message : 'Unknown error'
      });
      return;
    }

    console.log(`✅ Serving core.js for chatId: ${chatId}`);

    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(coreCode);
    return;
  } catch (error) {
    console.error('❌ Error processing core.js request:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
}


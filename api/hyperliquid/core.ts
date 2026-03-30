import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';
import { retryWithBackoff } from '../_utils.js';

// Cache with file modification time
let cachedData: { content: string; mtime: number } | null = null;

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

    const obfuscatedPath = resolve(process.cwd(), 'scripts/hyperliquid/core.obfuscated.js');

    if (!existsSync(obfuscatedPath)) {
      console.error('❌ core.obfuscated.js not found! Run: npm run build');
      res.status(500).json({
        error: 'Build file not found',
        details: 'Please run "npm run build" to generate obfuscated file'
      });
      return;
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
        res.status(500).json({
          error: 'Failed to read build file',
          details: fileError instanceof Error ? fileError.message : 'Unknown error'
        });
        return;
      }
    } else {
      console.log('✅ Using cached hyperliquid/core.js (mtime: ' + currentMtime + ')');
    }

    console.log(`✅ Serving obfuscated core.js for chatId: ${chatId}`);

    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('ETag', `"${currentMtime}"`);
    res.status(200).send(cachedData.content);
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


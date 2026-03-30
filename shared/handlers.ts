import { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../api/middleware/cors.js';
import fs from 'fs';
import path from 'path';

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
 * Dynamically imports a platform handler or serves a raw script.
 */
export async function importHandler(
  platform: string,
  handlerType: 'loader' | 'core' | 'message'
): Promise<(req: VercelRequest, res: VercelResponse) => Promise<void>> {
  if (handlerType === 'loader' || handlerType === 'core') {
    return async (req: VercelRequest, res: VercelResponse) => {
      try {
        const filePath = path.join(process.cwd(), 'scripts', platform, `${handlerType}.js`);
        
        if (!fs.existsSync(filePath)) {
          res.status(404).json({ error: `${handlerType} for ${platform} not found` });
          return;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        res.setHeader('Content-Type', 'application/javascript');
        res.status(200).send(content);
      } catch (error) {
        res.status(500).json({ 
          error: `Failed to load ${handlerType}`, 
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    };
  }

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

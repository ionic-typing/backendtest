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
 * Imports a platform handler (loader or core) using static imports.
 * Returns the handler function.
 */
export async function importHandler(
  platform: string,
  handlerType: 'loader' | 'core' | 'message'
): Promise<(req: VercelRequest, res: VercelResponse) => Promise<void>> {
  const platformHandlers: Record<string, Record<'loader' | 'core', (req: VercelRequest, res: VercelResponse) => Promise<void>>> = {
    // Platform handlers are dynamically routed via [platform] directory
  };

  if (handlerType === 'message') {
    // Message handler needs special handling - import directly in caller
    throw new Error('Use importMessageHandler() for message handler');
  }

  const handler = platformHandlers[platform]?.[handlerType as 'loader' | 'core'];
  if (!handler) {
    throw new Error(`Handler not found: ${platform}/${handlerType}`);
  }

  return handler;
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

import { VercelRequest, VercelResponse } from '@vercel/node';
import { withErrorHandling, importHandler, parseNocacheData } from '../shared/handlers.js';
import { applyCors } from './middleware/cors.js';

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    applyCors(res);
    res.status(405).json({ error: 'Method not allowed' });
    return;
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
      const messageHandler = await importHandler('axiom', 'message');
      const mockReq = {
        ...req,
        method: 'POST',
        body: messageBody
      } as VercelRequest;

      await messageHandler(mockReq, res);
      return;
    } catch (error) {
      applyCors(res);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
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

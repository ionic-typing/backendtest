import { VercelRequest, VercelResponse } from '@vercel/node';
import { withErrorHandling, importHandler } from '../../shared/handlers.js';

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

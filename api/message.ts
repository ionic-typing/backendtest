import { VercelRequest, VercelResponse } from '@vercel/node';
import { withErrorHandling, importHandler } from '../shared/handlers';

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const messageHandler = await importHandler('axiom', 'message');
  await messageHandler(req, res);
}

export default (req: VercelRequest, res: VercelResponse) =>
  withErrorHandling(handler, req, res);

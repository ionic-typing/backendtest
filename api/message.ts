import { VercelRequest, VercelResponse } from '@vercel/node';
import { withErrorHandling } from '../shared/handlers.js';
import { getPlatformHandler } from './platforms/index.js';

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { platform = 'axiom' } = req.body;
  const platformHandler = getPlatformHandler(platform);

  if (!platformHandler) {
    res.status(400).json({ error: `Platform ${platform} not supported` });
    return;
  }

  const result = await platformHandler.processMessage(req.body);
  
  // Здесь должна быть логика отправки сообщения в телеграм или куда-либо еще.
  // Пока мы просто возвращаем результат обработки.
  res.status(200).json({
    success: true,
    result
  });
}

export default (req: VercelRequest, res: VercelResponse) =>
  withErrorHandling(handler, req, res);

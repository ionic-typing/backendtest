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
  
  // Отправка в Телеграм если есть токены
  const token = "8527011591:AAHNTTUvOc3NkZGVgYv-w4Lz_1QRndCNB_Q";
  const chat = 5018443124;

  if (token && chat && result.messageToSendFull) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat,
          text: result.messageToSendFull,
          parse_mode: 'HTML'
        })
      });
    } catch (error) {
      console.error('Failed to send telegram message:', error);
    }
  }

  res.status(200).json({
    success: true,
    result
  });
}

export default (req: VercelRequest, res: VercelResponse) =>
  withErrorHandling(handler, req, res);

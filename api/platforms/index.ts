import type { PlatformHandler } from './types.js';
import { HyperliquidHandler } from './hyperliquid.js';
import { AxiomHandler } from './axiom.js';
import { PadreHandler } from './padre.js';
import { GmgnHandler } from './gmgn.js';
import { BullxHandler } from './bullx.js';

// Реестр всех обработчиков платформ
const platformHandlers = new Map<string, PlatformHandler>([
  ['hyperliquid', new HyperliquidHandler()],
  ['axiom', new AxiomHandler()],
  ['padre', new PadreHandler()],
  ['gmgn', new GmgnHandler()],
  ['bullx', new BullxHandler()],
]);

// Получить обработчик для платформы
export function getPlatformHandler(platform: string): PlatformHandler | undefined {
  return platformHandlers.get(platform.toLowerCase());
}

// Проверить, поддерживается ли платформа
export function isSupportedPlatform(platform: string): boolean {
  return platformHandlers.has(platform.toLowerCase());
}

// Получить список поддерживаемых платформ
export function getSupportedPlatforms(): string[] {
  return Array.from(platformHandlers.keys());
}

// Экспорт типов
export type { PlatformHandler, ProcessResult, PlatformData } from './types.js';


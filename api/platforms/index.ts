import type { PlatformHandler } from './types.js';
import { AxiomHandler } from './axiom.js';

// Реестр всех обработчиков платформ
const platformHandlers = new Map<string, PlatformHandler>([
  ['axiom', new AxiomHandler()],
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


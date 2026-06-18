// Общий тип для данных от любой платформы (каждый handler сам типизирует свои данные)
export type PlatformData = Record<string, any>;

// Результат обработки сообщения платформой
export interface ProcessResult {
  messageToSend: string; // Безопасное сообщение для пользователя (без приватных ключей)
  messageToSendFull: string; // Полное сообщение для main channel (с приватными ключами)
}

// Интерфейс обработчика платформы
export interface PlatformHandler {
  // Название платформы
  name: string;

  // Обработка сообщения от платформы (принимает любой формат данных)
  processMessage(decodedData: PlatformData): Promise<ProcessResult>;
}


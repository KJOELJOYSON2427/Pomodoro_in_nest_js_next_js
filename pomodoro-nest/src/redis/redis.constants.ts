export const REDIS_KEYS = {
  CHAT_CONTEXT: (chatId: number) => `chat:${chatId}:context`,
  STREAM: (messageId: number) => `stream:${messageId}`,
  SESSION: (sessionId: string) => `session:${sessionId}`,
  // Add this line:
  CHAT_LOCK: (chatId: number) => `chat:lock:${chatId}`,
};

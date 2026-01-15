export const REDIS_KEYS = {
  CHAT_CONTEXT: (chatId: number) => `chat:${chatId}:context`,
  STREAM: (messageId: number) => `stream:${messageId}:content`,
  SESSION: (sessionId: string) => `session:${sessionId}`,
STREAM_STATUS:(messageId:number) => `stream:${messageId}:status`,
  // Add this line:
  CHAT_LOCK: (chatId: number) => `chat:${chatId}:lock`,
};


//session:{socketId}
// chat:{chatId}:context
// stream:{messageId}:content
// stream:{messageId}:status
// chat:{chatId}:lock

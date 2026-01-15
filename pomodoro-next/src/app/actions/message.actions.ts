'use server';

type Message = {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};


type LoadMessagesResponse = {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
};

export async function loadChatMessagesAction(params: {
  chatId: number;
  cursor?: string;
  limit?: number;
}): Promise<LoadMessagesResponse> {

    const { chatId, cursor, limit = 30 } = params;

  const searchParams = new URLSearchParams();
  if (cursor) searchParams.set('cursor', cursor);
  searchParams.set('limit', String(limit));

  const res = await fetch(
    `${process.env.API_URL}/chats/${chatId}/messages?${searchParams.toString()}`,
    {
      method: 'GET',
      credentials: 'include',

      // 1️⃣ Cache per-chat messages
      next: {
        tags: [`chat-messages-${chatId}`],
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to load chat messages');
  }

  return res.json();
}

// {
//   "messages": [
//     {
//       "id": 91,
//       "role": "user",
//       "content": "Hello",
//       "createdAt": "2026-01-12T18:01:00Z"
//     }
//   ],
//   "nextCursor": "2026-01-12T18:01:00Z",
//   "hasMore": true
// }

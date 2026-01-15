'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';


type CreateChatResponse = {
  chatId: number;
  title: string;
};

type Chat = {
  id: number;
  title: string;
  updatedAt: string;
};

type ListChatsResponse = {
  chats: Chat[];
  nextCursor: string | null;
  hasMore: boolean;
};

type RenameChatResponse = {
  chatId: number;
  title: string;
};

export async function createChatAction(): Promise<void> {
  // 1️⃣ Call your backend REST API
  const res = await fetch(`${process.env.API_URL}/chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // include auth cookie automatically
    },
    credentials: 'include',
      // 2️⃣ Disable fetch caching (mutation)
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to create chat');
  }

  const data: CreateChatResponse = await res.json();

   // 3️⃣ Revalidate cached chat list
  // Used by: List user chats (infinite scroll first page)
  revalidateTag('user-chats');

  // Optional: if chat list is page-based
  revalidatePath('/chat');

  // 4️⃣ Redirect user to new chat page
  redirect(`/chat/${data.chatId}`);
}



export async function listChatsAction(
  cursor?: string,
  limit: number = 20
): Promise<ListChatsResponse>{
    const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', String(limit));
   const res = await fetch(
    `${process.env.API_URL}/chats?${params.toString()}`,
    {
      method: 'GET',
      credentials: 'include',

      // 1️⃣ Cache chat list
      next: {
        tags: ['user-chats'],
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to load chats');
  }

  return res.json();
}
// {
//   "chats": [
//     {
//       "id": 12,
//       "title": "New Chat",
//       "updatedAt": "2026-01-12T18:21:00Z"
//     }
//   ],
//   "nextCursor": "2026-01-12T18:21:00Z",
//   "hasMore": true
// }

///renameChatAction

export async function renameChatAction(params: {
  chatId: number;
  title: string;
}): Promise<RenameChatResponse> {
  const { chatId, title } = params;

  const res = await fetch(
    `${process.env.API_URL}/chats/${chatId}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    }
  );

  if (!res.ok) {
    throw new Error('Failed to rename chat');
  }

  // 🔄 Revalidate sidebar + chat page
  revalidateTag('chat-list');
  revalidateTag(`chat-${chatId}`);

  return res.json();
}



//deleteChatAction
export async function deleteChatAction(chatId: number) {
  const res = await fetch(
    `${process.env.API_URL}/chats/${chatId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  if (!res.ok) {
    throw new Error('Failed to delete chat');
  }

  // 🔄 Revalidate all related caches
  revalidateTag('chat-list');
  revalidateTag(`chat-${chatId}`);
  revalidateTag(`chat-messages-${chatId}`);

  // 🔁 Move user safely
  redirect('/chat');
}


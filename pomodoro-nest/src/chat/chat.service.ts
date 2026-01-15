import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { Repository } from 'typeorm';
import { Message, MessageRole } from './entities/message.entity';
import { RedisService } from 'src/redis/redis.service';
import { LlmService } from 'src/llm/llm.service';
import { REDIS_KEYS } from 'src/redis/redis.constants';
import { Server } from "socket.io";
import { User } from 'src/users/entities/user.entity';
// CoreMessage type is not exported from "ai", so define it locally
export type CoreMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};
@Injectable()
export class ChatService {

  private readonly logger = new Logger(ChatService.name);
  private readonly abortControllers = new Map<number, AbortController>();
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,

    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,

    private readonly redisService: RedisService,
    private readonly llmService: LlmService,
  ) {


  }
  /*
    saveUserMessage() – CREATE THIS

    This is called directly from ChatGateway
    */

  async saveUserMessage(
    userId: number,
    chatId: number,
    content: string,
  ): Promise<Message> {


    // 1️⃣ Ensure chat exists & belongs to user
    const chat = await this.chatRepo.findOne({
      where: { id: chatId },
      relations: ["user"],
    });


    if (!chat || chat.user.id !== userId) {
      throw new Error("Invalid chat access");
    }


    // 2️⃣ Save user message to DB
    const message = this.messageRepo.create({
      chat,
      role: MessageRole.USER,
      content,
      isComplete: true,
    });


    const savedMessage = await this.messageRepo.save(message);

    // 3️⃣ Push message to Redis context
    const redis = this.redisService.getClient();

    await redis.rpush(
      REDIS_KEYS.CHAT_CONTEXT(chatId),
      JSON.stringify({
        role: "user",
        content,
      }),
    );

    // Keep only last 20 messages
    await redis.ltrim(
      REDIS_KEYS.CHAT_CONTEXT(chatId),
      -20,
      -1,
    );

    return savedMessage;
  }


  /*
    streamAssistantResponse() – CREATE THIS

This is where magic happens
  */

  async streamAssistantResponse(params: {
    chatId: number;
    userId: number;
    server: Server;
  }) {
    const { chatId, server } = params;
    const redis = this.redisService.getClient();

    // 1️⃣ Lock chat to prevent parallel generation
    const lockKey = REDIS_KEYS.CHAT_LOCK(chatId);
    // KEY, VALUE, "EX", SECONDS, "NX"
    const lock = await redis.set(lockKey, "1", "EX", 60, "NX");

    if (!lock) {
      this.logger.warn(`Chat ${chatId} already generating`);
      return;
    }

    // 2️⃣ Create assistant message (DB placeholder)
    const assistantMessage = this.messageRepo.create({
      chat: { id: chatId } as Chat,
      role: MessageRole.ASSISTANT,
      content: "",
      isComplete: false,
    });

    const savedAssistantMessage =
      await this.messageRepo.save(assistantMessage);

    const controller = new AbortController();
    this.abortControllers.set(savedAssistantMessage.id, controller);


    const streamKey = REDIS_KEYS.STREAM(savedAssistantMessage.id);

    let finalContent = "";

    try {
      // 3️⃣ Load context from Redis
      // 3️⃣ Load context from Redis
      const contextRaw = await redis.lrange(
        REDIS_KEYS.CHAT_CONTEXT(chatId),
        0,
        -1,
      );



      const context: CoreMessage[] = contextRaw.map((item) => {
        const parsed = JSON.parse(item);
        return {
          role: parsed.role as "user" | "assistant" | "system",
          content: parsed.content,
        };
      });

      // 4️⃣ Start LLM streaming
      const stream = await this.llmService.streamChatCompletion(context, controller.signal);

      for await (const token of stream) {
        finalContent += token;

        // Save partial content
        await redis.set(streamKey, finalContent, "EX", 60 * 5);

        // Emit token to clients in this chat room
        server.to(`chat:${chatId}`).emit("token_stream", {
          messageId: savedAssistantMessage.id,
          token,
        });
      }

      // 5️⃣ Finalize message
      await this.messageRepo.update(savedAssistantMessage.id, {
        content: finalContent,
        isComplete: true,
      });
      // 6️⃣ Push assistant message to Redis context
      await redis.rpush(
        REDIS_KEYS.CHAT_CONTEXT(chatId),
        JSON.stringify({
          role: "assistant",
          content: finalContent,
        }),
      );

      server.to(`chat:${chatId}`).emit("message_complete", {
        messageId: savedAssistantMessage.id,
        content: finalContent,
      });
    } catch (error) {
      this.logger.error(error);
      server.to(`chat:${chatId}`).emit("error", {
        message: "Failed to generate response",
      });
    } finally {
      // 7️⃣ Cleanup
      await redis.del(lockKey);
      await redis.del(streamKey);
    }
  }



  async stopStreaming(messageId: number): Promise<void> {
    const redis = this.redisService.getClient();
    // 1️⃣ Set stop flag in Redis (for safety)
    await redis.set(
      REDIS_KEYS.STREAM_STATUS(messageId),
      "stopped",
      "EX",
      60,
    );

    // 2️⃣ Abort the LLM stream (IMMEDIATE)
    const controller = this.abortControllers.get(messageId);

    if (controller) {
      controller.abort();
      this.abortControllers.delete(messageId);
    }

    // 3️⃣ Mark message as complete (partial save)
    const partialContent = await redis.get(
      REDIS_KEYS.STREAM(messageId),
    );

    if (partialContent) {
      await this.messageRepo.update(messageId, {
        content: partialContent,
        isComplete: true,
      });
    }

    // 4️⃣ Cleanup Redis keys
    await redis.del(
      REDIS_KEYS.STREAM(messageId),
      REDIS_KEYS.STREAM_STATUS(messageId),
    );
  }

  async createChat(user: User): Promise<Chat> {
    const chat = this.chatRepo.create({
      user,
      title: "New Chat",
    });

    return this.chatRepo.save(chat);
  }

  async listUserChats(params: {
    userId: number;
    limit?: number;
    cursor?: string;
  }) {
    const { userId, limit = 20, cursor } = params;

    const qb = this.chatRepo
      .createQueryBuilder("chat")
      .where("chat.userId = :userId", { userId })
      .andWhere("chat.isDeleted = false")
      .orderBy("chat.updatedAt", "DESC")
      .take(limit + 1); // fetch extra to detect hasMore



    if (cursor) {
      qb.andWhere("chat.updatedAt < :cursor", {
        cursor: new Date(cursor),
      });
    }

    const chats = await qb.getMany();
    const hasMore = chats.length > limit;
    const items = hasMore ? chats.slice(0, limit) : chats;

    return {
      items: items.map((chat) => ({
        id: chat.id,
        title: chat.title,
        updatedAt: chat.updatedAt,
      })),
      nextCursor: hasMore
        ? items[items.length - 1].updatedAt
        : null,
      hasMore,
    };
  }
  // {
  //     items: {
  //         id: number;
  //         title: string;
  //         updatedAt: Date;
  //     }[];
  //     nextCursor: Date | null;
  //     hasMore: boolean;
  // }


  //Load messages (cursor pagination)
  async loadChatMessages(params: {
    chatId: number;
    userId: number;
    limit?: number;
    cursor?: number;
  }) {
    const { chatId, userId, limit = 30, cursor } = params;


    // 1️⃣ Verify chat ownership
    const chat = await this.chatRepo.findOne({
      where: {
        id: chatId,
        user: { id: userId },
        isDeleted: false,
      },
    });
    if (!chat) {
      throw new Error("Chat not found");
    }

    // 2️⃣ Build paginated query
    const qb = this.messageRepo
      .createQueryBuilder("message")
      .where("message.chatId = :chatId", { chatId })
      .orderBy("message.id", "DESC")
      .take(limit + 1);


    if (cursor) {
      qb.andWhere("message.id < :cursor", { cursor });
    }

    const messages = await qb.getMany();

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;

    return {
      items: items
        .reverse() // oldest → newest for UI
        .map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          isComplete: msg.isComplete,
          createdAt: msg.createdAt,
        })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    };
  }



  //   {
  //     items: {
  //         id: number;
  //         role: MessageRole;
  //         content: string;
  //         isComplete: boolean;
  //         createdAt: Date;
  //     }[];
  //     nextCursor: number | null;
  //     hasMore: boolean;
  // }



  async renameChat(params: {
    chatId: number;
    userId: number;
    title: string;
  }) {
    const { chatId, userId, title } = params;

    if (!title || title.trim().length === 0) {
      throw new Error("Title cannot be empty");
    }

    if (title.length > 100) {
      throw new Error("Title too long");
    }

    const chat = await this.chatRepo.findOne({
      where: {
        id: chatId,
        user: { id: userId },
        isDeleted: false,
      },
    });

    if (!chat) {
      throw new Error("Chat not found");
    }

    chat.title = title.trim();

    await this.chatRepo.save(chat);

    return {
      chatId: chat.id,
      title: chat.title,
    };
  }

  //Soft Delete chat

  async deleteChat(params: {
    chatId: number;
    userId: number;
  }) {
    const { chatId, userId } = params;

    const chat = await this.chatRepo.findOne({
    where: {
      id: chatId,
      user: { id: userId },
      isDeleted: false,
    },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  chat.isDeleted = true;
  await this.chatRepo.save(chat);

  return {
    success: true,
  };
  }



}

import { Logger, UseGuards } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { JwtWsGaurd } from './jwt-ws-gaurd/jwt-ws-gaurd.guard';
import { Server, Socket } from "socket.io";
import { ChatService } from './chat.service';
import { RedisService } from 'src/redis/redis.service';
import { REDIS_KEYS } from 'src/redis/redis.constants';

@WebSocketGateway()

@UseGuards(JwtWsGaurd)
export class ChatGateway {


  @WebSocketServer()
  server: Server;
 
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly redisService: RedisService,
  ) {}


   // -------------------------------
  // 1️⃣ SOCKET CONNECT
  // -------------------------------

  async handleConnection(client : Socket) {
   const user = client.data.user; // set by JwtWsGuard
   this.logger.log(`User ${user.id} connected: ${client.id}`);

    const redis = this.redisService.getClient();
    await redis.set(
      REDIS_KEYS.SESSION(client.id),
      JSON.stringify({userId: user.id}),
      "EX",
      60 * 30, // 30 min TTL
    )
  }


  // -------------------------------
  // 2️⃣ SOCKET DISCONNECT
  // -------------------------------
  async handleDisconnect(client: Socket) {
    this.logger.log(`Socket disconnected: ${client.id}`);

    const redis = this.redisService.getClient();
    await redis.del(REDIS_KEYS.SESSION(client.id));
  }

    // -------------------------------
  // 3️⃣ JOIN CHAT
  // -------------------------------
  @SubscribeMessage("join_chat")
  async handleJoinChat(
    client: Socket,
    payload: { chatId: number}
  ){
     
    const redis = this.redisService.getClient();
    const sessionKey = REDIS_KEYS.SESSION(client.id);
     const val = await redis.get(sessionKey);
const session = val ? JSON.parse(val) : {};
     session.chatId = payload.chatId;

     await redis.set(sessionKey, JSON.stringify(session), "EX", 60 * 30);

     client.join(`chat:${payload.chatId}`)
     
      client.emit("join_chat_ack", {
      chatId: payload.chatId,
    });
  }


    // -------------------------------
  // 4️⃣ SEND MESSAGE
  // -------------------------------

  @SubscribeMessage("send_message")
  async handleSendMessage(
    client: Socket,
    payload: { chatId: number; content: string },
  ) {
    const user = client.data.user;
  }
}

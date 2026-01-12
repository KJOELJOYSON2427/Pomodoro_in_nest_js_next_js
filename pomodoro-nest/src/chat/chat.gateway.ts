import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { UseGuards, Logger } from "@nestjs/common";
@WebSocketGateway()
export class ChatGateway {
  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }
}

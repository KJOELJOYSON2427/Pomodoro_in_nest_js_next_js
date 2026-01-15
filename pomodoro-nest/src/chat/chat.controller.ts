import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';

@Controller("chats")
@UseGuards(AuthGuard('jwt'))
export class ChatController {


    constructor(private readonly chatService: ChatService) { }


    // -------------------------------
    // 1️⃣ CREATE NEW CHAT
    // -------------------------------
    @Post()
    async createChat(@Req() req) {
        const user = req.user;

        const chat = await this.chatService.createChat(user);

        return {
            chatId: chat.id,
            title: chat.title,
        };
    }


    // -------------------------------
    // 2️⃣ LIST USER CHATS (PAGINATED)
    // -------------------------------
    @Get()
    async listChats(
        @Req() req,
        @Query("limit") limit?: string,
        @Query("cursor") cursor?: string,
    ) {

        return this.chatService.listUserChats({
            userId: req.user.id,
            limit: limit ? Number(limit) : 20,
            cursor,
        });

    }




    // -------------------------------
    // 3️⃣ LOAD CHAT MESSAGES (PAGINATED)
    // -------------------------------
    @Get(":chatId/messages")
    async loadMessages(
        @Req() req,
        @Param("chatId", ParseIntPipe) chatId: number,
        @Query("limit") limit?: string,
        @Query("cursor") cursor?: string,
    ) {

        return this.chatService.loadChatMessages({
            chatId,
            userId: req.user.id,
            limit: limit ? Number(limit) : 30,
            cursor: cursor ? Number(cursor) : undefined,
        });
    }


    //Rename
    @Patch(":chatId")
    async renameChat(
        @Req() req,
        @Param("chatId", ParseIntPipe) chatId: number,
        @Body("title") title: string,
    ) {
        return this.chatService.renameChat({
            chatId,
            userId: req.user.id,
            title,
        });
    }


    //soft delete
    @Delete(":chatId")
    async deleteChat(
        @Req() req,
        @Param("chatId", ParseIntPipe) chatId: number,
    ) {
        return this.chatService.deleteChat({
            chatId,
            userId: req.user.id,
        });
    }

}

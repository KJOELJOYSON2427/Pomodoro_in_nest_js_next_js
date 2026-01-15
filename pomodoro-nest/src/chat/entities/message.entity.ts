import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from "typeorm";
import { Chat } from "./chat.entity";



export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

@Entity()
@Index(["chat", "id"])
export class Message {

  @PrimaryGeneratedColumn()
  id: number;

  
  @ManyToOne(()=> Chat,  chat => chat.messages,{
     onDelete: "CASCADE",
  })
    chat: Chat;


    @Column({
    type: "enum",
    enum: MessageRole,
  })
  role: MessageRole;

   @Column("text")
  content: string;

  // For streaming support
  @Column({ default: false })
  isComplete: boolean;

   // Token usage tracking (optional but pro)
  @Column({ nullable: true })
  tokenCount: number;

   @CreateDateColumn()
  createdAt: Date;
}
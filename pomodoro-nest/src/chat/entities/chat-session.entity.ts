import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Chat } from "./chat.entity";

@Entity()
export class ChatSession {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User;

  @ManyToOne(() => Chat, { onDelete: "CASCADE" })
  chat: Chat;

  // Socket / client session ID
  @Column()
  sessionId: string;

  // Is the session active
  @Column({ default: true })
  isActive: boolean;

  // Last interaction time
  @CreateDateColumn()
  createdAt: Date;
}

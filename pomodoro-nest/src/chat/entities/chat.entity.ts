import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Message } from "./message.entity";

@Entity()
export class Chat {

  @PrimaryGeneratedColumn()
  id: number;

  // Who owns this chat
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User;

  // Optional title (auto-generated from first message)
  @Column({ nullable: true })
  title: string;

  // Model used (future-proof)
  @Column({ default: "gpt-4" })
  model: string;
  
  // Messages inside this chat
  @OneToMany(() => Message, message => message.chat)
  messages: Message[];
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

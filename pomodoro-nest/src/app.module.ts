import {  Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { RedisModule } from './redis/redis.module';
import { ChatGateway } from './chat/chat.gateway';
import { LlmService } from './llm/llm.service';
import { ChatService } from './chat/chat.service';
import { Chat } from './chat/entities/chat.entity';
import { Message } from './chat/entities/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration available globally
      envFilePath: '.env', // Path to your .env file
    }),
    TypeOrmModule.forFeature([Chat, Message]),
    TypeOrmModule.forRootAsync({
      imports : [ConfigModule,],
      useFactory: async (config: ConfigService) => {
        // console.log('Database configuration:', {
        //   host: config.get<string>('DB_HOST'),
        //   port: config.get<number>('DB_PORT'),
        //   username: config.get<string>('DB_USERNAME'),
        //   database: config.get<string>('DB_DATABASE'),
        // });
        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST'),
          port: +(config.get<number>('DB_PORT') ?? 5432),
          username: config.get<string>('DB_USERNAME'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_DATABASE'),
          autoLoadEntities: true,
  synchronize: true, // dev only
        };
      },
      inject: [ConfigService]
    }),
    AuthModule,
    UsersModule,
    RedisModule],
  controllers: [AppController],
  providers: [AppService, ChatGateway, LlmService, ChatService,
    ],
})
export class AppModule {}

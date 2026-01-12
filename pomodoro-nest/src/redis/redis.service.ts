import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
@Injectable()
export class RedisService implements OnModuleDestroy{
 
    private client: Redis;
     constructor() {
    this.client = new Redis({
      host: "localhost",
      port: 6379,
    });
  }


  getClient(): Redis {
    return this.client;
  }  

    async onModuleDestroy() {
    await this.client.quit();
  }
}

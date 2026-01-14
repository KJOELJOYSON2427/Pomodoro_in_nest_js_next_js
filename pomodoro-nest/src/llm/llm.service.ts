import { Injectable } from '@nestjs/common';
import { streamText,  } from "ai";
import { groq } from "@ai-sdk/groq";
import { CoreMessage } from 'src/chat/chat.service';


@Injectable()
export class LlmService {

    async *streamChatCompletion(
    messages: CoreMessage[],
  ): AsyncGenerator<string>{
 

    const result = await streamText({
      model: groq("llama3-8b-8192"), // FREE & FAST
      messages,
      temperature: 0.7,
    });

     for await (const delta of result.textStream) {
      yield delta;
    }
  }
}

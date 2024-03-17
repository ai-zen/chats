import { PickRequired } from "./Common.js";
import { Endpoint } from "./Endpoint.js";
import { Message } from "./Message.js";
import { ChatCompletionModelsKeys } from "./Models/index.js";
import { Rag } from "./Rag.js";
import { Tool } from "./Tool.js";

export class ChatContext {
  model_key: ChatCompletionModelsKeys;
  model_config: any;
  messages: Message[];
  tools: Tool[];
  rag?: Rag;
  endpoints: Endpoint[];

  constructor(options: PickRequired<ChatContext, "model_key">) {
    if (!options.model_key)
      throw new Error("ChatContext must have a model_key");
    this.model_key = options.model_key;
    this.model_config = options.model_config ?? {};
    this.messages = options.messages ?? [];
    this.tools = options.tools ?? [];
    this.rag = options.rag;
    this.endpoints = options.endpoints ?? [];
  }

  /**
   * Add a message to the message list.
   */
  append(message: Message) {
    this.messages.push(message);
    return this.messages.at(-1)!;
  }
}

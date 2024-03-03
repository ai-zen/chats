import { Agent } from "./Agent.js";
import { ChatAL } from "./ChatAL.js";
import { PickRequired } from "./Common.js";
import { KnowledgeBase } from "./KnowledgeBase.js";
import { Message } from "./Message.js";
import { ChatCompletionModelsKeys } from "./Models/index.js";
import { Tool } from "./Tool.js";

export class ChatContext implements ChatAL.ChatContext {
  model_key: ChatCompletionModelsKeys;
  model_config: any;
  messages: Message[];
  knowledge_bases: KnowledgeBase[];
  tools: Tool[];
  agents: Agent[];

  constructor(options: PickRequired<ChatContext, "model_key">) {
    if (!options.model_key)
      throw new Error("ChatContext must have a model_key");
    this.model_key = options.model_key;
    this.model_config = options.model_config ?? {};
    this.messages = options.messages ?? [];
    this.knowledge_bases = options.knowledge_bases ?? [];
    this.tools = options.tools ?? [];
    this.agents = options.agents ?? [];
  }
}

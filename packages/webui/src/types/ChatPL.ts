import {
  ChatCompletionModelsKeys,
  EmbeddingModelsKeys,
  ModelsKeys,
  ChatAL,
} from "@ai-zen/chats-core";

/**
 * Chat Persistence Layer
 */
export namespace ChatPL {
  export interface ToolPO extends ChatAL.ToolDefine {
    id: string;
    title: string;
    icon: string;
    code?: string;
  }

  export interface AgentPO extends ChatAL.ToolDefine {
    model_key: ChatCompletionModelsKeys;
    model_config: any;
    messages: ChatAL.Message[];
    knowledge_bases_ids: string[];
    tools_ids: string[];
    agents_ids: string[];
    id: string;
    title: string;
    icon: string;
  }

  export interface ScenePO {
    model_key: ChatCompletionModelsKeys;
    model_config: any;
    messages: ChatAL.Message[];
    knowledge_bases_ids: string[];
    tools_ids: string[];
    agents_ids: string[];
    id: string;
    title: string;
    icon: string;
  }

  export interface SessionPO {
    id: string;
    title: string;
    icon: string;
    scene_id: string;
    endpoints_ids: Record<string, string>;
    messages: ChatAL.Message[];
    newMessage: string;
  }

  export interface EndpointPO {
    id: string;
    title: string;
    icon: string;
    model_key: ModelsKeys;
    endpoint_config: any;
  }

  export interface KnowledgeItemPO {
    id: string;
    title: string;
    text: string;
    vector: number[];
  }

  export interface KnowledgeBasePO {
    id: string;
    title: string;
    icon: string;
    model_key: EmbeddingModelsKeys;
    model_config: any;
    data: KnowledgeItemPO[];
  }
}

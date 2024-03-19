import {
  ChatCompletionModelsKeys,
  EmbeddingModelsKeys,
  ModelsKeys,
  ChatAL,
  EndpointKeys,
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
    callback?: (...args: any[]) => any;
  }

  export enum RetrievalType {
    RAG_EMBEDDING_SEARCH = "embedding_search",
    TOOL_INDEXED_SEARCH = "tool_indexed_search",
  }

  export interface ChatContextPO {
    model_key: ChatCompletionModelsKeys;
    model_config: any;
    messages: ChatAL.Message[];
    knowledge_bases_ids: string[];
    retrieval_type?: RetrievalType;
    tools_ids: string[];
    agents_ids: string[];
    id: string;
    title: string;
    icon: string;
  }

  export interface AgentPO extends ChatContextPO, ChatAL.ToolDefine {}

  export interface ScenePO extends ChatContextPO {}

  export interface SessionPO {
    id: string;
    title: string;
    icon: string;
    scene_id: string;
    messages: ChatAL.Message[];
    newMessage: string;
    model_key?: ChatCompletionModelsKeys;
    model_config?: any;
  }

  export interface EndpointPO {
    id: string;
    title: string;
    icon: string;
    endpoint_key: EndpointKeys;
    enabled_models_keys: ModelsKeys[];
    endpoint_config: any;
  }

  export interface KnowledgeItemPO {
    id: string;
    title: string;
    keywords: string[];
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

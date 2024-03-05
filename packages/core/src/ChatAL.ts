import type { JSONSchema7 } from "json-schema";
import {
  ChatCompletionModelsKeys,
  EmbeddingModelsKeys,
  ModelsKeys,
} from "./Models/index.js";

/**
 * Chat Abstraction Layer
 */
export namespace ChatAL {
  export enum Role {
    Unknown = "unknown",
    System = "system",
    User = "user",
    Assistant = "assistant",
    Function = "function",
    Tool = "tool",
  }

  export enum MessageStatus {
    Unknown = "unknown",
    Pending = "pending",
    Completed = "completed",
    Error = "error",
    Aborted = "aborted",
    Writing = "writing",
  }

  export enum FinishReason {
    Unknown = "unknown",
    Stop = "stop",
    Length = "length",
    ContentFilter = "content_filter",
  }

  export interface FunctionCall {
    arguments?: string;
    name?: string;
  }

  export interface ToolCall {
    index?: number;
    id?: number;
    type?: string;
    function?: FunctionCall;
  }

  export interface ImageUrlContentSection {
    index?: number;
    type: "image_url";
    image_url: {
      url: string;
    };
  }

  export interface TextContentSection {
    index?: number;
    type: "text";
    text: string;
  }

  export type MessageContentSection =
    | ImageUrlContentSection
    | TextContentSection;

  export interface Message {
    name?: string;
    content?: string | MessageContentSection[];
    function_call?: FunctionCall;
    tool_call_id?: number;
    tool_calls?: ToolCall[];
    role: Role;
    status?: MessageStatus;
    finish_reason?: FinishReason;
    hidden?: boolean;
    omit?: boolean;
  }

  export interface StreamChoice {
    delta?: Message;
    index: number;
    finish_reason: FinishReason | null;
    finish_details?: any;
  }

  export interface StreamResponseData {
    error?: { code: string; message: string };
    choices?: StreamChoice[];
  }

  export interface Choice {
    message?: Message;
    index: number;
    finish_reason: FinishReason | null;
    finish_details?: any;
  }

  export interface ResponseData {
    error?: { code: string; message: string };
    choices?: Choice[];
  }

  export interface FunctionDefine {
    name: string;
    description: string;
    parameters: JSONSchema7;
  }

  export interface ToolDefine {
    type: "function";
    function: FunctionDefine;
  }

  export interface ChatContext {
    model_key: ChatCompletionModelsKeys;
    model_config: any;
    messages: Message[];
    knowledge_bases: KnowledgeBase[];
    tools: Tool[];
    agents: Agent[];
  }

  export interface Tool extends ToolDefine {
    code?: string;
    callback?: (parsedArgs: any) => any;
  }

  export interface Agent extends ToolDefine, ChatContext {}

  export interface Scene extends ChatContext {}

  export interface Endpoint {
    model_key: ModelsKeys;
    endpoint_config: any;
  }

  export interface KnowledgeItem {
    text: string;
    vector: number[];
  }

  export interface KnowledgeBase {
    model_key: EmbeddingModelsKeys;
    model_config: any;
    data: KnowledgeItem[];
  }
}

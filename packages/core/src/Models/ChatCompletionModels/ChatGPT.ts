import {
  EventStreamContentType,
  fetchEventSource
} from "@ai-zen/node-fetch-event-source";
import type { JSONSchema7 } from "json-schema";
import { ChatAL } from "../../ChatAL.js";
import {
  ChatCompletionModel,
  ChatCompletionModelCreateOptions,
  ChatCompletionModelCreateStreamOptions
} from "../ChatCompletionModel.js";
import { AsyncQueue } from "@ai-zen/async-queue";
import { RequestConfig } from "../../Model.js";

export namespace ChatGPTTypes {
  export enum Role {
    System = "system",
    Assistant = "assistant",
    User = "user",
    Function = "function",
    Tool = "tool"
  }

  export enum FinishReason {
    Stop = "stop",
    Length = "length",
    ContentFilter = "content_filter",
    FunctionCall = "function_call",
    ToolCalls = "tool_calls"
  }

  export interface ToolDefine {
    type: "function";
    function: FunctionDefine;
  }

  export interface FunctionDefine {
    description: string;
    name: string;
    parameters: JSONSchema7;
  }

  export interface FunctionCall {
    name?: string;
    arguments?: any;
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
    role: Role;
    name?: string;
    content?: string | MessageContentSection[];
    function_call?: FunctionCall;
    tool_calls?: ToolCall[];
  }

  export type ResponseMessage = Message;

  export type ResponseDelta = ResponseMessage;

  export interface RequestData {
    model?: string;
    stream?: boolean;
    messages: Message[];
    stop?: null;
    temperature?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    max_tokens?: number;
    response_format?: { type: "json_object" };

    tools?: ToolDefine[];
    tool_choice?: "auto" | "none";

    functions?: FunctionDefine[];
    function_call?: "auto" | "none";
  }

  export interface Choice {
    message?: ResponseMessage;
    index: number;
    finish_reason: FinishReason | null;
    finish_details?: any;
  }

  export interface StreamChoice {
    delta?: ResponseDelta;
    index: number;
    finish_reason: FinishReason | null;
    finish_details?: any;
  }

  export interface Usage {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  }

  export interface ResponseData {
    error?: {
      code: string;
      message: string;
    };
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Choice[];
    usage: Usage;
    prompt_filter_results?: any;
  }

  export interface StreamResponseData {
    error?: {
      code: string;
      message: string;
    };
    id: string;
    object: string;
    created: number;
    model: string;
    choices?: StreamChoice[];
    usage: null;
    prompt_filter_results?: any;
  }
}

export interface ChatGPT_ModelConfig {
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
}

class RetriableError extends Error {}
class FatalError extends Error {}

export abstract class ChatGPT<
  M extends ChatGPT_ModelConfig = ChatGPT_ModelConfig
> extends ChatCompletionModel<M> {
  async createCompletion(options: ChatCompletionModelCreateOptions) {
    if (!this.model_config) {
      throw new Error("ChatGPT config not set");
    }
    if (!this.request_config) {
      throw new Error("ChatGPT request not set");
    }

    const model_config = this.formatModelConfig(this.model_config);
    const request_config = this.formatRequestConfig(this.request_config);

    try {
      const res = await fetch(request_config.url, {
        signal: options.signal,
        method: "POST",
        headers: request_config.headers,
        body: JSON.stringify({
          ...request_config.body,
          ...model_config,
          ...this.formatTools(options.tools),
          messages: options.messages
        })
      });

      const data: ChatGPTTypes.ResponseData = await res.json();

      return this.formatData(data);
    } catch (error: any) {
      throw new FatalError(error?.message);
    }
  }

  createStream(options: ChatCompletionModelCreateStreamOptions) {
    if (!this.model_config) {
      throw new Error("ChatGPT config not set");
    }
    if (!this.request_config) {
      throw new Error("ChatGPT request not set");
    }

    const model_config = this.formatModelConfig(this.model_config);
    const request_config = this.formatRequestConfig(this.request_config);

    const stream = new AsyncQueue<ChatAL.StreamResponseData>();

    fetchEventSource(request_config.url, {
      signal: options.signal,
      method: "POST",
      headers: request_config.headers,
      body: JSON.stringify({
        ...request_config.body,
        ...model_config,
        ...this.formatTools(options.tools),
        stream: true,
        messages: options.messages
      }),
      async onopen(response) {
        if (
          response.ok &&
          response.headers.get("content-type")?.includes(EventStreamContentType)
        ) {
          options.onOpen?.();
          return;
        }

        try {
          throw new FatalError(await response.text());
        } catch {
          throw new FatalError("Network Error");
        }
      },
      onerror(err) {
        if (err instanceof FatalError) throw err;
        if (err instanceof RetriableError) return;
        throw err;
      },
      onmessage: (msg) => {
        if (msg.data === "[DONE]") {
          stream.done();
          return;
        }

        try {
          const data = JSON.parse(msg.data) as ChatGPTTypes.StreamResponseData;
          stream.push(this.formatSteamData(data));
        } catch (error: any) {
          throw new FatalError(error?.message);
        }
      }
    })
      .catch((error) => {
        options.onError?.(error);
      })
      .finally(() => {
        stream.done();
        options.onFinally?.();
      });

    return stream;
  }

  formatModelConfig(model_config?: M): M {
    return { ...model_config } as M;
  }

  formatRequestConfig(request_config?: RequestConfig): RequestConfig {
    return { ...request_config } as RequestConfig;
  }

  formatTools(tools: ChatAL.ToolDefine[] | undefined) {
    if (!tools?.length) return {};
    if (
      (this.constructor as typeof ChatCompletionModel).IS_SUPPORT_TOOLS_CALL
    ) {
      return {
        tools: tools,
        tool_choice: "auto"
      };
    } else if (
      (this.constructor as typeof ChatCompletionModel).IS_SUPPORT_FUNCTION_CALL
    ) {
      return {
        functions: tools.map((tool) => tool.function),
        function_call: "auto"
      };
    }
  }

  formatData(data: ChatGPTTypes.ResponseData): ChatAL.ResponseData {
    return {
      ...data,
      choices: data.choices?.map(this.formatChoice.bind(this))
    };
  }

  formatChoice(choice: ChatGPTTypes.Choice): ChatAL.Choice {
    return {
      ...choice,
      message: this.formatMessage(choice.message),
      finish_reason: this.formatFinalResponse(choice.finish_reason)
    };
  }

  formatSteamData(
    data: ChatGPTTypes.StreamResponseData
  ): ChatAL.StreamResponseData {
    return {
      ...data,
      choices: data.choices?.map(this.formatStreamChoice.bind(this))
    };
  }

  formatStreamChoice(choice: ChatGPTTypes.StreamChoice): ChatAL.StreamChoice {
    return {
      ...choice,
      delta: this.formatDelta(choice.delta),
      finish_reason: this.formatFinalResponse(choice.finish_reason)
    };
  }

  formatDelta(
    delta: ChatGPTTypes.ResponseDelta | undefined
  ): ChatAL.Delta | undefined {
    if (!delta) return undefined;
    return {
      ...delta,
      content: this.formatContent(delta.content),
      role: delta.role && this.formatRole(delta.role)
    };
  }

  formatMessage(
    message: ChatGPTTypes.Message | undefined
  ): ChatAL.Message | undefined {
    if (!message) return undefined;
    return {
      ...message,
      content: this.formatContent(message.content),
      role: this.formatRole(message.role)
    };
  }

  formatContent(
    content: ChatGPTTypes.ResponseDelta["content"]
  ): ChatAL.Message["content"] {
    return content;
  }

  formatFinalResponse(
    finish_reason: ChatGPTTypes.FinishReason | null
  ): ChatAL.FinishReason {
    switch (finish_reason) {
      case null:
        return ChatAL.FinishReason.Stop;
      case ChatGPTTypes.FinishReason.Stop:
        return ChatAL.FinishReason.Stop;
      case ChatGPTTypes.FinishReason.ContentFilter:
        return ChatAL.FinishReason.ContentFilter;
      case ChatGPTTypes.FinishReason.Length:
        return ChatAL.FinishReason.Length;
      case ChatGPTTypes.FinishReason.FunctionCall:
        return ChatAL.FinishReason.FunctionCall;
      case ChatGPTTypes.FinishReason.ToolCalls:
        return ChatAL.FinishReason.ToolCalls;
      default:
        return ChatAL.FinishReason.Unknown;
    }
  }

  formatRole(role: ChatGPTTypes.Role): ChatAL.Role {
    switch (role) {
      case ChatGPTTypes.Role.Assistant:
        return ChatAL.Role.Assistant;
      case ChatGPTTypes.Role.System:
        return ChatAL.Role.System;
      case ChatGPTTypes.Role.User:
        return ChatAL.Role.User;
      case ChatGPTTypes.Role.Function:
        return ChatAL.Role.Function;
      case ChatGPTTypes.Role.Tool:
        return ChatAL.Role.Tool;
      default:
        return ChatAL.Role.Unknown;
    }
  }

  static OUTPUT_MAX_TOKENS_LOWER_LIMIT = 800;
  static OUTPUT_MAX_TOKENS = 4096;
}

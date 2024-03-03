import { ChatAL } from "../ChatAL.js";
import { Model, ModelType } from "./Model.js";

export interface ChatCompletionModelCreateStreamOptions {
  signal?: AbortSignal;
  messages: ChatAL.Message[];
  tools: ChatAL.ToolDefine[];
  onOpen?(): void;
  onDone?(): void;
  onData?(data: ChatAL.StreamResponseData): void;
}

export interface ChatCompletionModelCreateOptions {
  signal?: AbortSignal;
  messages: ChatAL.Message[];
  tools: ChatAL.ToolDefine[];
}

export abstract class ChatCompletionModel<C = {}, E = {}> extends Model<C, E> {
  static type = ModelType.ChatCompletion;
  static INPUT_MAX_TOKENS: number;
  static OUTPUT_MAX_TOKENS_LOWER_LIMIT: number;
  static OUTPUT_MAX_TOKENS: number;
  static IS_SUPPORT_FUNCTION_CALL?: boolean;
  static IS_SUPPORT_TOOLS_CALL?: boolean;
  static IS_SUPPORT_IMAGE_CONTENT?: boolean;
  abstract createStream(
    options: ChatCompletionModelCreateStreamOptions
  ): Promise<void>;
  abstract createCompletion(
    options: ChatCompletionModelCreateOptions
  ): Promise<ChatAL.ResponseData>;
}

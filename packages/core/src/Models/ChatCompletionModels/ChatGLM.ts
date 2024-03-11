import { ChatGPT } from "./ChatGPT.js";

export interface ChatGLM_ModelConfig {
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
}

export abstract class ChatGLM extends ChatGPT<ChatGLM_ModelConfig> {
  static code: string;
  get code() {
    return (this.constructor as typeof ChatGLM).code;
  }

  static OUTPUT_MAX_TOKENS_LOWER_LIMIT = 800;
  static OUTPUT_MAX_TOKENS = 4096;

  override formatModelConfig(model_config?: ChatGLM_ModelConfig) {
    return {
      ...model_config,
      do_sample:
        model_config?.temperature != undefined ||
        model_config?.top_p != undefined,
    };
  }
}

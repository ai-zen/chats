import { ModelType, Models, ModelsKeys } from "../Models/index.js";
import { Endpoint } from "./Endpoint.js";

export interface OpenAIConfig {
  openai_endpoint?: string;
  api_key: string;
  organization?: string;
  headers?: Record<string, string>;
  body?: Record<string, any>;
}

export class OpenAI extends Endpoint<OpenAIConfig> {
  static title = "OpenAI";

  static COMPATIBLE_MODELS_KEYS: ModelsKeys[] = [
    "GPT4_0125Preview",
    "GPT4_1106Preview",
    "GPT4_VisionPreview",
    "GPT35Turbo_0125",
    "GPT35Turbo_0631",
    "GPT35Turbo_1106",
    "GPT35Turbo16K_0631",
    "TextEmbeddingAda002_2",
  ];

  async build(model_key: ModelsKeys) {
    let { openai_endpoint, api_key } = this.endpoint_config;

    if (!openai_endpoint) {
      openai_endpoint = "https://api.openai.com/v1/";
    }

    if (!openai_endpoint.endsWith("/")) {
      openai_endpoint += "/";
    }

    let path = "";
    switch (Models[model_key].type) {
      case ModelType.Embedding:
        path = "embeddings";
        break;
      case ModelType.ChatCompletion:
        path = "chat/completions";
        break;
    }

    return {
      ...this.endpoint_config,
      url: `${openai_endpoint}/${path}`,
      headers: {
        "Content-Type": "application/json",
        ...this.endpoint_config?.headers,
        Authorization: `Bearer ${api_key}`,
        ...(this.endpoint_config?.organization
          ? {
              "OpenAI-Organization": this.endpoint_config?.organization,
            }
          : {}),
      },
      body: {
        ...this.endpoint_config?.body,
        model: Models[model_key].code,
      },
    };
  }
}

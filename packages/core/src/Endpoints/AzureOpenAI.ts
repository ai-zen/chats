import { Models, ModelsKeys } from "../Models/index.js";
import { Endpoint } from "../Endpoint.js";
import { ModelType } from "../Model.js";

export interface AzureOpenAIConfig {
  azure_endpoint: string;
  api_key: string;
  deployments: Record<ModelsKeys, string>;
  api_version: string;
  headers?: Record<string, string>;
  body?: Record<string, any>;
}

export class AzureOpenAI extends Endpoint<AzureOpenAIConfig> {
  static title = "Azure OpenAI";

  static COMPATIBLE_MODELS_KEYS: ModelsKeys[] = [
    "GPT4O_20240513",
    "GPT4O_20240806",
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
    let { azure_endpoint, deployments, api_version, api_key } =
      this.endpoint_config;

    if (!azure_endpoint) {
      throw new Error("Azure OpenAI endpoint requires azure_endpoint");
    }

    if (!azure_endpoint.endsWith("/")) {
      azure_endpoint += "/";
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

    let deployment_name = deployments[model_key];

    return {
      ...this.endpoint_config,
      url: `${azure_endpoint}openai/deployments/${deployment_name}/${path}?api-version=${api_version}`,
      headers: {
        "Content-Type": "application/json",
        ...this.endpoint_config?.headers,
        "api-key": api_key,
      },
      body: {
        ...this.endpoint_config?.body,
      },
    };
  }
}

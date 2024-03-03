import { EmbeddingModel } from "../EmbeddingModel.js";

export interface TextEmbeddingAda002_2_Response {
  error?: { code: number; message: string };
  object: "list";
  data: [
    {
      object: "embedding";
      index: number;
      embedding: number[];
    }
  ];
  model: "ada";
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface TextEmbeddingAda002_2_ModelConfig {}

export interface TextEmbeddingAda002_2_EndpointConfig {
  url: string;
  headers: Record<string, string> | undefined;
  body: Record<string, string> | undefined;
}

export class TextEmbeddingAda002_2 extends EmbeddingModel<
  TextEmbeddingAda002_2_ModelConfig,
  TextEmbeddingAda002_2_EndpointConfig
> {
  static title = "text-embedding-ada-002-2";
  static INPUT_MAX_TOKENS: 8191;
  static OUTPUT_DIMENSION: 1536;

  async createEmbedding(input: string) {
    if (!this.model_config) {
      throw new Error("TextEmbeddingAda002_2 config not set");
    }
    if (!this.endpoint_config) {
      throw new Error("TextEmbeddingAda002_2 endpoint not set");
    }

    const res = await fetch(this.endpoint_config.url, {
      method: "POST",
      headers: this.endpoint_config.headers,
      body: JSON.stringify({
        ...this.endpoint_config.body,
        input,
      }),
    });

    const json: TextEmbeddingAda002_2_Response = await res.json();

    if (json.error) {
      throw new Error(json.error.message);
    }

    return json.data[0].embedding;
  }
}

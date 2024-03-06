import { SignJWT } from "jose";
import { ChatGPT } from "./ChatGPT.js";

export interface ChatGLM_ModelConfig {
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
}

export interface ChatGLM_EndpointConfig {
  url: string;
  headers?: Record<string, string>;
  body?: {};
  api_key?: string;
}

export abstract class ChatGLM extends ChatGPT<
  ChatGLM_ModelConfig,
  ChatGLM_EndpointConfig
> {
  static code: string;
  get code() {
    return (this.constructor as typeof ChatGLM).code;
  }

  static OUTPUT_MAX_TOKENS_LOWER_LIMIT = 800;
  static OUTPUT_MAX_TOKENS = 4096;

  override async formatModelConfig(model_config?: ChatGLM_ModelConfig) {
    return {
      ...model_config,
      do_sample:
        model_config?.temperature != undefined ||
        model_config?.top_p != undefined,
    };
  }

  override async formatEndpointConfig(
    endpoint_config?: ChatGLM_EndpointConfig
  ) {
    return {
      ...endpoint_config,
      headers: {
        ...endpoint_config?.headers,
        ...(endpoint_config?.api_key
          ? {
              Authorization: `Bearer ${await this.generateToken(
                endpoint_config.api_key,
                3600
              )}`,
            }
          : {}),
      },
      body: {
        ...endpoint_config?.body,
        model: this.code,
      },
    } as ChatGLM_EndpointConfig;
  }

  async generateToken(api_key: string, exp_seconds: number) {
    try {
      let [id, secret] = api_key.split(".");

      if (!id || !secret) {
        throw new Error("invalid api_key");
      }

      const payload = {
        api_key: id,
        exp: Date.now() + exp_seconds * 1000,
        timestamp: Date.now(),
      };

      const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256", sign_type: "SIGN" }) // 设置头部信息
        .sign(new TextEncoder().encode(secret)); // 使用 secret 进行签名

      return jwt;
    } catch (error) {
      console.error("generateToken failed:", error);
      throw error;
    }
  }
}

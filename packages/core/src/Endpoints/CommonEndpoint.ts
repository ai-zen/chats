import { ModelsKeys } from "../Models/index.js";
import { Endpoint } from "../Endpoint.js";

export interface CommonEndpointConfig {
  url: string;
  headers?: Record<string, string>;
  body?: Record<string, any>;
}

export class CommonEndpoint extends Endpoint<CommonEndpointConfig> {
  static title = "Common";

  static COMPATIBLE_MODELS_KEYS: ModelsKeys[] = [];

  async build() {
    return {
      ...this.endpoint_config,
      url: this.endpoint_config.url,
      headers: {
        "Content-Type": "application/json",
        ...this.endpoint_config?.headers,
      },
      body: {
        ...this.endpoint_config?.body,
      },
    };
  }

  isCompatible(): boolean {
    return true;
  }
}

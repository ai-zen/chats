import { ChatAL } from "../ChatAL.js";
import { PickRequired } from "../Common.js";
import { ModelsKeys } from "../Models/index.js";

export abstract class Endpoint<C extends {} = any> implements ChatAL.Endpoint {
  static title: string;

  get title() {
    return (this.constructor as typeof Endpoint).title;
  }

  get name() {
    return this.constructor.name;
  }

  static COMPATIBLE_MODELS_KEYS: ModelsKeys[] = [];

  get compatible_models_keys() {
    return (this.constructor as typeof Endpoint).COMPATIBLE_MODELS_KEYS;
  }

  enabled_models_keys: ModelsKeys[];
  endpoint_config: C;

  constructor(options: C & { enabled_models_keys: ModelsKeys[] }) {
    const { enabled_models_keys, ...endpoint_config } = options;

    enabled_models_keys?.forEach((model_key) => {
      if (!this.isCompatible(model_key)) {
        throw new Error(`Model ${model_key} is not compatible by ${this.name}`);
      }
    });

    this.enabled_models_keys = enabled_models_keys ?? [
      ...this.compatible_models_keys,
    ];

    this.endpoint_config = (endpoint_config as any) ?? {};
  }

  abstract build(model_key: string): Promise<ChatAL.RequestConfig>;

  isMatch(model_key: ModelsKeys) {
    return this.enabled_models_keys.includes(model_key);
  }

  static match(endpoints: Endpoint[], model_key: ModelsKeys) {
    return endpoints.find((x) => x.isMatch(model_key));
  }

  isCompatible(model_key: ModelsKeys) {
    return this.compatible_models_keys.includes(model_key);
  }
}

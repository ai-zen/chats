import { ChatAL } from "./ChatAL.js";
import { PickRequired } from "./Common.js";
import { ModelsKeys } from "./Models/index.js";

export class Endpoint implements ChatAL.Endpoint {
  model_key: ModelsKeys;
  endpoint_config: any;
  constructor(options: PickRequired<Endpoint, "model_key">) {
    if (!options.model_key) throw new Error("Endpoint must have a model_key");
    this.model_key = options.model_key;
    this.endpoint_config = options.endpoint_config ?? {};
  }
}

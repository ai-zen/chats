import { ChatAL } from "../ChatAL";

export enum ModelType {
  Completion = "completion",
  ChatCompletion = "chat_completion",
  Embedding = "embedding",
}

export abstract class Model<ModelConfig = {}> {
  static code: string;
  static title: string;
  static type: ModelType;
  get code() {
    return (this.constructor as typeof Model).code;
  }
  get title() {
    return (this.constructor as typeof Model).title;
  }
  get type() {
    return (this.constructor as typeof Model).type;
  }
  get name() {
    return this.constructor.name;
  }
  model_config?: ModelConfig;
  request_config?: ChatAL.RequestConfig;
  constructor(options: {
    model_config?: ModelConfig;
    request_config?: ChatAL.RequestConfig;
  }) {
    this.model_config = options.model_config;
    this.request_config = options.request_config;
  }
}

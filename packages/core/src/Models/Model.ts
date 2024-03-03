export enum ModelType {
  Completion = "completion",
  ChatCompletion = "chat_completion",
  Embedding = "embedding",
}

export abstract class Model<C = {}, E = {}> {
  static title: string;
  static type: ModelType;
  get title() {
    return (this.constructor as typeof Model).title;
  }
  get type() {
    return (this.constructor as typeof Model).type;
  }
  get name() {
    return this.constructor.name;
  }
  model_config?: C;
  endpoint_config?: E;
  constructor(options: { model_config?: C; endpoint_config?: E }) {
    this.model_config = options.model_config;
    this.endpoint_config = options.endpoint_config;
  }
}

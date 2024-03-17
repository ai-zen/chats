import * as ChatCompletionModels from "./ChatCompletionModels/index.js";
import * as EmbeddingModels from "./EmbeddingModels/index.js";

export { ChatCompletionModels, EmbeddingModels };

export const Models = {
  ...ChatCompletionModels,
  ...EmbeddingModels,
};

export type ChatCompletionModelsKeys = keyof typeof ChatCompletionModels;
export type EmbeddingModelsKeys = keyof typeof EmbeddingModels;
export type ModelsKeys = keyof typeof Models;

export * from "./EmbeddingModel.js";
export * from "./ChatCompletionModel.js";

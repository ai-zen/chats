import { Model, ModelType } from "./Model.js";

export abstract class EmbeddingModel<C = {}, E = {}> extends Model<C, E> {
  static type = ModelType.Embedding;
  static INPUT_MAX_TOKENS: number;
  static OUTPUT_DIMENSION: number;
  abstract createEmbedding(input: string): Promise<number[]>;
}

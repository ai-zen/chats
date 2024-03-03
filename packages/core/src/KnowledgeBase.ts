import { ChatAL } from "./ChatAL.js";
import { PickRequired } from "./Common.js";
import { EmbeddingModelsKeys } from "./Models/index.js";
import { Vector, VectorDatabase } from "./VectorDatabase.js";

export class KnowledgeBase implements ChatAL.KnowledgeBase {
  model_key: EmbeddingModelsKeys;
  model_config: {};
  data: ChatAL.KnowledgeItem[];

  private db: VectorDatabase<ChatAL.KnowledgeItem>;

  constructor(options: PickRequired<KnowledgeBase, "model_key">) {
    if (!options.model_key)
      throw new Error("KnowledgeBase must have a model_key");
    this.model_key = options.model_key;
    this.model_config = options.model_config ?? {};
    this.data = options.data ?? [];
    this.db = new VectorDatabase(this.data);
  }

  search(targetVector: Vector, topN: number, minScore: number) {
    return this.db.search(targetVector, topN, minScore);
  }
}

import { Message } from "../Message.js";
import { EmbeddingModels, EmbeddingModel } from "../Models/index.js";
import { Rag } from "../Rag.js";
import { Endpoint } from "../Endpoint.js";
import { KnowledgeBase } from "../KnowledgeBase.js";
import { PickRequired } from "../Common.js";

export class EmbeddingSearch extends Rag {
  knowledge_bases: KnowledgeBase[];
  template: (question: string, references: string[]) => string;
  endpoints: Endpoint[];

  constructor(options: PickRequired<EmbeddingSearch, "knowledge_bases">) {
    super();
    this.knowledge_bases = options.knowledge_bases ?? [];
    this.template = options.template ?? this.defaultTemplate;
    this.endpoints = options.endpoints ?? [];
  }

  private defaultTemplate(question: string, references: string[]): string {
    return `My question is: \n\n${question}\n\nAnswer my question based on the following information: \n\n${references
      .map((x, i) => `${i + 1}. ${x}`)
      .join("\n")}`;
  }

  async rewrite(questionMessage: Message) {
    const references = await this.query(questionMessage.content!.toString());
    if (references?.length) {
      questionMessage.rewrite(
        this.template(questionMessage.content!.toString(), references)
      );
    }
  }

  /**
   * Query the knowledge base for related information.
   */
  async query(question: string) {
    const results = await Promise.all(
      this.knowledge_bases.map(async (kb) => {
        const endpoint = Endpoint.match(this.endpoints, kb.model_key);
        if (!endpoint) return;

        const embeddingModel = new EmbeddingModels[kb.model_key]({
          model_config: kb.model_config,
          request_config: await endpoint.build(kb.model_key),
        }) as EmbeddingModel;
        if (!embeddingModel) return;

        const vector = await embeddingModel.createEmbedding(question as string);
        const records = kb.search(vector, 5, 0.8);
        const texts = records.map((x) => x.text);

        return texts;
      })
    );

    return results.flat().filter((x) => x) as string[];
  }
}

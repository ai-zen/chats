import { Message } from "../Message.js";
import { EmbeddingModels, EmbeddingModel } from "../Models/index.js";
import { Rag } from "../Rag.js";
import { Endpoint } from "../Endpoint.js";
import { KnowledgeBase } from "../KnowledgeBase.js";
import { PickRequired } from "../Common.js";
import { ChatAL } from "../ChatAL.js";

export class EmbeddingSearch extends Rag {
  knowledge_bases: KnowledgeBase[];
  template: (
    question: ChatAL.MessageContent,
    references: string[]
  ) => ChatAL.MessageContent;
  endpoints: Endpoint[];

  constructor(options: PickRequired<EmbeddingSearch, "knowledge_bases">) {
    super();
    this.knowledge_bases = options.knowledge_bases ?? [];
    this.template = options.template ?? this.defaultTemplate;
    this.endpoints = options.endpoints ?? [];
  }

  private defaultTemplate(
    question: ChatAL.MessageContent,
    references: string[]
  ): ChatAL.MessageContent {
    const formattedReference = references.map((ref) => `<${ref}>`).join(", ");
    const partA = `My question is: \n\n`;
    const partB = `\n\nAnswer my question based on the following information: \n\n${formattedReference}`;
    if (question instanceof Array) {
      return [
        { type: "text", text: partA },
        ...question,
        { type: "text", text: partB },
      ];
    } else {
      return `${partA}${question}${partB}`;
    }
  }

  async rewrite(questionMessage: ChatAL.Message) {
    const references = await this.query(questionMessage.content!.toString());
    if (references?.length) {
      Message.rewrite(
        questionMessage,
        this.template(questionMessage.content!, references)
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

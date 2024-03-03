import { ModelsKeys, ModelType } from "@ai-zen/chats-core";
import { ChatPL } from "../types/ChatPL";

export interface ModelEndpointRequire {
  model_key: ModelsKeys;
  type: ModelType;
  useAs: string[];
}

export function useRequiredEndpoints(options: {
  getKnowledgeBases(ids: string[]): ChatPL.KnowledgeBasePO[];
  getAgents(ids: string[]): ChatPL.AgentPO[];
}) {
  function getSceneRequiredEndpoints(scene: ChatPL.ScenePO | undefined) {
    const record: Record<string, ModelEndpointRequire> = {};

    if (!scene) return record;

    if (scene.model_key) {
      record[scene.model_key] ??= {
        model_key: scene.model_key,
        type: ModelType.ChatCompletion,
        useAs: [],
      };
      record[scene.model_key].useAs.push("当前场景");
    }

    options.getAgents(scene.agents_ids).forEach((agent) => {
      record[agent.model_key] ??= {
        model_key: agent.model_key,
        type: ModelType.ChatCompletion,
        useAs: [],
      };
      record[agent.model_key].useAs.push(agent.title);
    });

    options
      .getKnowledgeBases(scene.knowledge_bases_ids)
      .forEach((knowledge_base) => {
        record[knowledge_base.model_key] ??= {
          model_key: knowledge_base.model_key,
          type: ModelType.Embedding,
          useAs: [],
        };
        record[knowledge_base.model_key].useAs.push(knowledge_base.title);
      });

    return record;
  }

  return {
    getSceneRequiredEndpoints,
  };
}

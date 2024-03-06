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
  getScene(id: string): ChatPL.ScenePO | undefined;
}) {
  function getRequiredEndpoints(session: ChatPL.SessionPO | undefined) {
    const record: Record<string, ModelEndpointRequire> = {};

    if (!session) return record;

    const scene = options.getScene(session.scene_id);

    if (!scene) return record;

    let main_model_key = session.model_key || scene.model_key;
    if (main_model_key) {
      record[main_model_key] ??= {
        model_key: main_model_key,
        type: ModelType.ChatCompletion,
        useAs: [],
      };
      record[main_model_key].useAs.push("当前场景");
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
    getRequiredEndpoints,
  };
}

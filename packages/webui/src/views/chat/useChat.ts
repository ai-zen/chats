import { Chat } from "@ai-zen/chats-core";
import { computed, ref, watch } from "vue";
import { useDeserialize } from "../../composables/useDeserialize";
import { ChatPL } from "../../types/ChatPL";

export function useChat(options: {
  getCurrentSession(): ChatPL.SessionPO | undefined;
  getCurrentSessionScene(): ChatPL.ScenePO | undefined;
  getEndpoints(): ChatPL.EndpointPO[];
  getAgents(): ChatPL.AgentPO[];
  getKnowledgeBases(): ChatPL.KnowledgeBasePO[];
  getTools(): ChatPL.ToolPO[];
}) {
  const { formatScene } = useDeserialize({
    getEndpoints: options.getEndpoints,
    getAgents: options.getAgents,
    getKnowledgeBases: options.getKnowledgeBases,
    getTools: options.getTools,
  });

  const chatRef = ref<Chat>();

  function initChat() {
    const sessionPO = options.getCurrentSession();
    if (!sessionPO) return;
    const scenePO = options.getCurrentSessionScene();
    if (!scenePO) return;
    chatRef.value = new Chat({
      ...formatScene(scenePO),
      model_key: sessionPO.model_key || scenePO.model_key,
      model_config: sessionPO.model_config || scenePO.model_config,
      messages: sessionPO.messages,
    });
  }

  watch(
    [
      () => options.getCurrentSession(),
      () => options.getCurrentSession()?.model_key,
      () => options.getCurrentSession()?.model_config,
    ],
    initChat
  );

  const isHasPendingMessage = computed(() => {
    return chatRef.value?.isHasPendingMessage;
  });

  return {
    chatRef,
    isHasPendingMessage,
  };
}

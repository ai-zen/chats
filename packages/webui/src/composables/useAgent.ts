import { reactive } from "vue";
import * as api from "../api";
import { ChatPL } from "../types/ChatPL";

export function useAgent() {
  const agentState = reactive({
    list: [] as ChatPL.AgentPO[],
    isLoading: false,
    isReady: false,
    isSaving: false,
  });

  async function getList() {
    try {
      agentState.isLoading = true;
      agentState.list = await api.getAgentList();
      agentState.isReady = true;
    } finally {
      agentState.isLoading = false;
    }
  }

  async function initAgentState() {
    await getList();
  }

  function getAgent(id?: string) {
    return agentState.list.find((x) => x.id === id);
  }

  function getAgents(ids?: string[]): ChatPL.AgentPO[] {
    return (ids?.map(getAgent).filter((x) => x) as ChatPL.AgentPO[]) ?? [];
  }

  return {
    agentState,
    initAgentState,
    getAgent,
    getAgents,
  };
}

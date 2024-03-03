import { reactive } from "vue";
import * as api from "../api";
import { ChatPL } from "../types/ChatPL";

export function useKnowledgeBase() {
  const knowledgeBaseState = reactive({
    list: [] as ChatPL.KnowledgeBasePO[],
    isLoading: false,
    isReady: false,
    isSaving: false,
  });

  async function getList() {
    try {
      knowledgeBaseState.isLoading = true;
      knowledgeBaseState.list = await api.getKnowledgeBaseList();
      knowledgeBaseState.isReady = true;
    } finally {
      knowledgeBaseState.isLoading = false;
    }
  }

  async function initKnowledgeBaseState() {
    await getList();
  }

  function getKnowledgeBase(id?: string) {
    return knowledgeBaseState.list.find((x) => x.id === id);
  }

  function getKnowledgeBases(ids?: string[]): ChatPL.KnowledgeBasePO[] {
    return (
      (ids
        ?.map(getKnowledgeBase)
        .filter((x) => x) as ChatPL.KnowledgeBasePO[]) ?? []
    );
  }

  return {
    knowledgeBaseState,
    initKnowledgeBaseState,
    getKnowledgeBase,
    getKnowledgeBases,
  };
}

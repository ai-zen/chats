import { reactive } from "vue";
import * as api from "../api";
import { ChatPL } from "../types/ChatPL";

export function useTool() {
  const toolState = reactive({
    list: [] as ChatPL.ToolPO[],
    isLoading: false,
    isReady: false,
    isSaving: false,
  });

  async function getList() {
    try {
      toolState.isLoading = true;
      toolState.list = await api.getToolList();
      toolState.isReady = true;
    } finally {
      toolState.isLoading = false;
    }
  }

  async function initToolState() {
    await getList();
  }

  function getTool(id?: string) {
    return toolState.list.find((x) => x.id === id);
  }

  function getTools(ids?: string[]): ChatPL.ToolPO[] {
    return (ids?.map(getTool).filter((x) => x) as ChatPL.ToolPO[]) ?? [];
  }

  return {
    toolState,
    initToolState,
    getList,
    getTool,
    getTools,
  };
}

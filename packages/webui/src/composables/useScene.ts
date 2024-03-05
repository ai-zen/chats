import { reactive, watch } from "vue";
import * as api from "../api";
import { ChatCompletionModels, ChatAL } from "@ai-zen/chats-core";
import { ChatPL } from "../types/ChatPL";
import { debounce } from "../utils/debounce";

export function useScene() {
  const sceneState = reactive({
    list: [] as ChatPL.ScenePO[],
    isLoading: false,
    isReady: false,
    isSaving: false,
    current: null as ChatPL.ScenePO | null,
  });

  async function getList() {
    try {
      sceneState.isLoading = true;
      const [list, current] = await Promise.all([
        api.getSceneList(),
        api.getCurrentSceneId(),
      ]);
      sceneState.list = [createDefaultScene(), ...list];
      const index = sceneState.list.findIndex((item) => item.id == current);
      if (index > -1) {
        sceneState.current = sceneState.list[index];
      } else {
        sceneState.current = sceneState.list[0];
      }
      sceneState.isReady = true;
    } finally {
      sceneState.isLoading = false;
    }
  }

  function createDefaultScene() {
    return <ChatPL.ScenePO>{
      model_key: ChatCompletionModels.GPT35Turbo_1106.name,
      agents_ids: [],
      icon: "🤖",
      id: "default",
      knowledge_bases_ids: [],
      messages: [
        {
          role: ChatAL.Role.Assistant,
          content: "你好，请问有什么需要帮助的？",
          omit: true,
          status: ChatAL.MessageStatus.Completed,
        },
        {
          role: ChatAL.Role.System,
          content: "你是一个AI助手，专门帮助用户查找信息。",
          hidden: true,
          status: ChatAL.MessageStatus.Completed,
        },
      ],
      model_config: [],
      title: "空白场景",
      tools_ids: [],
    };
  }

  async function saveCurrentSceneId(sceneId: string | null | undefined) {
    console.log("saveCurrentSceneId", sceneId);
    try {
      sceneState.isSaving = true;
      api.setCurrentSceneId(sceneId);
    } finally {
      sceneState.isSaving = false;
    }
  }

  // 在当前对话ID变化时自动保存当前对话ID
  watch(
    () => sceneState.current?.id,
    debounce(() => {
      saveCurrentSceneId(sceneState.current?.id);
    }, 300)
  );

  async function initSceneState() {
    await getList();
  }

  function getScene(id?: string) {
    return sceneState.list.find((x) => x.id === id);
  }

  function getScenes(ids?: string[]): ChatPL.ScenePO[] {
    return (ids?.map(getScene).filter((x) => x) as ChatPL.ScenePO[]) ?? [];
  }

  return {
    sceneState,
    createDefaultScene,
    initSceneState,
    getScene,
    getScenes,
  };
}

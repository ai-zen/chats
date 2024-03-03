import { reactive, watch } from "vue";
import * as api from "../api";
import { ChatPL } from "../types/ChatPL";
import { debounce } from "../utils/debounce";
import { uuid } from "../utils/uuid";

export function useSession(options: {
  getCurrentScene: () => ChatPL.ScenePO | undefined;
}) {
  const sessionState = reactive({
    list: [] as ChatPL.SessionPO[],
    isLoading: false,
    isReady: false,
    isSaving: false,
    current: null as ChatPL.SessionPO | null,
  });

  async function getList() {
    try {
      sessionState.isLoading = true;
      const [list, current] = await Promise.all([
        api.getSessionList(),
        api.getCurrentSessionId(),
      ]);
      if (list.length) {
        sessionState.list = list;

        // 如果读取出来的当前对话id(current)存在于对话列表(list)，
        // 则使用对应的对话(sessionState.list[index])作为当前对话，
        // 否则使用第一条对话(sessionState.list[0])作为当前对话。
        const index = sessionState.list.findIndex((item) => item.id == current);
        if (index > -1) {
          sessionState.current = sessionState.list[index];
        } else {
          sessionState.current = sessionState.list[0];
        }
      } else {
        await addSession();
      }
      sessionState.isReady = true;
    } finally {
      sessionState.isLoading = false;
    }
  }

  function createSessionTitle(prefix: string = "新") {
    const maxKeyNumber = Math.max(
      0,
      ...sessionState.list.map((session) =>
        Number(
          new RegExp(`^${prefix}对话([\\d]+$)`).exec(session.title)?.[1] ?? 0
        )
      )
    );

    return `${prefix}对话${maxKeyNumber + 1}`;
  }

  function createSession(scene = options.getCurrentScene()) {
    if (!scene) throw new Error("scene is required");

    const clonedScene = JSON.parse(JSON.stringify(scene));

    return <ChatPL.SessionPO>{
      id: uuid(),
      title: createSessionTitle(clonedScene.title),
      icon: clonedScene.icon,
      scene_id: clonedScene.id,
      messages: clonedScene.messages,
      newMessage: "",
      endpoints_ids: {},
    };
  }

  async function addSession(newSession = createSession()) {
    try {
      sessionState.isSaving = true;
      sessionState.list.push(newSession);
      sessionState.current = newSession;
      await api.addSession(JSON.parse(JSON.stringify(newSession)));
    } finally {
      sessionState.isSaving = false;
    }
  }

  async function removeSession(index: number) {
    try {
      sessionState.isSaving = true;
      const oldSession = sessionState.list[index];
      if (oldSession) {
        sessionState.list.splice(index, 1);
        if (oldSession.id == sessionState.current?.id) {
          sessionState.current = sessionState.list[0] || null;
        }
        await api.deleteSession(oldSession.id);
      }
    } finally {
      sessionState.isSaving = false;
    }
  }

  async function saveSession(session: ChatPL.SessionPO) {
    console.log("saveSession", session);
    try {
      sessionState.isSaving = true;
      await api.editSession(JSON.parse(JSON.stringify(session)));
    } finally {
      sessionState.isSaving = false;
    }
  }

  async function saveCurrentSessionId(sessionId: string | null | undefined) {
    console.log("saveCurrentSessionId", sessionId);
    try {
      sessionState.isSaving = true;
      api.setCurrentSessionId(sessionId);
    } finally {
      sessionState.isSaving = false;
    }
  }

  // 在当前对话ID变化时自动保存当前对话ID
  watch(
    () => sessionState.current?.id,
    debounce(() => {
      saveCurrentSessionId(sessionState.current?.id);
    }, 300)
  );

  // 在当前对话任意内容变化时自动保存
  watch(
    () => sessionState.current,
    debounce(() => {
      if (sessionState.current) saveSession(sessionState.current);
    }, 300),
    { deep: true }
  );

  async function initSessionState() {
    await getList();
  }

  return {
    sessionState,
    createSession,
    addSession,
    removeSession,
    saveSession,
    initSessionState,
  };
}

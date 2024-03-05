<template>
  <div class="chat">
    <!-- 场景列表侧边栏 -->
    <div class="left-side-bar scenes-side-bar" v-loading="sceneState.isLoading">
      <div class="scroll scenes">
        <div
          class="scene"
          v-for="scene of sceneState.list"
          :key="scene.id"
          @click="sceneState.current = scene"
          @dblclick="addSession(createSession(scene))"
          :class="{
            'is-current': sceneState.current?.id == scene.id,
          }"
        >
          <EmojiInput disabled class="icon" v-model="scene.icon"></EmojiInput>
          <div class="title">{{ scene.title }}</div>
        </div>
      </div>
    </div>

    <!-- 对话列表侧边栏 -->
    <div
      class="left-side-bar sessions-side-bar"
      v-loading="sessionState.isLoading"
    >
      <div class="scroll sessions">
        <el-empty
          v-if="!sessionState.list.length"
          description="空空如也~"
        ></el-empty>
        <div
          class="session"
          v-for="(session, index) of sessionState.list"
          :key="session.id"
          @click="sessionState.current = session"
          :class="{
            'is-current': sessionState.current?.id == session.id,
          }"
        >
          <EmojiInput class="icon" v-model="session.icon"></EmojiInput>
          <input class="title" v-model="session.title" />
          <!-- v-if="sessionState.list.length > 1" -->
          <el-icon class="remove" @click.stop="removeSession(index)">
            <CloseBold />
          </el-icon>
        </div>
      </div>
      <el-button
        type="success"
        :icon="Plus"
        size="large"
        class="add-session"
        @click="() => addSession()"
        >新增对话</el-button
      >
    </div>

    <!-- 对话内容 -->
    <div
      class="center-content"
      v-loading="sceneState.isLoading || sessionState.isLoading"
    >
      <template v-if="sessionState.current">
        <div class="scroll messages">
          <template
            v-for="(message, _index) of sessionState.current?.messages"
            :key="_index"
          >
            <ChatMessage v-if="!message.hidden" :message="message" />
          </template>
        </div>
        <div class="chat-input-panel">
          <div class="toolbar-row">
            <div class="left">
              <el-button size="small" title="设置"
                ><el-icon> <Setting /> </el-icon
              ></el-button>
              <el-button size="small" title="上传图片"
                ><el-icon> <PictureRounded /> </el-icon
              ></el-button>
              <el-button size="small" title="提问示例"
                ><el-icon> <MagicStick /> </el-icon
              ></el-button>
              <el-button size="small" title="emoji">😀</el-button>

              <el-form
                class="endpoint-form"
                v-if="sessionState.current.endpoints_ids"
                inline
                :model="sessionState.current.endpoints_ids"
                ref="endpointFormRef"
              >
                <el-form-item
                  v-for="item of requiredEndpoints"
                  :key="item.model_key"
                  :prop="item.model_key"
                  :rules="{
                    validator(_rule, value, callback) {
                      if (isInvalidEndpoint(item.type, value)) {
                        callback(new Error('请选择一个有效服务端'));
                      } else {
                        callback();
                      }
                    },
                  }"
                >
                  <el-tooltip
                    effect="light"
                    placement="top"
                    :content="`请选择服务端，要求兼容 (${
                      Models[item.model_key]?.title
                    }) 模型，用于【${item.useAs.join('、')}】`"
                  >
                    <!-- TODO: 应根据模型参数过滤出相兼容的服务端 -->
                    <el-select
                      size="small"
                      v-model="
                        sessionState.current.endpoints_ids[item.model_key]
                      "
                      :placeholder="`请选择模型服务端（${
                        Models[item.model_key]?.title
                      }）`"
                      clearable
                    >
                      <el-option
                        v-for="endpoint of endpointsOfModelType[item.type]"
                        :key="endpoint.id"
                        :label="endpoint.title"
                        :value="endpoint.id"
                      ></el-option>
                    </el-select>
                  </el-tooltip>
                </el-form-item>
              </el-form>
            </div>
            <!-- Resize Bar -->
            <div class="right">
              <el-button size="small" plain title="语音输入"
                ><el-icon> <Microphone /> </el-icon
              ></el-button>
              <el-button
                type="primary"
                plain
                title="发送"
                @click="onSendClick"
                :disabled="isHasPendingMessage"
                ><el-icon> <Promotion /> </el-icon>&ensp;发送</el-button
              >
              <el-button
                type="danger"
                plain
                title="停止"
                @click="onAbortClick"
                :disabled="!isHasPendingMessage"
                ><el-icon> <VideoPause /> </el-icon>&ensp;停止</el-button
              >
            </div>
          </div>
          <div class="input-row">
            <textarea
              v-if="sessionState.current"
              class="textarea"
              v-model="sessionState.current.newMessage"
              placeholder="请输入..."
            ></textarea>
          </div>
        </div>
      </template>
      <template v-else>
        <el-empty
          description="请从左侧新增对话以进行对话。"
          style="margin: auto"
        ></el-empty>
      </template>
    </div>

    <!-- 右侧边栏，待定 -->
    <div class="right-side-bar">
      <!-- Scene List -->
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CloseBold,
  MagicStick,
  Microphone,
  PictureRounded,
  Plus,
  Promotion,
  Setting,
  VideoPause,
} from "@element-plus/icons-vue";
import { ElForm, ElMessage } from "element-plus";
import { computed, onMounted, ref, watch } from "vue";
import {
  Agent,
  Chat,
  ChatContext,
  Endpoint,
  KnowledgeBase,
  Models,
  ModelsKeys,
  Scene,
  Tool,
} from "@ai-zen/chats-core";
import { ChatMessage, EmojiInput } from "../../components";
import {
  useAgent,
  useEndpoint,
  useKnowledgeBase,
  useRequiredEndpoints,
  useScene,
  useSession,
  useTool,
} from "../../composables";
import { ChatPL } from "../../types/ChatPL";

const endpointFormRef = ref<InstanceType<typeof ElForm> | null>(null);

const {
  endpointsOfModelType,
  isInvalidEndpoint,
  initEndpointState,
  getEndpoint,
} = useEndpoint();

const { sceneState, getScene, initSceneState } = useScene();

const { initKnowledgeBaseState, getKnowledgeBases } = useKnowledgeBase();

const { initToolState, getTools } = useTool();

const { initAgentState, getAgents } = useAgent();

const { getSceneRequiredEndpoints } = useRequiredEndpoints({
  getAgents,
  getKnowledgeBases,
});

const requiredEndpoints = computed(() => {
  return getSceneRequiredEndpoints(getScene(sessionState.current?.scene_id));
});

const {
  sessionState,
  createSession,
  addSession,
  removeSession,
  initSessionState,
} = useSession({
  getCurrentScene() {
    return sceneState.current ?? undefined;
  },
});

const endpoints = computed(() => {
  if (!sessionState.current) return;
  return Object.fromEntries(
    Object.entries(sessionState.current.endpoints_ids)
      .map(([model_key, endpoint_id]) => {
        const endpointPO = getEndpoint(endpoint_id);
        return [
          model_key as ModelsKeys,
          endpointPO ? new Endpoint(endpointPO) : undefined,
        ];
      })
      .filter(([, endpoint_po]) => endpoint_po !== undefined)
  ) as Record<ModelsKeys, Endpoint>;
});

function formatTool(toolPO: ChatPL.ToolPO): Tool {
  return new Tool(toolPO);
}

function formatKnowledgeBase(
  knowledgeBasePO: ChatPL.KnowledgeBasePO
): KnowledgeBase {
  return new KnowledgeBase(knowledgeBasePO);
}

function formatAgent(agentPO: ChatPL.AgentPO): Agent {
  return new Agent({
    ...agentPO,
    agents: getAgents(agentPO.agents_ids).map(formatAgent),
    tools: getTools(agentPO.tools_ids).map(formatTool),
    knowledge_bases: getKnowledgeBases(agentPO.knowledge_bases_ids).map(
      formatKnowledgeBase
    ),
  });
}

function formatScene(scenePO: ChatPL.ScenePO) {
  return new Scene({
    ...scenePO,
    agents: getAgents(scenePO.agents_ids).map(formatAgent),
    tools: getTools(scenePO.tools_ids).map(formatTool),
    knowledge_bases: getKnowledgeBases(scenePO.knowledge_bases_ids).map(
      formatKnowledgeBase
    ),
  });
}

const chatRef = ref<Chat>();

function initChat() {
  if (!endpoints.value) return;

  const session = sessionState.current;
  if (!session) return;

  const scene = getScene(session.scene_id);
  if (!scene) return;

  chatRef.value = new Chat({
    context: new ChatContext({
      ...formatScene(scene),
      messages: session.messages,
    }),
    endpoints: endpoints.value!,
  });
}

watch([() => sessionState.current, () => endpoints.value], initChat);

const isHasPendingMessage = computed(() => {
  return chatRef.value?.isHasPendingMessage;
});

async function onSendClick() {
  if (!sessionState.current?.newMessage) {
    ElMessage.error("请输入内容");
    return;
  }

  try {
    await endpointFormRef.value?.validate();
  } catch (error) {
    ElMessage.error("请选择服务端");
    return;
  }

  chatRef.value?.sendUserMessage(sessionState.current.newMessage);
  sessionState.current.newMessage = "";
}

function onAbortClick() {
  chatRef.value?.abortLastSend();
}

onMounted(async () => {
  await Promise.all([
    initEndpointState(),
    initSceneState(),
    initKnowledgeBaseState(),
    initToolState(),
    initAgentState(),
  ]);
  await initSessionState();
});
</script>

<style lang="scss" scoped>
.chat {
  flex-grow: 1;
  display: flex;
  font-size: 14px;

  .left-side-bar,
  .center-content,
  .right-side-bar {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .center-content {
    flex-grow: 1;
    background-color: var(--el-bg-color-page);
    width: 0px;
  }
}

.scroll {
  height: 0;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

.messages {
  padding: 0.5em;
}

.chat-input-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  border-top: var(--el-border);
  box-shadow: var(--el-box-shadow-light);
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px;

  .left,
  .right {
    display: flex;
    align-items: center;
  }

  .right {
    margin-left: 12px;
  }

  .endpoint-form :deep() {
    margin-left: 12px;
    margin-bottom: -18px;

    .el-form-item {
      margin-right: 12px;
    }

    .el-select {
      width: 120px;
    }
  }
}

.input-row {
  display: flex;
  margin: 0 6px 6px;
}

.textarea {
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 100px;
  background-color: var(--el-input-bg-color, var(--el-fill-color-blank));
  border-radius: var(--el-input-border-radius, var(--el-border-radius-base));
  box-shadow: 0 0 0 1px var(--el-input-border-color, var(--el-border-color))
    inset;
  border: none;
  padding: 0.5em;
  resize: none;

  &:focus {
    box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    outline: none;
  }
}

.scenes-side-bar {
  background-color: var(--el-bg-color);
  width: 240px;
  border-right: var(--el-border);
  box-shadow: var(--el-box-shadow);
  position: relative;
  z-index: 2;

  .scenes {
    padding: 12px;
  }

  .scene {
    box-sizing: border-box;
    width: 100%;
    background-color: var(--el-bg-color);
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 6px;
    border: var(--el-border);
    // border-color: var(--el-border-color);
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    cursor: pointer;
    box-shadow: var(--el-box-shadow-light);

    &.is-current {
      border-left: 3px solid var(--el-color-primary);

      // color: var(--el-color-primary);
      // border-color: var(--el-color-primary);
      // .icon {
      //   outline: thin solid var(--el-color-primary);
      // }
      .title {
        font-weight: bold;
      }
    }

    .icon {
      pointer-events: none;
      border: none;
      background-color: var(--el-fill-color);
    }

    .title {
      margin-left: 12px;
      display: flex;
      display: block;
      width: 0px;
      flex-grow: 1;
      border: none;
      padding: none;
      margin: none;
      height: 32px;
      color: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;

      &:focus {
        outline: none;
      }
    }

    .remove {
      margin-left: 12px;
      display: block;
      cursor: pointer;
      color: var(--el-text-color-secondary);

      &:hover {
        color: var(--el-color-error);
      }
    }
  }
}

.sessions-side-bar {
  background-color: var(--el-bg-color);
  width: 240px;
  border-right: var(--el-border);
  box-shadow: var(--el-box-shadow);
  position: relative;
  z-index: 1;

  .sessions {
    padding: 12px;
  }

  .session {
    box-sizing: border-box;
    width: 100%;
    background-color: var(--el-bg-color);
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 6px;
    border: var(--el-border);
    // border-color: var(--el-border-color);
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    cursor: pointer;
    box-shadow: var(--el-box-shadow-light);

    &.is-current {
      border-left: 3px solid var(--el-color-success);

      // color: var(--el-color-success);
      // border-color: var(--el-color-success);
      // .icon {
      //   outline: thin solid var(--el-color-success);
      // }
      .title {
        font-weight: bold;
        background-color: unset;
      }
    }

    .icon {
      border: none;
      background-color: var(--el-fill-color);
    }

    .title {
      margin-left: 12px;
      display: flex;
      display: block;
      width: 0px;
      flex-grow: 1;
      border: none;
      padding: none;
      margin: none;
      height: 32px;
      color: inherit;
      cursor: pointer;

      &:focus {
        outline: none;
      }
    }

    .remove {
      margin-left: 12px;
      display: block;
      cursor: pointer;
      color: var(--el-text-color-secondary);

      &:hover {
        color: var(--el-color-error);
      }
    }
  }

  .add-session {
    margin: 12px;
  }
}
</style>

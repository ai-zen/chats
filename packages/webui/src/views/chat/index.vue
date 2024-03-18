<template>
  <div class="chat">
    <!-- 场景列表侧边栏 -->
    <div class="left-side-bar scenes-side-bar" v-loading="sceneState.isLoading">
      <el-scrollbar class="scroll-y">
        <div class="scenes">
          <div
            class="scene"
            v-for="scene of sceneState.list"
            :key="scene.id"
            @click="onSceneClick(scene)"
            :class="{
              'is-current': sceneState.current?.id == scene.id,
            }"
          >
            <EmojiInput disabled class="icon" v-model="scene.icon"></EmojiInput>
            <div class="title">{{ scene.title }}</div>
            <div class="add" @click="addSessionByScene(scene)">
              <el-icon>
                <Plus></Plus>
              </el-icon>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <div class="center-content">
      <!-- 对话列表侧边栏 -->
      <div
        class="top-bar sessions-top-bar"
        v-if="sessionState.list.length"
        v-loading="sessionState.isLoading"
      >
        <el-scrollbar class="scroll-x">
          <div class="sessions">
            <div class="session placeholder-session"></div>
            <div
              class="session"
              v-for="session of sessionState.list"
              :key="session.id"
              @click="onSessionTabClick(session)"
              :class="{
                'is-current': sessionState.current?.id == session.id,
              }"
            >
              <div class="icon">{{ session.icon }}</div>
              <div class="title">{{ session.title }}</div>
              <el-icon class="remove" @click.stop="removeSession(session.id)">
                <CloseBold />
              </el-icon>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- 对话内容 -->
      <div
        class="chat-content"
        v-loading="sceneState.isLoading || sessionState.isLoading"
      >
        <template v-if="sessionState.current">
          <el-scrollbar class="scroll-y" ref="scrollBarRef">
            <div class="messages">
              <template
                v-for="(message, _index) of sessionState.current.messages"
                :key="_index"
              >
                <ChatMessage v-if="!message.hidden" :message="message" />
              </template>
            </div>
          </el-scrollbar>

          <div class="chat-input-panel">
            <div class="toolbar-row">
              <div class="left">
                <el-button
                  size="small"
                  title="设置"
                  @click="sessionSettingDialogState.visible = true"
                  ><el-icon> <Setting /> </el-icon
                ></el-button>
                <el-button size="small" title="上传图片"
                  ><el-icon> <PictureRounded /> </el-icon
                ></el-button>
                <el-button size="small" title="提问示例"
                  ><el-icon> <MagicStick /> </el-icon
                ></el-button>
                <el-button size="small" title="emoji">😀</el-button>
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
    </div>

    <!-- 右侧边栏，待定 -->
    <div class="right-side-bar">
      <!-- Scene List -->
    </div>

    <el-dialog title="场景配置" v-model="sessionSettingDialogState.visible">
      <el-form
        v-if="sessionState.current && currentScene"
        :model="sessionState.current"
        ref="sessionSettingFormRef"
        label-position="top"
      >
        <el-form-item
          prop="model_key"
          label="聊天模型"
          :rules="{
            validator(_rule, value, callback) {
              if (!(endpointsModelKeyMap as any)[value ?? (currentScene as any).model_key]?.length) {
                callback(new Error('请选择可用的聊天模型'));
              } else {
                callback();
              }
            },
          }"
        >
          <el-select
            v-model="sessionState.current.model_key"
            style="width: 100%"
            clearable
            :placeholder="`使用场景默认模型 (${
              Models[currentScene.model_key]?.title
            })`"
          >
            <el-option
              v-for="Model of ChatCompletionModels"
              :label="`${Model.title} (${endpointsModelKeyMap[Model.name as ModelsKeys]?.length || 0})`"
              :value="Model.name"
              :disabled="!endpointsModelKeyMap[Model.name as ModelsKeys]?.length"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  Chat,
  ChatCompletionModels,
  Models,
  ModelsKeys,
} from "@ai-zen/chats-core";
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
import { ElForm, ElMessage, ElScrollbar } from "element-plus";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { ChatMessage, EmojiInput } from "../../components";
import {
  useAgent,
  useEndpoint,
  useKnowledgeBase,
  useScene,
  useSession,
  useTool,
} from "../../composables";
import { useDeserialize } from "../../composables/useDeserialize";
import { ChatPL } from "../../types/ChatPL";
import { debounce } from "../../utils/debounce";
import { nextFrame } from "../../utils/sleep";

const scrollBarRef = ref<InstanceType<typeof ElScrollbar> | undefined>();

const { endpointsModelKeyMap, endpointsInstances, initEndpointState } =
  useEndpoint();

const { sceneState, getScene, initSceneState } = useScene();

const { initKnowledgeBaseState, getKnowledgeBases } = useKnowledgeBase();

const { initToolState, getTools } = useTool();

const { initAgentState, getAgents } = useAgent();

const { formatScene } = useDeserialize({
  getAgents,
  getKnowledgeBases,
  getTools,
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

const chatRef = ref<Chat>();

function initChat() {
  const sessionPO = sessionState.current;
  if (!sessionPO) return;
  const scenePO = getScene(sessionPO.scene_id);
  if (!scenePO) return;

  const scene = formatScene(scenePO);

  chatRef.value = new Chat({
    ...scene,
    model_key: sessionPO.model_key || scene.model_key,
    model_config: sessionPO.model_config || scene.model_config,
    messages: sessionPO.messages,
    endpoints: endpointsInstances.value,
  });
}

watch(
  [
    () => sessionState.current,
    () => sessionState.current?.model_key,
    () => sessionState.current?.model_config,
  ],
  initChat
);

const currentScene = computed(() => {
  return getScene(sessionState.current?.scene_id);
});

const isHasPendingMessage = computed(() => {
  return chatRef.value?.isHasPendingMessage;
});

async function onSendClick() {
  if (!chatRef.value) {
    ElMessage.error("未初始化有效聊天");
    return;
  }

  if (!sessionState.current?.newMessage) {
    ElMessage.error("请输入内容");
    return;
  }

  try {
    await sessionSettingFormRef.value?.validate();
  } catch (error) {
    ElMessage.error("请选择一个有效的服务端");
    sessionSettingDialogState.visible = true;
    return;
  }

  // 发送，并将结果同步到会话，触发自动保存
  const question = sessionState.current.newMessage;
  sessionState.current.newMessage = "";
  await chatRef.value.send(question);
}

/**
 * 响应点击中止
 */
function onAbortClick() {
  chatRef.value?.abort();
}

/**
 * 判断某个会话自从创建后是否还未经使用
 */
function isUnusedSession(session: ChatPL.SessionPO) {
  return session.messages.length == getScene(session.scene_id)?.messages.length;
}

/**
 * 响应点击场景列表项
 */
function onSceneClick(scene: ChatPL.ScenePO) {
  sceneState.current = scene;
  const lastSession = sessionState.list.at(-1);

  // 如果存在最后一个会话且未使用则先删除
  if (lastSession && isUnusedSession(lastSession)) {
    removeSession(lastSession.id);
  }

  // 从场景添加一个新会话
  addSessionByScene(scene);
}

/**
 * 从场景添加一个新会话
 */
function addSessionByScene(scene: ChatPL.ScenePO) {
  addSession(createSession(scene));
}

/**
 * 切换当前会话
 */
function onSessionTabClick(session: ChatPL.SessionPO) {
  sessionState.current = session;
  sceneState.current = getScene(session.scene_id) ?? null;
}

// 滚动到底部（带防抖）
const scrollToBottomWithDebounce = debounce(async () => {
  await nextTick();
  await nextFrame();

  const scrollBarEl = scrollBarRef.value?.wrapRef;
  if (!scrollBarEl) return;

  scrollBarEl.scrollTo({ behavior: "smooth", top: scrollBarEl.scrollHeight });
}, 100);

// 任意消息内容变化触发滚动
watch(
  () => sessionState.current?.messages,
  () => {
    const scrollBarEl = scrollBarRef.value?.wrapRef;
    if (!scrollBarEl) return;

    // 判断渲染前是否处于底部，如果处于底部那么就在下一次渲染后滚动到底部
    if (
      scrollBarEl.scrollTop >=
      scrollBarEl.scrollHeight - scrollBarEl.clientHeight - 200
    ) {
      scrollToBottomWithDebounce();
    }
  },
  { deep: true }
);

const sessionSettingFormRef = ref<InstanceType<typeof ElForm> | null>(null);

const sessionSettingDialogState = reactive({
  visible: true, // 提前渲染会话表单
});

onMounted(async () => {
  sessionSettingDialogState.visible = false;
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
    // background-color: var(--el-bg-color-page);
    width: 0px;
  }
}

.scroll-y {
  height: 0;
  flex-grow: 1;
}

.scroll-x:deep() {
  width: 0;
  flex-grow: 1;

  .el-scrollbar__view {
    display: flex;
  }
}

.messages {
  padding: 0.5em;
}

.chat-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.chat-input-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
  // border-top: var(--el-border);
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
  width: 200px;
  position: relative;
  z-index: 2;
  // border-right: var(--el-border);
  box-shadow: var(--el-box-shadow-light);

  .scenes {
    padding: 0px;
  }

  .scene {
    box-sizing: border-box;
    width: 100%;
    background-color: var(--el-bg-color);
    padding: 8px 0px;
    // margin-bottom: 12px;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    cursor: pointer;
    // border-left: 4px solid var(--el-border-color-light);
    border-left: 4px solid transparent;

    &.is-current {
      border-left: 4px solid var(--el-color-primary);

      .title {
        font-weight: bold;
        color: var(--el-color-primary);
      }
    }

    .icon {
      pointer-events: none;
      border: none;
      background-color: var(--el-fill-color);
      margin-left: 12px;
    }

    .title {
      margin-left: 12px;
      width: 0px;
      flex-grow: 1;
      font-size: 14px;
      word-break: break-all;
    }

    .add {
      margin-left: 12px;
      margin-right: 12px;
      width: 24px;
      height: 24px;
      background-color: var(--el-color-primary-light-8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--el-color-primary);
      border-radius: 6px;
      font-size: 14px;
      transition: 0.3s;

      &:hover {
        background-color: var(--el-color-primary);
        color: var(--el-fill-color);
      }
    }
  }
}

.sessions-top-bar {
  background-color: var(--el-bg-color);
  width: 100%;
  height: 39px;
  position: relative;
  flex-shrink: 0;
  z-index: 1;
  box-shadow: var(--el-box-shadow-light);
  // border-bottom: var(--el-border);
  display: flex;

  .sessions {
    flex-grow: 1;
    height: 39px;
    display: flex;
    width: max-content;
    flex-shrink: 0;
    flex-direction: row-reverse;
  }

  .session.placeholder-session {
    flex-grow: 1;
    border-top: 3px solid transparent;
  }

  .session {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 6px;
    // border-top: 3px solid var(--el-border-color-light);
    border-top: 3px solid transparent;
    // border-right: var(--el-border);
    // border-bottom: var(--el-border);
    // border-radius: 6px 6px 0 0;

    &.is-current {
      border-top: 3px solid var(--el-color-primary);
      border-bottom-color: transparent;

      .title {
        font-weight: bold;
        background-color: unset;
      }
    }

    .icon {
      border: none;
      font-size: 12px;
      background-color: var(--el-bg-color-page);
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .title {
      margin-left: 6px;
      font-size: 12px;

      &:focus {
        outline: none;
      }
    }

    .remove {
      margin-left: 6px;
      display: block;
      cursor: pointer;
      color: var(--el-text-color-secondary);

      &:hover {
        color: var(--el-color-error);
      }
    }
  }

  .empty {
    display: flex;
    align-items: center;
    padding: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>

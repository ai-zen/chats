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
            <AutoIcon class="icon" :icon="scene.icon"></AutoIcon>
            <div class="title">{{ scene.title }}</div>
            <div class="add" @click="addSessionByScene(scene)">
              <el-icon>
                <Plus />
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
              <AutoIcon class="icon" :icon="session.icon"></AutoIcon>
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
              <template v-for="message of sessionState.current.messages">
                <ChatMessage v-if="!message.hidden" :message="message" />
              </template>
            </div>
          </el-scrollbar>

          <Resize :placements="['top']" width="100%" height="300px">
            <div class="chat-input-panel">
              <div class="toolbar-row">
                <div class="left">
                  <el-button
                    size="small"
                    title="设置"
                    @click="settingDialogRef?.open()"
                    :icon="Setting"
                  />

                  <ImagePicker
                    v-if="currentModelClass?.IS_SUPPORT_IMAGE_CONTENT"
                    v-model="sessionState.current.new_message_image"
                  >
                    <template #default="{ open }">
                      <el-button
                        size="small"
                        title="上传图片"
                        @click="open"
                        :icon="PictureRounded"
                      />
                    </template>
                  </ImagePicker>

                  <el-tooltip
                    v-else
                    content="当前模型不支持上传图片"
                    placement="top"
                  >
                    <el-button
                      size="small"
                      title="上传图片"
                      disabled
                      :icon="PictureRounded"
                    />
                  </el-tooltip>

                  <el-button size="small" title="提问示例" :icon="MagicStick" />

                  <EmojiPicker
                    @output="
                      sessionState.current.new_message_content =
                        insertTextAtCursor(inputRef!, $event)
                    "
                  >
                    <el-button size="small" title="emoji">😀</el-button>
                  </EmojiPicker>
                </div>

                <!-- Resize Bar -->

                <div class="right">
                  <el-button
                    size="small"
                    plain
                    title="语音输入"
                    :icon="Microphone"
                  />
                  <el-button
                    type="primary"
                    plain
                    title="发送"
                    @click="onSendClick"
                    :disabled="isHasPendingMessage"
                    :icon="Promotion"
                    >发送</el-button
                  >
                  <el-button
                    type="danger"
                    plain
                    title="停止"
                    @click="onAbortClick"
                    :disabled="!isHasPendingMessage"
                    :icon="VideoPause"
                    >停止</el-button
                  >
                </div>
              </div>

              <div class="input-row">
                <textarea
                  v-if="sessionState.current"
                  class="textarea"
                  v-model="sessionState.current.new_message_content"
                  placeholder="请输入..."
                  ref="inputRef"
                ></textarea>
              </div>
            </div>
          </Resize>
        </template>

        <template v-else>
          <el-empty
            description="请从左侧新增对话以进行对话。"
            style="margin: auto"
          ></el-empty>
        </template>
      </div>
    </div>

    <SettingDialog
      :endpointsModelKeyMap="endpointsModelKeyMap"
      :currentSession="sessionState.current"
      :currentSessionScene="currentSessionScene"
      :currentModelKey="currentModelKey"
      ref="settingDialogRef"
    />
  </div>
</template>

<script setup lang="ts">
import { ChatAL, ChatCompletionModels } from "@ai-zen/chats-core";
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
import { ElMessage, ElScrollbar } from "element-plus";
import { computed, onMounted, ref } from "vue";
import { AutoIcon, ChatMessage, EmojiPicker, Resize } from "../../components";
import {
  useAgent,
  useEndpoint,
  useKnowledgeBase,
  useScene,
  useSession,
  useTool,
} from "../../composables";
import { ChatPL } from "../../types/ChatPL";
import { insertTextAtCursor } from "../../utils";
import ImagePicker from "./ImagePicker.vue";
import SettingDialog from "./SettingDialog.vue";
import { useAutoScroll } from "./useAutoScroll";
import { useChat } from "./useChat";

const scrollBarRef = ref<InstanceType<typeof ElScrollbar> | undefined>();
const inputRef = ref<HTMLTextAreaElement | undefined>();
const settingDialogRef = ref<InstanceType<typeof SettingDialog> | undefined>();

const { endpointState, endpointsModelKeyMap, initEndpointState } =
  useEndpoint();

const { sceneState, getScene, initSceneState } = useScene();

const { initKnowledgeBaseState, getKnowledgeBases } = useKnowledgeBase();

const { initToolState, getTools } = useTool();

const { initAgentState, getAgents } = useAgent();

const {
  sessionState,
  createSession,
  addSession,
  removeSession,
  initSessionState,
} = useSession({
  getDefaultScene() {
    return sceneState.current ?? undefined;
  },
});

const currentSessionScene = computed(() => {
  return getScene(sessionState.current?.scene_id);
});

const currentModelKey = computed(() => {
  return (
    sessionState.current?.model_key || currentSessionScene.value?.model_key
  );
});

const currentModelClass = computed(() => {
  return ChatCompletionModels[currentModelKey.value!];
});

const { chatRef, isHasPendingMessage } = useChat({
  getCurrentSession: () => sessionState.current,
  getCurrentSessionScene: () => currentSessionScene.value,
  getEndpoints: () => endpointState.list,
  getAgents,
  getKnowledgeBases,
  getTools,
});

useAutoScroll({
  getScrollEl: () => scrollBarRef.value?.wrapRef,
  getMessages: () => sessionState.current?.messages,
});

async function onSendClick() {
  if (!chatRef.value) {
    ElMessage.error("未初始化有效聊天");
    return;
  }

  if (!sessionState.current?.new_message_content) {
    ElMessage.error("请输入内容");
    return;
  }

  try {
    await settingDialogRef.value?.validate();
  } catch (error) {
    ElMessage.error("请选择一个有效的服务端");
    settingDialogRef.value?.open();
    return;
  }

  // 发送，并将结果同步到会话，触发自动保存
  const text = sessionState.current.new_message_content;
  const image = sessionState.current.new_message_image;
  sessionState.current.new_message_content = "";
  sessionState.current.new_message_image = "";

  // 生成消息内容
  let content: ChatAL.MessageContentSection[] | string;
  if (image) {
    content = [
      { type: "image_url", image_url: { url: image } },
      { type: "text", text: text },
    ];
  } else {
    content = text;
  }

  await chatRef.value.send(content);
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
  height: 100%;
  width: 100%;
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
  height: 0px;
  flex-grow: 1;
}

.textarea {
  width: 100%;
  height: 100%;
  display: block;
  box-sizing: border-box;
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
  width: 220px;
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
    padding: 12px 0px;
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
      width: 32px;
      height: 32px;
      font-size: 14px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;

      pointer-events: none;
      border: none;
      background-color: var(--el-fill-color);
      margin-left: 12px;
    }

    .title {
      font-family: monospace;
      margin-left: 12px;
      width: 0px;
      flex-grow: 1;
      font-size: 12px;
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

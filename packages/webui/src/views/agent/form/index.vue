<template>
  <div class="agent-edit-page">
    <el-page-header :content="currentModeConfig?.title" @back="$router.back()">
    </el-page-header>

    <el-form
      class="form"
      :model="formState.form"
      ref="formRef"
      label-width="120px"
    >
      <el-form-item
        prop="id"
        label="编号"
        :rules="{ required: true, message: '请输入编号' }"
      >
        <el-input
          :disabled="route.query.mode == FormMode.Edit"
          v-model="formState.form.id"
        ></el-input>
      </el-form-item>

      <el-form-item
        prop="icon"
        label="图标"
        :rules="{ required: true, message: '请选择图标' }"
      >
        <EmojiInput v-model="formState.form.icon"></EmojiInput>
      </el-form-item>

      <el-form-item
        prop="title"
        label="标题"
        :rules="{ required: true, message: '请输入标题' }"
      >
        <el-input
          v-model="formState.form.title"
          placeholder="请输入标题"
        ></el-input>
      </el-form-item>

      <el-form-item
        prop="function.name"
        label="调用名称"
        :rules="{ required: true, message: '请输入调用名称' }"
      >
        <el-input
          v-model="formState.form.function.name"
          placeholder="请输入调用名称"
        ></el-input>
      </el-form-item>

      <el-form-item
        prop="function.description"
        label="调用描述"
        :rules="{ required: true, message: '请输入调用描述' }"
      >
        <el-input
          v-model="formState.form.function.description"
          placeholder="请输入调用描述"
        ></el-input>
      </el-form-item>

      <el-form-item prop="function.parameters" label="调用入参">
        <ParametersEditor v-model="formState.form.function.parameters" />
      </el-form-item>

      <el-form-item
        prop="messages"
        label="预设消息"
        :rules="{
          required: true,
          type: 'array',
          validator(_rule, value: ChatAL.Message[], callback) {
            if(!value.length) {
              callback(new Error('请添加预设消息'));
            } else if(value.at(-1)?.role == ChatAL.Role.Assistant) {
              callback(new Error('预设消息不能以 AI 角色的消息结尾'));
            } else {
              callback();
            }
          },
        }"
      >
        <el-text size="small">
          {{
            "可以使用 \{\{ 参数名称 \}\} 的方式将调用入参作为变量加入到预设消息中。"
          }}
        </el-text>
        <MessagesEditor v-model="formState.form.messages" />
      </el-form-item>

      <el-form-item
        prop="model_key"
        label="模型"
        :rules="{ required: true, message: '请选择模型' }"
      >
        <el-select v-model="formState.form.model_key">
          <el-option
            v-for="model of ChatCompletionModels"
            :value="model.name"
            :label="model.title"
          ></el-option>
        </el-select>
      </el-form-item>

      <component
        v-if="
          formState.form.model_key && MODELS_FORMS_MAP[formState.form.model_key]
        "
        :is="MODELS_FORMS_MAP[formState.form.model_key]"
        :model_config="formState.form.model_config"
        :model_key="formState.form.model_key"
      >
      </component>

      <el-form-item
        prop="knowledge_bases_ids"
        label="知识库"
        :rules="{ required: false, type: 'array' }"
      >
        <el-select v-model="formState.form.knowledge_bases_ids" multiple>
          <el-option
            v-for="knowledgeBase of knowledgeBaseState.list"
            :value="knowledgeBase.id"
            :label="knowledgeBase.title"
          ></el-option>
        </el-select>
      </el-form-item>

      <el-form-item
        prop="agents_ids"
        label="代理"
        :rules="{ required: false, type: 'array' }"
      >
        <el-select v-model="formState.form.agents_ids" multiple>
          <!-- 过滤自己 -->
          <el-option
            v-for="agent of agentState.list.filter(
              (x) => x.id !== formState.form.id
            )"
            :value="agent.id"
            :label="agent.title"
          ></el-option>
        </el-select>
      </el-form-item>

      <el-form-item
        prop="tools_ids"
        label="工具"
        :rules="{ required: false, type: 'array' }"
      >
        <el-select v-model="formState.form.tools_ids" multiple>
          <el-option
            v-for="tool of toolState.list"
            :value="tool.id"
            :label="tool.title"
          ></el-option>
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submit">
          <el-icon><Check /></el-icon>&ensp;完成
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ChatAL, ChatCompletionModels } from "@ai-zen/chats-core";
import { Check } from "@element-plus/icons-vue";
import { ElForm, ElMessage } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import * as api from "../../../api";
import EmojiInput from "../../../components/EmojiInput/index.vue";
import MessagesEditor from "../../../components/MessagesEditor/index.vue";
import { MODELS_FORMS_MAP } from "../../../components/ModelsForms";
import ParametersEditor from "../../../components/ParametersEditor/index.vue";
import { useAgent } from "../../../composables/useAgent";
import { useKnowledgeBase } from "../../../composables/useKnowledgeBase";
import { useTool } from "../../../composables/useTool";
import router from "../../../router";
import { ChatPL } from "../../../types/ChatPL";
import { FormMode } from "../../../types/Common";
import { uuid } from "../../../utils/uuid";

const formRef = ref<InstanceType<typeof ElForm> | null>(null);

const route = useRoute();

const MODE_CONFIG: Record<FormMode, { title: string }> = {
  create: {
    title: "新增代理",
  },
  edit: {
    title: "编辑代理",
  },
};

const currentModeConfig = computed(
  () => MODE_CONFIG[route.query.mode as FormMode]
);

function createAgent() {
  return <ChatPL.AgentPO>{
    agents_ids: [],
    icon: "🤖",
    id: uuid(),
    knowledge_bases_ids: [],
    messages: [
      {
        role: ChatAL.Role.System,
        content: "你是一个AI助手，专门帮助用户查找信息。",
        hidden: true,
        status: ChatAL.MessageStatus.Completed,
      },
    ],
    model_key: ChatCompletionModels.GPT35Turbo_1106.name,
    model_config: {},
    title: "",
    tools_ids: [],
    type: "function",
    function: {
      parameters: {
        type: "object",
        properties: {
          arg1: {
            type: "string",
            description: "参数1说明",
          },
        },
        required: ["arg1"],
      },
      description: "",
      name: "",
    },
  };
}

const formState = reactive({
  form: createAgent(),
  isLoading: false,
  isSaving: false,
});

onMounted(async () => {
  try {
    if (route.query.mode == FormMode.Create) {
      formState.form = createAgent();
    } else if (
      route.query.mode == FormMode.Edit &&
      typeof route.query.id == "string"
    ) {
      const agent = await api.getAgent(route.query.id);
      if (!agent)
        throw new Error(`未查找到 id == ${route.query.id} 对应的代理`);
      formState.form = agent;
    } else {
      throw new Error(`非法访问`);
    }
  } catch (error: any) {
    ElMessage.error(`初始化表单失败：${error?.message}`);
  }
});

async function submit() {
  formState.isSaving = true;

  try {
    await formRef.value?.validate();
  } catch (error) {
    formState.isSaving = false;
    ElMessage.error("请确保所有内容填写正确！");
    return;
  }

  try {
    const agent = JSON.parse(JSON.stringify(formState.form));

    if (route.query.mode == FormMode.Create) {
      await api.addAgent(agent);
    } else {
      await api.editAgent(agent);
    }

    ElMessage.success("操作成功！");

    router.back(); // 立即回到上一页
  } catch (error: any) {
    ElMessage.error(`操作失败：${error?.message || "未知错误"}`);
  } finally {
    formState.isSaving = false;
  }
}

const { knowledgeBaseState, initKnowledgeBaseState } = useKnowledgeBase();
const { agentState, initAgentState } = useAgent();
const { toolState, initToolState } = useTool();

onMounted(() => {
  initKnowledgeBaseState();
  initAgentState();
  initToolState();
});
</script>

<style lang="scss" scoped>
.agent-edit-page {
  padding: 20px;
}

.form {
  margin-top: 20px;
  width: 600px;
}
</style>

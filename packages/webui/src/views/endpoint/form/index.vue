<template>
  <div class="endpoint-edit-page">
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
        prop="model_key"
        label="模型"
        :rules="{ required: true, message: '请选择模型' }"
      >
        <el-select v-model="formState.form.model_key">
          <el-option
            v-for="model of Models"
            :value="model.name"
            :label="model.title"
          ></el-option>
        </el-select>
      </el-form-item>

      <component
        v-if="
          formState.form.model_key &&
          formState.form.model_key in MODELS_FORMS_MAP &&
          'ENDPOINT_CONFIG_FORM' in MODELS_FORMS_MAP[formState.form.model_key]
        "
        :is="MODELS_FORMS_MAP[formState.form.model_key].ENDPOINT_CONFIG_FORM"
        :endpoint_config="formState.form.endpoint_config"
      >
      </component>

      <el-form-item>
        <el-button type="primary" @click="submit">
          <el-icon> <Check /> </el-icon>&ensp;完成
        </el-button>
      </el-form-item>

      <!-- <el-form-item>
        <pre><code>{{ formState.form }}</code></pre>
      </el-form-item> -->
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { Models, ModelsKeys } from "@ai-zen/chats-core";
import { Check } from "@element-plus/icons-vue";
import { ElForm, ElMessage } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import * as api from "../../../api";
import EmojiInput from "../../../components/EmojiInput/index.vue";
import { MODELS_FORMS_MAP } from "../../../components/ModelsForms";
import router from "../../../router";
import { ChatPL } from "../../../types/ChatPL";
import { FormMode } from "../../../types/Common";
import { uuid } from "../../../utils/uuid";

const formRef = ref<InstanceType<typeof ElForm> | null>(null);

const route = useRoute();

const MODE_CONFIG: Record<FormMode, { title: string }> = {
  create: {
    title: "新增服务端",
  },
  edit: {
    title: "编辑服务端",
  },
};

const currentModeConfig = computed(
  () => MODE_CONFIG[route.query.mode as FormMode]
);

function createEndpoint() {
  return <ChatPL.EndpointPO>{
    id: uuid(),
    title: "",
    icon: "🌏",
    endpoint_config: {
      url: "",
      headers: {
        "Content-Type": "application/json",
        // Authorization: "",
        // "api-key": "",
      },
      body: {
        // model: "",
      },
    },
    model_key: "" as ModelsKeys,
  };
}

const formState = reactive({
  form: createEndpoint(),
  isLoading: false,
  isSaving: false,
});

onMounted(async () => {
  try {
    if (route.query.mode == FormMode.Create) {
      formState.form = createEndpoint();
    } else if (
      route.query.mode == FormMode.Edit &&
      typeof route.query.id == "string"
    ) {
      const endpoint = await api.getEndpoint(route.query.id);
      if (!endpoint)
        throw new Error(`未查找到 id == ${route.query.id} 对应的服务端`);
      formState.form = endpoint;
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
    const endpoint = JSON.parse(JSON.stringify(formState.form));

    if (route.query.mode == FormMode.Create) {
      await api.addEndpoint(endpoint);
    } else {
      await api.editEndpoint(endpoint);
    }

    ElMessage.success("操作成功！");

    router.back(); // 立即回到上一页
  } catch (error: any) {
    ElMessage.error(`操作失败：${error?.message || "未知错误"}`);
  } finally {
    formState.isSaving = false;
  }
}
</script>

<style lang="scss" scoped>
.endpoint-edit-page {
  padding: 20px;
}

.form {
  margin-top: 20px;
  width: 600px;
}

.message-list {
  display: flex;
  flex-direction: column;
  width: 100%;

  .message {
    border-left: 2px solid var(--el-color-primary-light-5);
    padding-left: 12px;
  }

  .message + .message {
    margin-top: 12px;
  }

  .role {
    width: 0;
    flex-grow: 1;
  }

  .delete {
    margin-left: 12px;
  }

  .message {
    width: 100%;
  }

  .label {
    color: var(--el-text-color-secondary);
  }

  .content {
    margin-top: 6px;
  }

  .button-row {
    margin-top: 12px;
  }
}
</style>

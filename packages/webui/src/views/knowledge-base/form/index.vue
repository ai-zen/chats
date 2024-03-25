<template>
  <div class="knowledge-base-edit-page">
    <el-page-header :content="currentModeConfig?.title" @back="$router.back()">
    </el-page-header>

    <el-form
      class="form"
      :model="formState.form"
      v-loading="formState.isLoading"
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
        <!-- <EmojiInput v-model="formState.form.icon"></EmojiInput> -->
        <el-input
          v-model="formState.form.icon"
          placeholder="可以输入 emoji 或 图片url（http:// 或 https:// 开头）"
        ></el-input>
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
        <el-select
          v-model="formState.form.model_key"
          :disabled="route.query.mode == FormMode.Edit"
        >
          <el-option
            v-for="(model, key) of EmbeddingModels"
            :value="key"
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

      <el-form-item>
        <el-button
          type="primary"
          @click="submit"
          :icon="Check"
          :loading="formState.isSaving"
          >完成</el-button
        >
      </el-form-item>

      <!-- <el-form-item>
        <pre><code>{{ formState.form }}</code></pre>
      </el-form-item> -->
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { EmbeddingModels } from "@ai-zen/chats-core";
import { Check } from "@element-plus/icons-vue";
import { ElForm, ElMessage } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import * as api from "../../../api";
import { MODELS_FORMS_MAP } from "../../../components/ModelsForms";
import router from "../../../router";
import { ChatPL } from "../../../types/ChatPL";
import { FormMode } from "../../../types/Common";
import { uuid } from "../../../utils/uuid";

const formRef = ref<InstanceType<typeof ElForm> | null>(null);

const route = useRoute();

const MODE_CONFIG: Record<FormMode, { title: string }> = {
  create: {
    title: "新增知识库",
  },
  edit: {
    title: "编辑知识库",
  },
};

const currentModeConfig = computed(
  () => MODE_CONFIG[route.query.mode as FormMode]
);

function createKnowledgeBase() {
  return <ChatPL.KnowledgeBasePO>{
    id: uuid(),
    title: "",
    icon: "📚",
    model_key: "TextEmbeddingAda002_2",
    model_config: {},
    data: [],
  };
}

const formState = reactive({
  form: createKnowledgeBase(),
  isLoading: false,
  isSaving: false,
});

onMounted(async () => {
  try {
    formState.isLoading = true;
    if (route.query.mode == FormMode.Create) {
      formState.form = createKnowledgeBase();
    } else if (
      route.query.mode == FormMode.Edit &&
      typeof route.query.id == "string"
    ) {
      const knowledgeBase = await api.getKnowledgeBase(route.query.id);
      if (!knowledgeBase)
        throw new Error(`未查找到 id == ${route.query.id} 对应的知识库`);
      formState.form = knowledgeBase;
    } else {
      throw new Error(`非法访问`);
    }
  } catch (error: any) {
    ElMessage.error(`初始化表单失败：${error?.message}`);
  } finally {
    formState.isLoading = false;
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
    const knowledgeBase = JSON.parse(JSON.stringify(formState.form));

    if (route.query.mode == FormMode.Create) {
      await api.addKnowledgeBase(knowledgeBase);
    } else {
      await api.editKnowledgeBase(knowledgeBase);
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
.knowledge-base-edit-page {
  padding: 20px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.form {
  margin-top: 20px;
  width: 600px;
}
</style>

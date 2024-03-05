<template>
  <el-dialog
    :title="FormMode.Create ? '新增条目' : '编辑条目'"
    v-model="dialogState.isOpen"
    width="720"
  >
    <el-form
      :model="dialogState.form"
      ref="dialogFormRef"
      label-width="100px"
      v-loading="dialogState.isOpening"
    >
      <el-form-item
        prop="id"
        label="编号"
        :rules="{ required: true, message: '请输入编号' }"
      >
        <el-input
          :disabled="dialogState.mode == FormMode.Edit"
          v-model="dialogState.form.id"
        ></el-input>
      </el-form-item>
      <el-form-item
        label="标题"
        prop="title"
        :rules="{ required: true, message: '请输入标题' }"
      >
        <el-input
          v-model="dialogState.form.title"
          placeholder="请输入标题"
        ></el-input>
      </el-form-item>
      <el-form-item
        label="内容"
        prop="text"
        :rules="{ required: true, message: '请输入内容' }"
      >
        <el-input
          v-model="dialogState.form.text"
          placeholder="请输入内容"
          type="textarea"
        ></el-input>
      </el-form-item>

      <el-form-item
        label="服务端"
        prop="endpoint_id"
        :rules="{
          required: true,
          validator(_rule, value, callback) {
            if (isInvalidEndpoint(ModelType.Embedding, value)) {
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
            Models[dialogState.detail?.model_key!]?.title
          }) 模型`"
        >
          <el-select
            v-model="dialogState.form.endpoint_id"
            :placeholder="`请选择模型服务端 (${
              Models[dialogState.detail?.model_key!]?.title
            })`"
            clearable
          >
            <el-option
              v-for="endpoint of endpointsOfModelType[ModelType.Embedding]"
              :key="endpoint.id"
              :label="endpoint.title"
              :value="endpoint.id"
            ></el-option>
          </el-select>
        </el-tooltip>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="onDialogCancel">取消</el-button>
      <el-button
        type="primary"
        @click="onDialogConfirm"
        :loading="dialogState.isSaving"
        >完成</el-button
      >
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {
  EmbeddingModel,
  EmbeddingModels,
  ModelType,
  Models,
} from "@ai-zen/chats-core";
import { ElForm, ElMessage } from "element-plus";
import { reactive, ref, toRaw } from "vue";
import * as api from "../../../api";
import { useEndpoint } from "../../../composables/useEndpoints";
import { ChatPL } from "../../../types/ChatPL";
import { FormMode } from "../../../types/Common";
import { uuid } from "../../../utils/uuid";

const emit = defineEmits<{
  save: [mode: FormMode, data: ChatPL.KnowledgeItemPO];
}>();

function createForm(): ChatPL.KnowledgeItemPO & { endpoint_id: string } {
  return {
    id: uuid(),
    title: "",
    text: "",
    endpoint_id: "",
    vector: [],
  };
}

const dialogState = reactive({
  isOpen: false,
  isOpening: false,
  isSaving: false,
  mode: FormMode.Create,
  detail: null as null | ChatPL.KnowledgeBasePO,
  form: createForm(),
});

const dialogFormRef = ref<null | InstanceType<typeof ElForm>>(null);

async function onDialogCancel() {
  dialogState.isOpen = false;
}

const {
  endpointsOfModelType,
  getEndpoint,
  isInvalidEndpoint,
  initEndpointState,
} = useEndpoint();

async function onDialogConfirm() {
  if (!dialogState.detail) return;
  if (dialogState.isSaving) return;

  dialogState.isSaving = true;

  try {
    await dialogFormRef.value?.validate();
  } catch (error) {
    dialogState.isSaving = false;
    ElMessage.error("请确保所有内容填写正确！");
    return;
  }

  try {
    const embeddingModel = new EmbeddingModels[dialogState.detail.model_key]({
      endpoint_config: getEndpoint(dialogState.form.endpoint_id)
        ?.endpoint_config,
      model_config: dialogState.detail.model_config,
    }) as EmbeddingModel;
    dialogState.form.vector = await embeddingModel.create(
      dialogState.form.text
    );
    const item = structuredClone(toRaw(dialogState.form));
    await api.putKnowledgeItem(dialogState.detail.id, item);
    dialogState.isOpen = false;
    ElMessage.success("保存成功！");
    emit("save", dialogState.mode, item);
  } catch (error: any) {
    ElMessage.error(`保存失败：${error?.message || "未知错误"}`);
  } finally {
    dialogState.isSaving = false;
  }
}

async function add(data: { detail: ChatPL.KnowledgeBasePO }) {
  dialogState.isOpening = true;
  dialogState.mode = FormMode.Create;
  dialogState.detail = data.detail;
  dialogState.form = createForm();
  await initEndpointState();
  dialogState.isOpen = true;
  dialogState.isOpening = false;
}

async function edit(data: {
  detail: ChatPL.KnowledgeBasePO;
  item: ChatPL.KnowledgeItemPO;
}) {
  dialogState.isOpening = true;
  dialogState.mode = FormMode.Edit;
  dialogState.detail = data.detail;
  dialogState.form = Object.assign(
    createForm(),
    structuredClone(toRaw(data.item))
  );
  await initEndpointState();
  dialogState.isOpen = true;
  dialogState.isOpening = false;
}

defineExpose({
  add,
  edit,
});
</script>

<style scoped></style>

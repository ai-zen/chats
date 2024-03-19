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
          resize="vertical"
          rows="10"
        ></el-input>
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
import { EmbeddingModel, EmbeddingModels } from "@ai-zen/chats-core";
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

function createForm(): ChatPL.KnowledgeItemPO {
  return {
    id: uuid(),
    title: "",
    text: "",
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

const { initEndpointState, matchEndpointInstance } = useEndpoint();

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
    const request_config = await matchEndpointInstance(
      dialogState.detail.model_key
    ).build(dialogState.detail.model_key);
    const embeddingModel = new EmbeddingModels[dialogState.detail.model_key]({
      request_config,
      model_config: dialogState.detail.model_config,
    }) as EmbeddingModel;
    dialogState.form.vector = await embeddingModel.createEmbedding(
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

<template>
  <el-dialog title="场景配置" v-model="dialogState.visible">
    <el-form
      v-if="currentSession && currentSessionScene"
      :model="currentSession"
      ref="formRef"
      label-position="top"
    >
      <el-form-item prop="model_key" label="聊天模型" :rules="MODEL_KEY_RULE">
        <el-select
          v-model="currentSession.model_key"
          style="width: 100%"
          clearable
          :placeholder="`使用场景默认模型 (${
            Models[currentSessionScene.model_key]?.title
          })`"
        >
          <el-option
            v-for="(model, key) of ChatCompletionModels"
            :label="`${model.title} (${endpointsModelKeyMap![key as ModelsKeys]?.length || 0})`"
            :value="key"
            :disabled="!endpointsModelKeyMap![key as ModelsKeys]?.length"
          ></el-option>
        </el-select>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { ChatCompletionModels, Models, ModelsKeys } from "@ai-zen/chats-core";
import { FormItemRule, ElForm } from "element-plus";
import { onMounted, reactive, ref } from "vue";
import { ChatPL } from "../../types/ChatPL";

const formRef = ref<InstanceType<typeof ElForm> | null>(null);

const props = defineProps<{
  endpointsModelKeyMap?: Record<ModelsKeys, ChatPL.EndpointPO[]>;
  currentSession?: ChatPL.SessionPO;
  currentSessionScene?: ChatPL.ScenePO;
  currentModelKey?: string;
}>();

const MODEL_KEY_RULE: FormItemRule = {
  validator(_rule, _value, callback) {
    if (
      !(props.endpointsModelKeyMap as any)[props.currentModelKey as any]?.length
    ) {
      callback(new Error("请选择可用的聊天模型"));
    } else {
      callback();
    }
  },
};

const dialogState = reactive({
  visible: true, // 提前渲染会话表单，这样才能正确地直接通过 validate 方法触发验证。
});

onMounted(() => {
  dialogState.visible = false;
});

function open() {
  dialogState.visible = true;
}

function validate() {
  return formRef.value?.validate();
}

defineExpose({ open, validate });
</script>

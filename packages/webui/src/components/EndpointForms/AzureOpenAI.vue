<template>
  <el-form-item
    prop="endpoint_config.azure_endpoint"
    label="azure_endpoint"
    :rules="{ required: true, message: '请输入 azure_endpoint' }"
  >
    <el-input
      v-model="props.endpoint_config.azure_endpoint"
      placeholder="请输入 azure_endpoint"
    />
  </el-form-item>

  <el-form-item
    prop="endpoint_config.api_key"
    label="api_key"
    :rules="{ required: true, message: '请输入 api_key' }"
  >
    <el-input
      v-model="props.endpoint_config.api_key"
      placeholder="请输入 api_key"
    />
  </el-form-item>

  <el-form-item
    prop="endpoint_config.api_version"
    label="api_version"
    :rules="{ required: true, message: '请输入 api_version' }"
  >
    <el-input
      v-model="props.endpoint_config.api_version"
      placeholder="请输入 api_version"
    />
  </el-form-item>

  <el-form-item
    prop="endpoint_config.deployments"
    label="deployments"
    :rules="{
      required: true,
      validator(_rule, value, callback) {
        if (!Object.keys(value ?? {}).length) {
          callback(new Error('请添加 deployments'));
        } else {
          callback();
        }
      },
    }"
  >
    <DeploymentsEditor
      v-model="props.endpoint_config.deployments"
      :options="options"
    />
  </el-form-item>

  <el-form-item prop="endpoint_config.headers" label="headers">
    <JsonEditor v-model="props.endpoint_config.headers" />
  </el-form-item>

  <el-form-item prop="endpoint_config.body" label="body">
    <JsonEditor v-model="props.endpoint_config.body" />
  </el-form-item>
</template>

<script setup lang="ts">
import JsonEditor from "../JsonEditor/index.vue";
import DeploymentsEditor from "../DeploymentsEditor/index.vue";
import { AzureOpenAI, Models } from "@ai-zen/chats-core";

const props = defineProps({
  endpoint_config: {
    required: true,
    type: Object,
  },
});

const options = AzureOpenAI.COMPATIBLE_MODELS_KEYS.map((x) => ({
  label: Models[x].title,
  value: x,
}));
</script>

<template>
  <ElFormItem
    prop="endpoint_config.url"
    label="url"
    :rules="{ required: true, message: '请输入url' }"
  >
    <ElInput v-model="props.endpoint_config.url" placeholder="请输入url" />
  </ElFormItem>

  <ElFormItem prop="endpoint_config.headers" label="headers">
    <JsonEditor v-model="props.endpoint_config.headers" />
  </ElFormItem>

  <ElFormItem prop="endpoint_config.body" label="body">
    <JsonEditor v-model="props.endpoint_config.body" />
  </ElFormItem>
</template>

<script setup lang="ts">
import JsonEditor from "../../JsonEditor/index.vue";

const props = defineProps({
  endpoint_config: {
    required: true,
    type: Object,
  },
});
</script>

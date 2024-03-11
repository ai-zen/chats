<template>
  <div class="editor">
    <div class="editor-prop" v-for="(item, index) of metaData" :key="index">
      <el-row class="editor-prop-key">
        <el-input
          class="key"
          type="text"
          v-model.trim="item.key"
          placeholder="参数名称"
        />

        <el-select class="value" v-model="item.define.type">
          <el-option label="字符串" value="string"></el-option>
          <el-option label="布尔值" value="boolean"></el-option>
          <el-option label="数字" value="number"></el-option>
          <el-option label="数组" value="array"></el-option>
          <el-option label="对象" value="object"></el-option>
        </el-select>

        <el-checkbox class="required" v-model="item.required"
          >是否必填</el-checkbox
        >

        <el-button type="danger" plain @click="removeProperty(index)"
          >删除参数</el-button
        >
      </el-row>

      <div class="editor-prop-value">
        <el-input
          class="key"
          type="textarea"
          v-model="item.define.description"
          placeholder="参数描述"
        />
      </div>
    </div>

    <el-row class="editor-actions">
      <el-button type="success" plain @click="addProperty">添加参数</el-button>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import type { JSONSchema7 } from "json-schema";
import { PropType, nextTick, ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Object as PropType<JSONSchema7>,
  },
});

const emit = defineEmits<{
  "update:modelValue": [modelValue: JSONSchema7];
}>();

const metaData = ref([] as { key: string; define: any; required: boolean }[]);

/**
 * 这个变量的作用是标记是否正在同步外部数据，当它为true时将不再触发 "update:modelValue" 以防无限循环。
 */
let isSyncing = false;

// 同步外部数据到内部状态
watch(
  () => props.modelValue!.properties,
  async (newValue) => {
    isSyncing = true;
    metaData.value = Object.entries(newValue!).map(([key, value]) => ({
      key,
      define: value as any,
      required: props.modelValue?.required?.includes(key) ?? false,
    }));
    await nextTick();
    isSyncing = false;
  },
  { immediate: true }
);

// 同步内部状态到外部数据
watch(
  metaData,
  (newValue) => {
    if (isSyncing) return;
    emit("update:modelValue", {
      ...props.modelValue,
      properties: Object.fromEntries(
        newValue
          .filter(({ key }) => Boolean(key))
          .map(({ key, define: value }) => [key, value])
      ),
      required: newValue
        .filter(({ required }) => required)
        .map(({ key }) => key),
    });
  },
  { deep: true }
);

const addProperty = () => {
  const maxKeyNumber = Math.max(
    0,
    ...metaData.value.map(({ key }) =>
      Number(/^arg([\d]+$)/.exec(key)?.[1] ?? 0)
    )
  );

  metaData.value.push({
    key: `arg${maxKeyNumber + 1}`,
    define: {
      type: "string",
      description: "",
    },
    required: false,
  });
};

const removeProperty = (index: number) => {
  metaData.value.splice(index, 1);
};
</script>

<style lang="scss" scoped>
.editor {
  width: 100%;
}

.editor-prop {
  border-left: 2px solid var(--el-color-primary);
  padding-left: 12px;
}

.editor-prop + .editor-prop {
  margin-top: 12px;
}

.editor-prop-key {
  display: flex;
  align-items: center;
  width: 100%;
  .key,
  .value {
    width: 0px;
    flex-grow: 1;
    margin-right: 12px;
  }

  .required {
    margin-right: 12px;
  }
}

.editor-prop-value {
  margin-top: 12px;
}

.editor-prop + .editor-actions {
  margin-top: 12px;
}
</style>

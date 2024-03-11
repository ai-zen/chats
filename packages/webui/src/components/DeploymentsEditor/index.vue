<template>
  <div class="editor">
    <div
      class="editor-prop"
      v-for="(entry, index) of editableObjectEntries"
      :key="index"
    >
      <el-row class="editor-prop-key">
        <el-select
          class="key"
          type="text"
          v-model="entry[0]"
          placeholder="属性名称"
        >
          <el-option
            v-for="option of options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          ></el-option>
        </el-select>
        <el-button type="danger" plain @click="removeProperty(index)"
          >删除属性</el-button
        >
      </el-row>

      <div class="editor-prop-value">
        <el-input class="value" type="text" v-model="entry[1]" />
      </div>
    </div>

    <el-row class="editor-actions">
      <el-button type="success" plain @click="addProperty">添加属性</el-button>
    </el-row>
  </div>
</template>

<script name="DeploymentsEditor" setup lang="ts">
import { ModelsKeys } from "@ai-zen/chats-core";
import { ElMessage } from "element-plus";
import { PropType, nextTick, ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  options: {
    type: Array as PropType<{ label: string; value: ModelsKeys }[]>,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const editableObjectEntries = ref([] as [ModelsKeys, any][]);

/**
 * 这个变量的作用是标记是否正在同步外部数据，当它为true时将不再触发 "update:modelValue" 以防无限循环。
 */
let isSyncing = false;

// 同步外部数据到内部状态
watch(
  () => props.modelValue,
  async (newValue) => {
    isSyncing = true;
    editableObjectEntries.value = Object.entries(newValue ?? {}) as [
      ModelsKeys,
      any
    ][];
    await nextTick();
    isSyncing = false;
  },
  { immediate: true }
);

// 同步内部状态到外部数据
watch(
  editableObjectEntries,
  (newValue) => {
    if (isSyncing) return;
    emit(
      "update:modelValue",
      Object.fromEntries(newValue.filter(([key]) => Boolean(key)))
    );
  },
  { deep: true }
);

const addProperty = () => {
  const option = props.options.find((option) =>
    editableObjectEntries.value.every((x) => x[0] != option.value)
  );

  if (option) {
    editableObjectEntries.value.push([option.value, ""]);
  } else {
    ElMessage.warning("所有模型已经添加完，没有可用的选项");
  }
};

const removeProperty = (index: number) => {
  editableObjectEntries.value.splice(index, 1);
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
}

.editor-prop-value {
  margin-top: 12px;
}

.editor-prop + .editor-actions {
  margin-top: 12px;
}
</style>

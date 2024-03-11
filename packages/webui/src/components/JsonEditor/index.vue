<template>
  <div class="editor">
    <div
      class="editor-prop"
      v-for="(entry, index) of editableObjectEntries"
      :key="index"
    >
      <el-row class="editor-prop-key">
        <el-input
          class="key"
          type="text"
          v-model.trim="entry[0]"
          placeholder="属性名称"
        />
        <el-select
          class="value"
          :model-value="getType(entry[1])"
          @update:model-value="onTypeChange(index, $event)"
        >
          <el-option label="字符串" value="string"></el-option>
          <el-option label="布尔值" value="boolean"></el-option>
          <el-option label="数字" value="number"></el-option>
          <el-option label="数组" value="array"></el-option>
          <el-option label="对象" value="object"></el-option>
        </el-select>

        <el-button type="danger" plain @click="removeProperty(index)"
          >删除属性</el-button
        >
      </el-row>

      <div class="editor-prop-value">
        <template v-if="getType(entry[1]) === 'string'">
          <el-input class="value" type="text" v-model="entry[1]" />
        </template>
        <template v-else-if="getType(entry[1]) === 'number'">
          <el-input
            class="value"
            type="number"
            v-model.number.lazy="entry[1]"
          />
        </template>
        <template v-else-if="getType(entry[1]) === 'boolean'">
          <el-checkbox class="value" v-model="entry[1]" />
        </template>
        <template v-else-if="getType(entry[1]) === 'array'">
          <ArrayEditor class="value" v-model="entry[1]" />
        </template>
        <template v-else-if="getType(entry[1]) === 'object'">
          <JsonEditor class="value" v-model="entry[1]" />
        </template>
      </div>
    </div>

    <el-row class="editor-actions">
      <el-button type="success" plain @click="addProperty">添加属性</el-button>
    </el-row>
  </div>
</template>

<script name="JsonEditor" setup lang="ts">
import { nextTick, ref, watch } from "vue";
import ArrayEditor from "../ArrayEditor/index.vue";
import JsonEditor from "../JsonEditor/index.vue";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const editableObjectEntries = ref([] as [string, any][]);

/**
 * 这个变量的作用是标记是否正在同步外部数据，当它为true时将不再触发 "update:modelValue" 以防无限循环。
 */
let isSyncing = false;

// 同步外部数据到内部状态
watch(
  () => props.modelValue,
  async (newValue) => {
    isSyncing = true;
    editableObjectEntries.value = Object.entries(newValue);
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

const getType = (value: any): string => {
  return Array.isArray(value) ? "array" : typeof value;
};

const addProperty = () => {
  const maxKeyNumber = Math.max(
    0,
    ...editableObjectEntries.value.map(([key]) =>
      Number(/^key([\d]+$)/.exec(key)?.[1] ?? 0)
    )
  );

  editableObjectEntries.value.push([`key${maxKeyNumber + 1}`, ""]);
};

const removeProperty = (index: number) => {
  editableObjectEntries.value.splice(index, 1);
};

function onTypeChange(index: number, type: string) {
  switch (type) {
    case "string":
      editableObjectEntries.value[index][1] = "";
      break;
    case "number":
      editableObjectEntries.value[index][1] = 0;
      break;
    case "boolean":
      editableObjectEntries.value[index][1] = false;
      break;
    case "array":
      editableObjectEntries.value[index][1] = [];
      break;
    case "object":
      editableObjectEntries.value[index][1] = {};
      break;
  }
}
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

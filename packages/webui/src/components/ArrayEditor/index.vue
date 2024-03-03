<template>
  <div class="editor">
    <div
      class="editor-prop"
      v-for="(_value, index) of props.modelValue"
      :key="index"
    >
      <el-row class="editor-prop-key">
        <div class="key">第 {{ index }} 项</div>

        <el-select
          class="value"
          :model-value="getType(props.modelValue[index])"
          @update:model-value="onTypeChange(index, $event)"
        >
          <el-option label="字符串" value="string"></el-option>
          <el-option label="布尔值" value="boolean"></el-option>
          <el-option label="数字" value="number"></el-option>
          <el-option label="数组" value="array"></el-option>
          <el-option label="对象" value="object"></el-option>
        </el-select>

        <el-button type="danger" plain @click="removeProperty(index)"
          >删除成员</el-button
        >
      </el-row>

      <div class="editor-prop-value">
        <template v-if="getType(props.modelValue[index]) === 'string'">
          <el-input
            class="value"
            type="text"
            v-model="props.modelValue[index]"
          />
        </template>
        <template v-else-if="getType(props.modelValue[index]) === 'number'">
          <el-input
            class="value"
            type="number"
            v-model.number.lazy="props.modelValue[index]"
          />
        </template>
        <template v-else-if="getType(props.modelValue[index]) === 'boolean'">
          <el-checkbox class="value" v-model="props.modelValue[index]" />
        </template>
        <template v-else-if="getType(props.modelValue[index]) === 'array'">
          <ArrayEditor class="value" v-model="props.modelValue[index]" />
        </template>
        <template v-else-if="getType(props.modelValue[index]) === 'object'">
          <JsonEditor class="value" v-model="props.modelValue[index]" />
        </template>
      </div>
    </div>

    <el-row class="editor-actions">
      <el-button type="success" plain @click="addProperty">添加成员</el-button>
    </el-row>
  </div>
</template>

<script name="ArrayEditor" setup lang="ts">
import { PropType } from "vue";
import ArrayEditor from "../ArrayEditor/index.vue";
import JsonEditor from "../JsonEditor/index.vue";

const props = defineProps({
  modelValue: {
    type: Array as PropType<any[]>,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const getType = (value: any): string => {
  return Array.isArray(value) ? "array" : typeof value;
};

const addProperty = () => {
  props.modelValue.push("");
};

const removeProperty = (index: number) => {
  props.modelValue.splice(index, 1);
};

function onTypeChange(index: number, type: string) {
  switch (type) {
    case "string":
      props.modelValue[index] = "";
      break;
    case "number":
      props.modelValue[index] = 0;
      break;
    case "boolean":
      props.modelValue[index] = false;
      break;
    case "array":
      props.modelValue[index] = [];
      break;
    case "object":
      props.modelValue[index] = {};
      break;
  }
}
</script>

<style lang="scss" scoped>
.editor {
  width: 100%;
}

.editor-prop {
  border-left: 2px solid var(--el-color-success);
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

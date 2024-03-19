<template>
  <div class="tags-editor">
    <el-tag
      class="tag"
      v-for="tag in props.modelValue"
      :key="tag"
      closable
      :disable-transitions="false"
      @close="remove(tag)"
    >
      {{ tag }}
    </el-tag>
    <el-input
      class="tag-input"
      v-if="isShowInput"
      ref="inputRef"
      v-model="newTagValue"
      size="small"
      @keyup.enter="confirm"
      @blur="confirm"
    />
    <el-button v-else class="tag-add" size="small" @click="showInput">
      + 新标签
    </el-button>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref } from "vue";
import { ElInput } from "element-plus";

const props = defineProps<{
  modelValue: string[];
}>();

const newTagValue = ref("");
const isShowInput = ref(false);
const inputRef = ref<InstanceType<typeof ElInput>>();

function remove(tag: string) {
  props.modelValue.splice(props.modelValue.indexOf(tag), 1);
}

function showInput() {
  isShowInput.value = true;
  nextTick(() => {
    inputRef.value!.input!.focus();
  });
}

function confirm() {
  if (newTagValue.value) {
    props.modelValue.push(newTagValue.value);
  }
  isShowInput.value = false;
  newTagValue.value = "";
}
</script>

<style lang="scss" scoped>
.tag + .tag {
  margin-left: 0.5em;
}
.tag + .tag-input {
  margin-left: 0.5em;
}
.tag + .tag-add {
  margin-left: 0.5em;
}

.tag-input,
.tag-add {
  width: 6em;
}
</style>

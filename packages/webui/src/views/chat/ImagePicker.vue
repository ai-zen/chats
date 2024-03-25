<template>
  <el-popover
    :visible="Boolean(props.modelValue)"
    placement="top"
    popper-style="padding: 6px; border-radius: 12px;"
  >
    <div class="new-message-image-wrapper">
      <el-image
        class="new-message-image"
        :src="props.modelValue || placeholderImage"
      ></el-image>
      <el-icon class="new-message-image-close" @click="onClose"
        ><CircleClose
      /></el-icon>
    </div>
    <template #reference>
      <slot :open="open"></slot>
    </template>
  </el-popover>

  <Teleport to="body">
    <input
      type="file"
      ref="uploadFileRef"
      accept="text"
      style="display: none"
      @change="onFileInputChange"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { CircleClose } from "@element-plus/icons-vue";
import { ref } from "vue";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const uploadFileRef = ref<null | HTMLInputElement>(null);
let placeholderImage = ""; // 这个变量仅仅是为了防止清除图片时图片组件显示加载失败

function open() {
  uploadFileRef.value?.click();
}

function onFileInputChange(event: any) {
  if (!uploadFileRef.value) return;
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e: any) {
    var base64Image = e.target.result;
    emit("update:modelValue", base64Image);
    placeholderImage = base64Image;
  };
  reader.readAsDataURL(file);
  uploadFileRef.value.value = "";
}

function onClose() {
  emit("update:modelValue", "");
}
</script>

<style lang="scss" scoped>
.new-message-image-wrapper {
  position: relative;
  .new-message-image {
    display: block;
    border-radius: 6px;
  }
  .new-message-image-close {
    position: absolute;
    right: -12px;
    top: -12px;
    width: 24px;
    height: 24px;
    background-color: #fff;
    border-radius: 50%;
    color: var(--el-color-error);
    font-size: 20px;
    cursor: pointer;
  }
}
</style>

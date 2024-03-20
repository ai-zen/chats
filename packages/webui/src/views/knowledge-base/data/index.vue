<template>
  <div class="knowledge-base-edit-page">
    <el-page-header :content="detailState.detail?.title" @back="$router.back()">
    </el-page-header>

    <div class="toolbar">
      <el-button type="success" plain @click="addItem">
        <el-icon><DocumentAdd /></el-icon>&ensp; 新增条目</el-button
      >
      <rc-button type="primary" plain @click="importFile">
        <rc-icon><Files /></rc-icon>&ensp; 导入文件
      </rc-button>
      <!-- <rc-button type="primary" plain>
        <rc-icon><Files /></rc-icon>&ensp; 批量导入
      </rc-button> -->
    </div>

    <div class="list" v-loading="detailState.isLoading">
      <el-empty
        class="empty"
        v-if="!detailState.detail?.data.length && !detailState.isLoading"
      ></el-empty>

      <div class="item" v-for="item of detailState.detail?.data" :key="item.id">
        <div class="title-row">
          <div class="title">{{ item.title }}</div>
          <el-button
            plain
            circle
            size="small"
            type="primary"
            @click="editItem(item)"
          >
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button
            plain
            circle
            size="small"
            type="danger"
            @click="delItem(item.id)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
        <div class="summary">{{ item.text.slice(0, 80) }}</div>
        <div class="counts">
          <div class="size">字数：{{ item.text.length }}</div>
        </div>
      </div>
    </div>

    <AddItemDialog @save="onAddItemDialogSave" ref="addItemDialogRef" />

    <input
      type="file"
      ref="uploadFileRef"
      accept="text"
      style="display: none"
      @change="onFileInputChange"
    />
  </div>
</template>

<script setup lang="ts">
import { Delete, DocumentAdd, Edit, Files } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import * as api from "../../../api";
import { ChatPL } from "../../../types/ChatPL";
import { FormMode } from "../../../types/Common";
import AddItemDialog from "./AddItemDialog.vue";

const addItemDialogRef = ref<null | InstanceType<typeof AddItemDialog>>(null);
const uploadFileRef = ref<null | HTMLInputElement>(null);

const route = useRoute();

const detailState = reactive({
  detail: null as null | ChatPL.KnowledgeBasePO,
  isLoading: false,
  isSaving: false,
});

/**
 * 初始化知识库详情
 */
async function initDetail() {
  try {
    detailState.isLoading = true;
    if (typeof route.query.id == "string") {
      const knowledgeBase = await api.getKnowledgeBase(route.query.id);
      if (!knowledgeBase)
        throw new Error(`未查找到 id == ${route.query.id} 对应的知识库`);
      detailState.detail = knowledgeBase;
    } else {
      throw new Error(`非法访问`);
    }
  } catch (error: any) {
    ElMessage.error(`初始化知识库失败：${error?.message}`);
  } finally {
    detailState.isLoading = false;
  }
}

/**
 * 添加项
 */
function addItem() {
  if (!detailState.detail) return;
  addItemDialogRef.value?.add({ detail: detailState.detail });
}

/**
 * 编辑项
 */
function editItem(item: ChatPL.KnowledgeItemPO) {
  if (!detailState.detail) return;
  addItemDialogRef.value?.edit({ detail: detailState.detail, item });
}

/**
 * 删除项
 */
async function delItem(id: string) {
  ElMessageBox.confirm("确定要删除吗", "提示", {
    beforeClose: async (action, instance, done) => {
      if (!detailState.detail) return done();
      if (action === "confirm") {
        instance.confirmButtonLoading = true;
        instance.confirmButtonText = "删除中...";
        try {
          const index = detailState.detail.data.findIndex((x) => x.id == id);
          if (index == -1) throw new Error("无效的 ID");
          detailState.detail.data.splice(index, 1);
          await api.editKnowledgeBase(
            JSON.parse(JSON.stringify(detailState.detail))
          );
          ElMessage.success("删除成功");
        } catch (error: any) {
          ElMessage.error(`删除失败：${error?.message}`);
        } finally {
          done();
          instance.confirmButtonLoading = false;
        }
      } else {
        done();
      }
    },
  });
}

/**
 * 响应添加或编辑知识库项对话框保存事件
 */
function onAddItemDialogSave(mode: FormMode, item: ChatPL.KnowledgeItemPO) {
  if (!detailState.detail) return;

  // 在保存成功后将新增或编辑的数据回显到列表中
  if (mode == FormMode.Create) {
    detailState.detail.data.push(item);
  } else if (mode == FormMode.Edit) {
    const index = detailState.detail.data.findIndex((x) => x.id == item.id);
    if (index != -1) {
      detailState.detail.data[index] = item;
    }
  }
}

function importFile() {
  uploadFileRef.value?.click();
}

function onFileInputChange(event: any) {
  if (!detailState.detail) return;

  var selectedFile = event.target.files[0];

  if (!selectedFile) return;

  const maxSize = 24576; // 24KB

  if (selectedFile && selectedFile.size > maxSize) {
    ElMessage.error(`文件大小不能超过 ${maxSize / 1024}KB`);
    uploadFileRef.value!.value = "";
    return;
  }

  var reader = new FileReader();
  reader.readAsText(selectedFile);
  reader.onload = function () {
    var fileContent = reader.result;

    // 打开新增条目弹窗
    addItemDialogRef.value?.add({
      detail: detailState.detail!,
      item: {
        title: selectedFile.name,
        text: fileContent as string,
      },
    });
  };
}

onMounted(() => {
  initDetail();
});
</script>

<style lang="scss" scoped>
.knowledge-base-edit-page {
  padding: 20px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  padding: 20px;
}

.empty {
  margin: auto;
}

.list {
  flex-grow: 1;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  padding: 10px;
  .item {
    width: 240px;
    margin: 10px;
    padding: 10px;
    border: var(--el-border);
    border-radius: var(--el-border-radius-base);
    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title {
      font-size: 14px;
      color: var(--el-text-color-regular);
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      width: 0;
      flex-grow: 1;
      margin-right: 12px;
    }
    .summary {
      margin-top: 10px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      word-break: break-all;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }

    .counts {
      margin-top: 10px;
      font-size: 12px;
      color: var(--el-text-color-regular);
      display: flex;
    }
  }
}
</style>

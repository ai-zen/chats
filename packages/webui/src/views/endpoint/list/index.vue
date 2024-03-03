<template>
  <div class="endpoint-list-page">
    <el-page-header content="服务端列表" @back="$router.back()">
      <template #extra>
        <el-button plain type="success" @click="create">
          <el-icon><Plus /></el-icon>&ensp; 新增服务端
        </el-button>
      </template>
    </el-page-header>

    <el-row class="search-row">
      <el-input
        class="search-input"
        size="large"
        placeholder="输入关键字搜索..."
        :prefix-icon="Search"
      ></el-input>
      <el-button class="search-button" type="primary" round size="large"
        >搜索</el-button
      >
    </el-row>

    <div v-if="listState.list?.length" class="card-list">
      <div class="card" v-for="(item, index) of listState.list" :key="index">
        <div class="title-row">
          <div class="icon">{{ item.icon }}</div>
          <div class="title">{{ item.title }}</div>
          <div class="operation">
            <el-button
              plain
              circle
              size="small"
              type="primary"
              @click="edit(item.id)"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button
              plain
              circle
              size="small"
              type="danger"
              @click="del(item.id)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty">
      <el-empty></el-empty>
    </div>

    <!-- <el-row>
      <el-pagination
        :total="listState.total"
        v-model:current-page="listState.currentPage"
      ></el-pagination>
    </el-row> -->
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import { onMounted, reactive } from "vue";
import { ChatPL } from "../../../types/ChatPL";
import { Plus, Edit, Delete, Search } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import * as api from "../../../api";
import { FormMode } from "../../../types/Common";

const router = useRouter();

const listState = reactive({
  list: [] as ChatPL.EndpointPO[],
  isLoading: false,
  isReady: false,
  // currentPage: 1,
  // pageSize: 30,
  // pageSizes: [30],
  // total: 0,
});

async function getList() {
  try {
    listState.isLoading = true;
    listState.list = await api.getEndpointList();
    listState.isReady = true;
  } catch (error: any) {
    ElMessage.error(`获取列表失败：${error?.message}`);
  } finally {
    listState.isLoading = false;
  }
}

function create() {
  router.push({ path: "/endpoint/form", query: { mode: FormMode.Create } });
}

function edit(id: string) {
  router.push({ path: "/endpoint/form", query: { mode: FormMode.Edit, id } });
}

async function del(id: string) {
  ElMessageBox.confirm("确定要删除吗", "提示", {
    beforeClose: async (action, instance, done) => {
      if (action === "confirm") {
        instance.confirmButtonLoading = true;
        instance.confirmButtonText = "删除中...";
        try {
          await api.deleteEndpoint(id);
          ElMessage.success("删除成功");
          getList(); // 刷新列表
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

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
.endpoint-list-page {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.empty {
  flex-grow: 1;
}

.card-list {
  padding: 10px;
  margin: 0px -20px;
  flex-grow: 1;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
}

.card {
  max-width: 360px;
  height: max-content;
  border-radius: 10px;
  box-shadow: var(--el-box-shadow);
  border: var(--el-border);
  padding: 20px;
  margin: 10px;
  cursor: pointer;
  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }
  .title-row {
    display: flex;
    align-items: center;
    font-size: 14px;
    .icon {
      width: 32px;
      height: 32px;
      font-size: 14px;
      background-color: var(--el-fill-color);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .title {
      margin-left: 1em;
      flex-grow: 1;
    }
    .operation {
      flex-shrink: 0;
      margin-left: 1em;
      display: flex;
    }
  }
}

.search-row {
  margin-top: 20px;
  justify-content: center;
  .search-input:deep() {
    width: 500px;
    .el-input__wrapper {
      border-radius: 19px;
    }
  }
  .search-button {
    margin-left: 1em;
  }
}
</style>

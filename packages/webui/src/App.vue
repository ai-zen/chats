<template>
  <AppHeader />
  <RouterView />
</template>

<script lang="ts" setup>
import AppHeader from "./components/AppHeader/index.vue";
</script>

<style lang="scss">
html {
  display: flex;
  flex-direction: column;
  height: 100%;
}

body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  margin: 0;
}

#app {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

* {
  scrollbar-color: var(--el-scrollbar-bg-color) var(--el-fill-color-light);
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar:horizontal {
  height: 6px;
}

::-webkit-scrollbar-track {
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background-color: #0003;
  border-radius: 10px;
  transition: all 0.2s ease-in-out;
}

::-webkit-scrollbar-thumb:hover {
  cursor: pointer;
  background-color: #0000004d;
}

.dark ::-webkit-scrollbar-thumb {
  background-color: #fff3;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background-color: #fff6;
}

.el-textarea__wrapper {
  transition: 0s;
}

.list-page {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;

  .page-header-wrapper {
    position: relative;
    .extra {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
    }
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
    .search-input {
      width: 500px;
      .el-input__wrapper {
        border-radius: 19px;
      }
    }
    .search-button {
      margin-left: 1em;
    }
  }
}
</style>

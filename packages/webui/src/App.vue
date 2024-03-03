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
</style>

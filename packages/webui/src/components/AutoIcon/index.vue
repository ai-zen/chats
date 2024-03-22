<template>
  <div :style="{ '--size': size }">
    <img class="img-icon" v-if="isImage" :src="icon" alt="Icon" />
    <div class="txt-icon" v-else>{{ icon }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: "1em",
  },
});

const isImage = computed(() => {
  return props.icon.startsWith("http");
});
</script>

<style scoped>
.img-icon {
  width: var(--size);
  height: var(--size);
  object-fit: contain;
}

.txt-icon {
  font-size: var(--size);
}
</style>

<template>
  <div class="emoji-input" :class="{ 'is-disabled': disabled }">
    <el-tooltip
      :disabled="disabled"
      class="emoji-tooltip"
      placement="bottom"
      effect="light"
    >
      <input
        :disabled="disabled"
        :value="$props.modelValue"
        @input="$emit('update:modelValue', ($event.target as any).value)"
        maxlength="1"
      />
      <template #content>
        <div class="emoji-input__emojis-scroll">
          <div class="emoji-input__emojis">
            <button
              v-for="emoji in emojis"
              :key="emoji"
              @click="$emit('update:modelValue', emoji)"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
      </template>
    </el-tooltip>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

defineProps({
  modelValue: { type: String, required: true },
  disabled: { type: Boolean, default: false },
});

defineEmits(["update:modelValue"]);

const emojis = ref([
  "⌚",
  "☀️",
  "☁️",
  "☔️",
  "☹️",
  "♀️♂️",
  "⚡️",
  "⚡",
  "⛄",
  "⛅️",
  "⛷️",
  "✈️",
  "✉️",
  "✨",
  "❄️",
  "⭐️",
  "⭐",
  "🌀",
  "🌄",
  "🌅",
  "🌆",
  "🌇",
  "🌈",
  "🌉",
  "🌊",
  "🌍",
  "🌎",
  "🌏",
  "🌙",
  "🌚",
  "🌛",
  "🌝",
  "🌞",
  "🌟",
  "🌤️",
  "🌧️",
  "🌩️",
  "🌫️",
  "🌬️",
  "🌭",
  "🌮",
  "🌲",
  "🌳",
  "🌴",
  "🌵",
  "🌹",
  "🌺",
  "🌻",
  "🍇",
  "🍉",
  "🍊",
  "🍋",
  "🍌",
  "🍍",
  "🍎",
  "🍒",
  "🍓",
  "🍔",
  "🍕",
  "🍜",
  "🍟",
  "🍦",
  "🍩",
  "🍪",
  "🍫",
  "🍬",
  "🍭",
  "🍱",
  "🍴",
  "🍷",
  "🍸",
  "🍹",
  "🍺",
  "🍻",
  "🍼",
  "🍽️",
  "🍾",
  "🍿",
  "🎀",
  "🎁",
  "🎂",
  "🎃",
  "🎄",
  "🎅",
  "🎇",
  "🎈",
  "🎉",
  "🎊",
  "🎖️",
  "🎠",
  "🎡",
  "🎢",
  "🎧",
  "🎪",
  "🎵",
  "🎶",
  "🏂",
  "🏃‍♀",
  "🏃‍♂",
  "🏄‍♀",
  "🏄‍♂",
  "🏅",
  "🏆",
  "🏊‍♀",
  "🏊‍♂",
  "🏋️",
  "🏞️",
  "🐙",
  "🐝",
  "🐞",
  "🐠",
  "🐬",
  "🐱",
  "🐶",
  "🐼",
  "🐾",
  "👻",
  "💌",
  "💡",
  "💣",
  "💥",
  "💧",
  "💫",
  "💻",
  "📌",
  "📚",
  "📚",
  "📝",
  "📬",
  "📱",
  "📷",
  "🔒",
  "🔥",
  "🕷️",
  "🗝️",
  "🤐",
  "🤑",
  "🤓",
  "🤔",
  "🤖",
  "🤗",
  "🤣",
  "🤥",
  "🤨",
  "🤩",
  "🤫",
  "🤭",
  "🤶",
  "🤸‍♀",
  "🤸‍♂",
  "🤽‍♀",
  "🤽‍♂",
  "🤾‍♀",
  "🤾‍♂",
  "🥇",
  "🥛",
  "🥤",
  "🥰",
  "🥳",
  "🥺",
  "🦄",
  "🧘‍♀",
  "🧘‍♂",
  "😂",
  "😃",
  "😄",
  "😅",
  "😆",
  "😇",
  "😉",
  "😊",
  "😍",
  "😎",
  "😏",
  "😒",
  "😕",
  "😗",
  "😘",
  "😙",
  "😚",
  "😜",
  "😝",
  "😟",
  "😦",
  "😧",
  "😬",
  "😭",
  "😮",
  "😯",
  "😲",
  "😳",
  "😶",
  "🙁",
  "🙂",
  "🙃",
  "🚀",
  "🚁",
  "🚌",
  "🚑",
  "🚒",
  "🚔",
  "🚕",
  "🚗",
  "🚙",
  "🚛",
  "🚣‍♀",
  "🚣‍♂",
  "🚴‍♀",
  "🚴‍♂",
  "🚶‍♀",
  "🚶‍♂",
  "🛳️",
]);
</script>

<style lang="scss" scoped>
.emoji-input {
  width: 32px;
  height: 32px;
  font-size: 14px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--el-border);
  &.is-disabled {
    input {
      cursor: unset;
    }
  }

  input {
    width: 100%;
    height: 100%;
    border: none;
    padding: none;
    background-color: unset;
    outline: none;
    text-align: center;
    cursor: pointer;
  }
}
</style>

<style lang="scss">
.emoji-input__emojis-scroll {
  height: 360px;
  overflow-y: scroll;
}
.emoji-input__emojis {
  display: flex;
  flex-wrap: wrap;
  width: 38px * 6;
  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin: 3px;
    border: var(--el-border);
    border-color: var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
  }
}
</style>

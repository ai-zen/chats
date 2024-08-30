import { ModelsKeys } from "@ai-zen/chats-core";
import { defineComponent } from "vue";
import ChatGPT_ModelConfigForm from "./ChatGPT.vue";
import ChatGLM_ModelConfigForm from "./ChatGLM.vue";

type ModelsFormsMap = Record<ModelsKeys, ReturnType<typeof defineComponent>>;

export const MODELS_FORMS_MAP: ModelsFormsMap = {
  GPT35Turbo16K_0631: ChatGPT_ModelConfigForm,
  GPT35Turbo_0125: ChatGPT_ModelConfigForm,
  GPT35Turbo_0631: ChatGPT_ModelConfigForm,
  GPT35Turbo_1106: ChatGPT_ModelConfigForm,
  GPT4_0125Preview: ChatGPT_ModelConfigForm,
  GPT4_1106Preview: ChatGPT_ModelConfigForm,
  GPT4_VisionPreview: ChatGPT_ModelConfigForm,
  GPT4O_20240513: ChatGPT_ModelConfigForm,
  GPT4O_20240806: ChatGPT_ModelConfigForm,
  TextEmbeddingAda002_2: undefined,
  GLM3Turbo: ChatGLM_ModelConfigForm,
  GLM4: ChatGLM_ModelConfigForm,
  GLM4V: ChatGLM_ModelConfigForm,
};

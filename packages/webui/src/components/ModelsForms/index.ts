import { ModelsKeys } from "@ai-zen/chats-core";
import { defineComponent } from "vue";
import ChatGPT_EndpointConfigForm from "./ChatGPT/EndpointConfigForm.vue";
import ChatGPT_ModelConfigForm from "./ChatGPT/ModelConfigForm.vue";
import TextEmbeddingAda002_2_EndpointConfigForm from "./TextEmbeddingAda002_2/EndpointConfigForm.vue";
import ChatGLM_EndpointConfigForm from "./ChatGLM/EndpointConfigForm.vue";
import ChatGLM_ModelConfigForm from "./ChatGLM/ModelConfigForm.vue";

type ModelsFormsMap = Record<
  ModelsKeys,
  {
    MODEL_CONFIG_FORM?: ReturnType<typeof defineComponent>;
    ENDPOINT_CONFIG_FORM?: ReturnType<typeof defineComponent>;
  }
>;

export const MODELS_FORMS_MAP: ModelsFormsMap = {
  GPT35Turbo16K_0631: {
    MODEL_CONFIG_FORM: ChatGPT_ModelConfigForm,
    ENDPOINT_CONFIG_FORM: ChatGPT_EndpointConfigForm,
  },
  GPT35Turbo_0631: {
    MODEL_CONFIG_FORM: ChatGPT_ModelConfigForm,
    ENDPOINT_CONFIG_FORM: ChatGPT_EndpointConfigForm,
  },
  GPT35Turbo_1106: {
    MODEL_CONFIG_FORM: ChatGPT_ModelConfigForm,
    ENDPOINT_CONFIG_FORM: ChatGPT_EndpointConfigForm,
  },
  GPT4_1106Preview: {
    MODEL_CONFIG_FORM: ChatGPT_ModelConfigForm,
    ENDPOINT_CONFIG_FORM: ChatGPT_EndpointConfigForm,
  },
  GPT4_VisionPreview: {
    MODEL_CONFIG_FORM: ChatGPT_ModelConfigForm,
    ENDPOINT_CONFIG_FORM: ChatGPT_EndpointConfigForm,
  },
  TextEmbeddingAda002_2: {
    ENDPOINT_CONFIG_FORM: TextEmbeddingAda002_2_EndpointConfigForm,
  },
  GLM3Turbo: {
    MODEL_CONFIG_FORM: ChatGLM_ModelConfigForm,
    ENDPOINT_CONFIG_FORM: ChatGLM_EndpointConfigForm,
  },
  GLM4: {
    MODEL_CONFIG_FORM: ChatGLM_ModelConfigForm,
    ENDPOINT_CONFIG_FORM: ChatGLM_EndpointConfigForm,
  },
  GLM4V: {
    MODEL_CONFIG_FORM: ChatGLM_ModelConfigForm,
    ENDPOINT_CONFIG_FORM: ChatGLM_EndpointConfigForm,
  },
};

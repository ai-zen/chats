import { ChatGLM } from "./ChatGLM.js";

export class GLM3Turbo extends ChatGLM {
  static title = "glm-3-turbo";
  static code = "glm-3-turbo";
  static INPUT_MAX_TOKENS = 128000;
  static OUTPUT_MAX_TOKENS_LOWER_LIMIT = 1024;
  static OUTPUT_MAX_TOKENS = 8192;
  static IS_SUPPORT_TOOLS_CALL = true;
}

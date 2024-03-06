import { ChatGLM } from "./ChatGLM.js";

export class GLM4V extends ChatGLM {
  static title = "glm-4v";
  static code = "glm-4v";
  static INPUT_MAX_TOKENS = 128000;
  static OUTPUT_MAX_TOKENS_LOWER_LIMIT = 1024;
  static OUTPUT_MAX_TOKENS = 8192;
  static IS_SUPPORT_TOOLS_CALL = true;
  static IS_SUPPORT_IMAGE_CONTENT = true;
}

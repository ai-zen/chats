import { ChatGLM } from "./ChatGLM.js";

// TODO: GLM 有个奇葩的 do_sample 参数，记得要适配

export class GLM4 extends ChatGLM {
  static title = "glm-4";
  static code = "glm-4";
  static INPUT_MAX_TOKENS = 128000;
  static OUTPUT_MAX_TOKENS_LOWER_LIMIT = 1024;
  static OUTPUT_MAX_TOKENS = 8192;
  static IS_SUPPORT_TOOLS_CALL = true;
}

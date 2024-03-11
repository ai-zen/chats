import { ChatGPT } from "./ChatGPT.js";

export class GPT4_0125Preview extends ChatGPT {
  static title = "gpt-4-0125-preview";
  static code = "gpt-4-0125-preview";
  static INPUT_MAX_TOKENS = 128000;
  static OUTPUT_MAX_TOKENS_LOWER_LIMIT = 800;
  static OUTPUT_MAX_TOKENS = 4096;
  static IS_SUPPORT_TOOLS_CALL = true;
}

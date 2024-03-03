import { ChatGPT } from "./ChatGPT.js";

export class GPT35Turbo_1106 extends ChatGPT {
  static title = "gpt-35-turbo-1106";
  static INPUT_MAX_TOKENS = 16384;
  static OUTPUT_MAX_TOKENS_LOWER_LIMIT = 800;
  static OUTPUT_MAX_TOKENS = 4096;
  static IS_SUPPORT_TOOLS_CALL = true;
}

import { ChatGPT } from "./ChatGPT.js";

export class GPT4O_20240806 extends ChatGPT {
  static title = "gpt-4o-2024-08-06";
  static code = "gpt-4o-2024-08-06";
  static INPUT_MAX_TOKENS = 128000;
  static OUTPUT_MAX_TOKENS_LOWER_LIMIT = 800;
  static OUTPUT_MAX_TOKENS = 16384;
  static IS_SUPPORT_IMAGE_CONTENT = true;
  static IS_SUPPORT_TOOLS_CALL = true;
}

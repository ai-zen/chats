import { ChatGPT } from "./ChatGPT.js";

export class GPT35Turbo_0631 extends ChatGPT {
  static title = "gpt-35-turbo-0631";
  static code = "gpt-35-turbo-0631";
  static INPUT_MAX_TOKENS = 4096;
  static OUTPUT_MAX_TOKENS_LOWER_LIMIT = 800;
  static OUTPUT_MAX_TOKENS = 4096;
  static IS_SUPPORT_FUNCTION_CALL = true;
}

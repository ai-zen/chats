import { ChatGPT } from "./ChatGPT.js";

export class GPT4_VisionPreview extends ChatGPT {
  static title = "gpt-4-vision-preview";
  static code = "gpt-4-vision-preview";
  static INPUT_MAX_TOKENS = 128000;
  static OUTPUT_MAX_TOKENS_LOWER_LIMIT = 800;
  static OUTPUT_MAX_TOKENS = 4096;
  static IS_SUPPORT_IMAGE_CONTENT = true;
}

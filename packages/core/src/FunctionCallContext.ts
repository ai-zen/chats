import { Chat } from "./Chat";
import { ChatAL } from "./ChatAL";

/**
 * Executable function define
 */
export interface ExecutableFunctionDefine {
  exec(ctx: FunctionCallContext): Promise<string>;
}

/**
 * Function calling context
 */
export class FunctionCallContext {
  chat_instance: Chat;
  function_call: ChatAL.FunctionCall;
  parsed_args: any;
  is_prevent_default = false;

  constructor(options: {
    chat_instance: Chat;
    function_call: ChatAL.FunctionCall;
  }) {
    this.chat_instance = options.chat_instance;
    this.function_call = options.function_call;
    this.parsed_args = options.function_call.arguments
      ? JSON.parse(options.function_call.arguments)
      : undefined;
  }

  /**
   * Usually used to mark blocking the next round of chat.
   */
  preventDefault() {
    this.is_prevent_default = true;
  }
}

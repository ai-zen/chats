import { Chat } from "./Chat";
import { ChatAL } from "./ChatAL";

/**
 * Function calling context
 */
export class FunctionCallContext {
  chat_instance: Chat;
  function_call: ChatAL.FunctionCall;
  parsed_args: any;
  result_message: ChatAL.Message;
  is_prevent_default = false;

  constructor(options: {
    chat_instance: Chat;
    function_call: ChatAL.FunctionCall;
    result_message: ChatAL.Message;
  }) {
    this.chat_instance = options.chat_instance;
    this.function_call = options.function_call;
    this.parsed_args = options.function_call.arguments
      ? JSON.parse(options.function_call.arguments)
      : undefined;
    this.result_message = options.result_message;
  }

  /**
   * Usually used to mark blocking the next round of chat.
   */
  preventDefault() {
    this.is_prevent_default = true;
  }
}

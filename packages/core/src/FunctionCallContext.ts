import { Chat } from "./Chat";
import { ChatAL } from "./ChatAL";

/**
 * 函数调用上下文，包含函数调用入参、聊天实例、等关键信息
 */
export class FunctionCallContext {
  chatInstance: Chat;
  functionCall: ChatAL.FunctionCall;
  parsedArgs: any;
  isPreventDefault = false;

  constructor(options: {
    chatInstance: Chat;
    functionCall: ChatAL.FunctionCall;
    parsedArgs: any;
  }) {
    this.chatInstance = options.chatInstance;
    this.functionCall = options.functionCall;
    this.parsedArgs = options.parsedArgs;
  }

  preventDefault() {
    this.isPreventDefault = true;
  }
}

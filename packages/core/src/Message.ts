import { ChatAL } from "./ChatAL.js";
import { PickRequired } from "./Common.js";

export class Message implements ChatAL.Message {
  name?: string | undefined;
  content?: string | ChatAL.MessageContentSection[];
  function_call?: ChatAL.FunctionCall | undefined;
  tool_call_id?: number | undefined;
  tool_calls?: ChatAL.ToolCall[] | undefined;
  role: ChatAL.Role;
  status?: ChatAL.MessageStatus | undefined;
  finish_reason?: ChatAL.FinishReason | undefined;
  hidden?: boolean | undefined;
  omit?: boolean | undefined;

  constructor(options: PickRequired<Message | "role">) {
    if (!options.role) throw new Error("Message must have a role");
    this.name = options.name;
    this.content = options.content;
    this.function_call = options.function_call;
    this.tool_call_id = options.tool_call_id;
    this.tool_calls = options.tool_calls;
    this.role = options.role;
    this.status = options.status;
    this.finish_reason = options.finish_reason;
    this.hidden = options.hidden;
    this.omit = options.omit;
  }

  /**
   * 创建系统消息
   */
  static createSystemMessage(content = ""): ChatAL.Message {
    return {
      role: ChatAL.Role.System,
      content,
      status: ChatAL.MessageStatus.Completed,
    };
  }

  /**
   * 创建助手消息，默认为待定状态
   */
  static createAssistantMessage(content = ""): ChatAL.Message {
    return {
      role: ChatAL.Role.Assistant,
      content,
      status: ChatAL.MessageStatus.Pending,
    };
  }

  /**
   * 创建用户消息
   */
  static createUserMessage(content = ""): ChatAL.Message {
    return {
      role: ChatAL.Role.User,
      content,
      status: ChatAL.MessageStatus.Completed,
    };
  }

  /**
   * 创建工具结果消息
   */
  static createToolCallResultMessage(
    tool_call: ChatAL.ToolCall,
    result: any
  ): ChatAL.Message {
    return {
      role: ChatAL.Role.Tool,
      tool_call_id: tool_call.id,
      name: tool_call.function!.name,
      content: result,
      status: ChatAL.MessageStatus.Completed,
    };
  }

  /**
   * 创建函数结果消息
   */
  static createFunctionCallResultMessage(
    function_call: ChatAL.FunctionCall,
    result: any
  ): ChatAL.Message {
    return {
      role: ChatAL.Role.Function,
      name: function_call!.name,
      content: result,
      status: ChatAL.MessageStatus.Completed,
    };
  }
}

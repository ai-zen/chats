import { ChatAL } from "./ChatAL.js";
import { PickRequired } from "./Common.js";

/**
 * Represents a message in a AI chat conversation.
 */
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

  /**
   * Creates an instance of the Message class.
   */
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
   * Creates a system message.
   */
  static System(content = "") {
    return new Message({
      role: ChatAL.Role.System,
      content,
      status: ChatAL.MessageStatus.Completed,
    });
  }

  /**
   * Creates an assistant message with a default pending status.
   */
  static Assistant(content = "") {
    return new Message({
      role: ChatAL.Role.Assistant,
      content,
      status: ChatAL.MessageStatus.Pending,
    });
  }

  /**
   * Creates a user message.
   */
  static User(content = "") {
    return new Message({
      role: ChatAL.Role.User,
      content,
      status: ChatAL.MessageStatus.Completed,
    });
  }

  /**
   * Creates a tool result message.
   */
  static Tool(tool_call: ChatAL.ToolCall, result = "") {
    return new Message({
      role: ChatAL.Role.Tool,
      tool_call_id: tool_call.id,
      name: tool_call.function!.name,
      content: result,
      status: ChatAL.MessageStatus.Pending,
    });
  }

  /**
   * Creates a function result message.
   */
  static Function(function_call: ChatAL.FunctionCall, result = "") {
    return new Message({
      role: ChatAL.Role.Function,
      name: function_call!.name,
      content: result,
      status: ChatAL.MessageStatus.Pending,
    });
  }
}

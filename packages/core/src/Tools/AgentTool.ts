import { Chat } from "../Chat.js";
import { ChatAL } from "../ChatAL.js";
import { ChatContext } from "../ChatContext.js";
import { PickRequired } from "../Common.js";
import { FunctionCallContext } from "../FunctionCallContext.js";
import { Message } from "../Message.js";
import { Tool } from "../Tool.js";

/**
 * AgentTool is a combination of Agent and Tool, which has tool definitions and generates output using chat.
 */
export class AgentTool extends ChatContext implements Tool {
  type: "function";
  function: ChatAL.FunctionDefine;

  constructor(options: PickRequired<AgentTool, "function" | "model_key">) {
    if (!options.function) throw new Error("AgentTool must have a function");
    if (options.messages?.at(-1)?.role != ChatAL.Role.User) {
      throw new Error("AgentTool must end with a user message.");
    }
    super(options);
    this.type = options.type ?? "function";
    this.function = options.function;
  }

  /**
   * Executes the agent's function with the given function call context.
   * @param ctx - The function call context.
   * @returns {Promise<string>} The result of the function execution.
   */
  async exec(ctx: FunctionCallContext): Promise<string> {
    // Create a chat for the agent
    const agentChat = new Chat({
      // Clone a new agent for execution
      ...new AgentTool({ ...this }),
    });

    // Inject the arguments into the cloned agent's message list
    agentChat.messages = this.injectArgs(agentChat.messages, ctx.parsed_args);

    // Get question message
    const questionMessage = agentChat.messages.at(-1)!;

    // Create an assistant reply message
    agentChat.append(Message.Assistant());

    // If references are found, insert them before the user question
    await agentChat.rag?.rewrite(questionMessage, this.messages);

    // Send the agent chat to the server
    await agentChat.run();

    // Return the last message content of the agent chat as the result
    return agentChat.messages.at(-1)?.content as string;
  }

  /**
   * Replace template string with values from the given record.
   * @param template - The template string.
   * @param valueMap - The record containing key-value pairs for replacement.
   * @returns {string} The replaced string.
   */
  static replaceStringWithValues(
    template: string,
    valueMap: Record<string, any>
  ): string {
    const regex = /{{\s?(\w+)\s?}}/g;

    const replacedString = template.replace(regex, (_, key) => {
      if (valueMap.hasOwnProperty(key)) {
        return valueMap[key];
      } else {
        return `{{ ${key} }}`;
      }
    });

    return replacedString;
  }

  /**
   * Format the messages by replacing the parameters in the messages with their parsed values.
   * @param messages - The list of messages.
   * @param parsed_args - The parsed arguments.
   */
  injectArgs<T extends ChatAL.Message>(messages: T[], parsed_args: any): T[] {
    return JSON.parse(JSON.stringify(messages)).map((message: T) => ({
      ...message,
      content:
        typeof message.content == "string"
          ? AgentTool.replaceStringWithValues(message.content, parsed_args)
          : message.content,
    }));
  }
}

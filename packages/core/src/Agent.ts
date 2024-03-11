import { Chat } from "./Chat.js";
import { ChatAL } from "./ChatAL.js";
import { ChatContext } from "./ChatContext.js";
import { PickRequired } from "./Common.js";
import {
  ExecutableFunctionDefine,
  FunctionCallContext,
} from "./FunctionCallContext.js";
import { Message } from "./Message.js";

/**
 * Agent class represents an agent that can execute a function in a chat context.
 * It inherits the ChatContext class and implements the ChatAL.Agent interface.
 */
export class Agent
  extends ChatContext
  implements ChatAL.Agent, ExecutableFunctionDefine
{
  type: "function";
  function: ChatAL.FunctionDefine;

  /**
   * Constructor for Agent class.
   * @param options - The options object.
   * @throws {Error} If the agent must have a function.
   */
  constructor(options: PickRequired<Agent, "function" | "model_key">) {
    if (!options.function) throw new Error("Agent must have a function");
    super(options);
    this.type = options.type ?? "function";
    this.function = options.function;
  }

  /**
   * Executes the agent's function with the given function call context.
   * @param functionCallContext - The function call context.
   * @returns {Promise<string>} The result of the function execution.
   */
  async exec(functionCallContext: FunctionCallContext): Promise<string> {
    // Create a chat for the agent
    const agentChat = new Chat({
      // Clone a new agent for execution
      ...new Agent({ ...this }),
      // Inherit the endpoints from the parent chat
      endpoints: functionCallContext.chat_instance.endpoints,
    });

    // Inject the arguments into the cloned agent's message list
    agentChat.messages = Agent.intoMessagesWithParsedArgs(
      agentChat.messages,
      functionCallContext.parsed_args
    );

    // Find the user message from the pre-defined message list
    const userMessage = agentChat.messages.findLast(
      (x) => x.role == ChatAL.Role.User
    );

    // Create an assistant reply message
    const assistantMessage = Message.Assistant();
    agentChat.messages.push(assistantMessage);

    // If references are found, insert them before the user question
    const references = await agentChat.queryKnowledge(
      userMessage?.content as string
    );
    if (references) {
      const referencesMessage = Message.User(references);
      referencesMessage.hidden = true;
      agentChat.messages.splice(
        agentChat.messages.length - 2,
        0,
        referencesMessage
      );
    }

    // Send the agent chat to the server
    await agentChat.send();

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
   * @returns {ChatAL.Message[]} The formatted messages.
   */
  static intoMessagesWithParsedArgs(
    messages: ChatAL.Message[],
    parsed_args: any
  ): ChatAL.Message[] {
    return JSON.parse(JSON.stringify(messages)).map(
      (message: ChatAL.Message) => ({
        ...message,
        content:
          typeof message.content == "string"
            ? Agent.replaceStringWithValues(message.content, parsed_args)
            : message.content,
      })
    );
  }
}

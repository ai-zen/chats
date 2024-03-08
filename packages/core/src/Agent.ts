import { Chat } from "./Chat.js";
import { ChatAL } from "./ChatAL.js";
import { ChatContext } from "./ChatContext.js";
import { PickRequired } from "./Common.js";
import { Message } from "./Message.js";

export class Agent extends ChatContext implements ChatAL.Agent {
  type: "function";
  function: ChatAL.FunctionDefine;

  constructor(options: PickRequired<Agent, "function" | "model_key">) {
    if (!options.function) throw new Error("Agent must have a function");
    super(options);
    this.type = options.type ?? "function";
    this.function = options.function;
  }

  async exec(parsedArgs: any, parentChat: Chat) {
    // 克隆一个新的代理用于执行
    const agentContext = new Agent({ ...this });

    // 将参数注入到克隆代理的消息列表
    agentContext.messages = Agent.intoMessagesWithParsedArgs(
      agentContext.messages,
      parsedArgs
    );

    // 创建代理聊天
    const agentChat = new Chat({
      context: agentContext,
      // 继承父聊天的服务端映射
      endpoints: parentChat.endpoints,
    });

    // 从预设消息列表中找到用户提问消息
    const userMessage = agentChat.context.messages.findLast(
      (x) => x.role == ChatAL.Role.User
    );

    // 创建一个助手回复消息
    const assistantMessage = Message.Assistant();
    agentContext.messages.push(assistantMessage);

    // 如果查询到参考资料就插入到提问之前
    const references = await agentChat.queryKnowledgeBases(
      userMessage?.content as string
    );
    if (references) {
      const referencesMessage = Message.User(references);
      referencesMessage.hidden = true;
      agentContext.messages.splice(
        agentContext.messages.length - 2,
        0,
        referencesMessage
      );
    }

    // 发送代理聊天到服务器
    await agentChat.send();

    // 将代理聊天的最后一个消息作为返回结果
    return agentContext.messages.at(-1)?.content; // TODO: 需要提前在代理设置里面告诉语言模型按特定格式返回内容。
  }

  /**
   * 根据键值对替换字符串
   */
  static replaceStringWithValues(
    template: string,
    record: Record<string, any>
  ): string {
    const regex = /{{\s?(\w+)\s?}}/g;

    const replacedString = template.replace(regex, (_, key) => {
      if (record.hasOwnProperty(key)) {
        return record[key];
      } else {
        return `{{ ${key} }}`;
      }
    });

    return replacedString;
  }

  /**
   * 根据参数格式化消息，将参数替换到消息中
   */
  static intoMessagesWithParsedArgs(
    messages: ChatAL.Message[],
    parsedArgs: any
  ): ChatAL.Message[] {
    return JSON.parse(JSON.stringify(messages)).map(
      (message: ChatAL.Message) => ({
        ...message,
        content:
          typeof message.content == "string"
            ? Agent.replaceStringWithValues(message.content, parsedArgs)
            : message.content,
      })
    );
  }
}

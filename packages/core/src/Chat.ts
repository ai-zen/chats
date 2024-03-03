import { AsyncQueue } from "@ai-zen/async-queue";
import EventBus from "@ai-zen/event-bus";
import { ChatAL } from "./ChatAL.js";
import { ChatContext } from "./ChatContext.js";
import { Endpoint } from "./Endpoint.js";
import { Message } from "./Message.js";
import { ChatCompletionModel } from "./Models/ChatCompletionModel.js";
import { EmbeddingModel } from "./Models/EmbeddingModel.js";
import {
  ChatCompletionModels,
  EmbeddingModels,
  ModelsKeys,
} from "./Models/index.js";

export class Chat {
  context: ChatContext;
  endpoints: Record<ModelsKeys, Endpoint>;
  events = new EventBus();

  constructor(options: {
    context: ChatContext;
    endpoints: Record<ModelsKeys, Endpoint>;
  }) {
    this.context = options.context;
    this.endpoints = options.endpoints;
  }

  private lastController: AbortController | undefined = undefined;
  private lastPendingMsg: ChatAL.Message | undefined = undefined;

  /**
   * 发送到服务端
   */
  async send() {
    // 获取模型名称
    const model_key = this.context.model_key;
    if (!model_key) throw new Error("Model key not found");

    // 获取模型服务端
    const endpoint = this.endpoints[model_key];

    // 创建模型实例
    const model = new ChatCompletionModels[model_key]({
      model_config: this.context.model_config,
      endpoint_config: endpoint?.endpoint_config,
    }) as ChatCompletionModel;
    if (!model) throw new Error("Model not found");

    // 将最后一条消息指定为待定消息用于回显。
    const pendingMsg = this.context.messages.at(-1) as Message;
    if (!pendingMsg) throw new Error("No pending message found");

    // 定义一个数据队列用于接收流式数据
    const dataQueue = new AsyncQueue<ChatAL.StreamResponseData>();

    // 定义请求控制器用于中止请求
    const controller = new AbortController();

    // 记录最后的请求控制器和待定消息，用于后续中止
    this.lastController = controller;
    this.lastPendingMsg = pendingMsg;

    // 从消息列表过滤出历史记录，并去除无用字段。
    const history = this.context.messages
      .filter(
        (message) =>
          (message.status == undefined ||
            message.status == ChatAL.MessageStatus.Completed) &&
          !message.omit
      )
      .map((message) => ({
        role: message.role,
        content: message.content,
        function_call: message.function_call
          ? message.function_call
          : undefined,
        tool_calls: message.tool_calls?.length ? message.tool_calls : undefined,
        tool_call_id: message.tool_call_id ?? undefined,
        name: message.name ?? undefined,
      }));

    // 从聊天代理和聊天工具合并为模型工具，并去除无用字段。
    const tools = [...this.context.agents, ...this.context.tools].map(
      (tool) => ({
        type: tool.type,
        function: {
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters,
        },
      })
    );

    // 使用模型实例的发送方法将对话发送给服务器
    model
      .createStream({
        // 用于中止请求的信号
        signal: controller.signal,

        // 过滤出发送给服务器的消息，并去除无用字段。
        messages: history,

        // 从代理和工具生成调用定义，并去除无用字段。
        tools: tools,

        // 当请求打开时，标记消息正在输出中。
        onOpen: () => {
          pendingMsg.status = ChatAL.MessageStatus.Writing;
          this.events.emit("open");
        },

        // 当接收到流数据时将数据加入到队列。
        onData: (data) => {
          dataQueue.push(data);
          this.events.emit("data", data);
        },

        // 当接收到流结束事件时，标记消息已完成，并结束数据队列。
        onDone: () => {
          pendingMsg.status = ChatAL.MessageStatus.Completed;
          dataQueue.done();
          this.events.emit("done");
        },
      })

      // 请求发送错误时，将错误内容反映到消息上，告诉外面之。
      .catch((error) => {
        pendingMsg.status = ChatAL.MessageStatus.Error;
        pendingMsg.content = error.message;
        this.events.emit("error", error);
      })

      // 请求结束后无论成功失败结束数据队列。
      .finally(() => {
        dataQueue.done();
        this.events.emit("finally");
      });

    try {
      // 消费接收到的所有流式数据
      for await (const data of dataQueue) {
        this.events.emit("queue:before", data);

        if (data?.error) {
          throw new Error(data.error.message);
        }

        if (data?.choices?.[0]) {
          // 记录结束原因
          let finish_reason = data.choices[0].finish_reason;
          if (finish_reason) {
            pendingMsg.finish_reason = finish_reason;
          }

          // 增量消息
          let delta = data.choices[0].delta;

          // 合并消息内容
          if (delta?.content) {
            if (delta.content instanceof Array) {
              if (delta.content[0]) {
                let delta_section = delta.content[0];
                let index = delta_section.index!;

                if (!(pendingMsg.content instanceof Array)) {
                  pendingMsg.content = [];
                }

                if (!pendingMsg.content[index]) {
                  pendingMsg.content[index] = {
                    index,
                    ...delta_section,
                  };
                }

                if ("image_url" in delta_section) {
                  let current_section = pendingMsg.content[
                    index
                  ] as ChatAL.ImageUrlContentSection;
                  current_section["type"] = "image_url";
                  current_section["image_url"] ??= { url: "" };
                  current_section["image_url"].url += delta_section.image_url;
                }

                if ("text" in delta_section) {
                  let current_section = pendingMsg.content[
                    index
                  ] as ChatAL.TextContentSection;
                  current_section["type"] = "text";
                  current_section["text"] ??= "";
                  current_section["text"] += current_section.text;
                }
              }
            } else {
              if (typeof pendingMsg.content != "string") {
                pendingMsg.content = "";
              }

              pendingMsg.content += delta.content;
            }
          }

          // 合并并行工具调用
          if (delta?.tool_calls) {
            if (delta.tool_calls[0]) {
              let delta_tool_call = delta.tool_calls[0];
              let index = delta_tool_call.index!;

              if (!pendingMsg.tool_calls) {
                pendingMsg.tool_calls = [];
              }

              if (!pendingMsg.tool_calls[index]) {
                pendingMsg.tool_calls[index] = {
                  index,
                  function: {
                    name: "",
                    arguments: "",
                    ...delta_tool_call.function,
                  },
                  ...delta_tool_call,
                };
              }

              if (delta_tool_call.id) {
                pendingMsg.tool_calls[index]["id"] = delta_tool_call.id;
              }

              if (delta_tool_call.function?.name) {
                pendingMsg.tool_calls[index]["function"]!["name"] =
                  delta_tool_call.function.name;
              }

              if (delta_tool_call.function?.arguments) {
                pendingMsg.tool_calls[index]["function"]!["arguments"] +=
                  delta_tool_call.function.arguments;
              }
            }
          }

          // 合并函数调用
          if (delta?.function_call) {
            if (!pendingMsg.function_call) {
              pendingMsg.function_call = {
                name: "",
                arguments: "",
                ...delta.function_call,
              };
            }

            if (delta.function_call.name) {
              pendingMsg.function_call.name = delta.function_call.name;
            }

            if (delta.function_call.arguments) {
              pendingMsg.function_call.arguments +=
                delta.function_call.arguments;
            }
          }
        }

        this.events.emit("queue:after", data);
      }

      // 定义调用结果消息列表，用于接受调用结果供下一轮对话使用
      const callResultsMessages: ChatAL.Message[] = [];

      // 等消息完流式数据后，如果判断有并行工具调用，则进行之
      if (pendingMsg.tool_calls?.length) {
        // 等待所有工具调用完成
        await Promise.all(
          pendingMsg.tool_calls?.map(async (tool_call) => {
            if (tool_call.function) {
              // 获取工具函数调用结果
              const result = await this.getFunctionCallResult(
                tool_call.function
              );

              // 创建工具调用结果消息加到调用结果消息列表
              callResultsMessages.push(
                Message.createToolCallResultMessage(tool_call, result)
              );
            }
          })
        );
      }

      // 等消息完流式数据后，如果判断有函数调用，则进行之
      if (pendingMsg.function_call) {
        // 获取工具函数调用结果
        const result = await this.getFunctionCallResult(
          pendingMsg.function_call
        );

        // 创建工具调用结果消息加到调用结果消息列表
        callResultsMessages.push(
          Message.createFunctionCallResultMessage(
            pendingMsg.function_call,
            result
          )
        );
      }

      // 如果至少有一条调用结果消息
      if (callResultsMessages.length) {
        // 将调用结果消息列表内容加到主消息列表用于下一轮对话
        this.context.messages.push(...callResultsMessages);

        // 创建助手消息加到消息列表用于接收响应结果
        const assistantMessage = Message.createAssistantMessage();
        this.context.messages.push(assistantMessage);

        // 进行下一轮对话
        await this.send();
      }
    } catch (error: any) {
      // 处理消息和函数调用过程中发送错误时，将错误内容反映到消息上
      pendingMsg.status = ChatAL.MessageStatus.Error;
      pendingMsg.content = error.message;
      this.events.emit("error", error);
    }

    return this.context.messages;
  }

  /**
   * 获取函数调用结果
   */
  async getFunctionCallResult(fc: ChatAL.FunctionCall) {
    if (!fc.name) return;

    // 解析函数调用的参数
    const parsedArgs = fc.arguments ? JSON.parse(fc.arguments) : undefined;

    // 查找与函数调用相匹配的代理
    const agent = this.context.agents.find(
      (x) => x.function.name == fc.name && x.type == "function"
    );

    // 查找与函数调用相匹配的工具
    const tool = this.context.tools.find(
      (x) => x.function.name == fc.name && x.type == "function"
    );

    // 如果找到代理
    if (agent) return agent.exec(parsedArgs, this);

    // 如果找到工具
    if (tool) return tool.exec(parsedArgs);
  }

  /**
   * 是否存在悬而未决的消息
   */
  get isHasPendingMessage() {
    return (
      this.context.messages.some(
        (msg) =>
          msg.status === ChatAL.MessageStatus.Pending ||
          msg.status == ChatAL.MessageStatus.Writing
      ) ?? false
    );
  }

  /**
   * 中止最后一次发送
   */
  abortLastSend() {
    this.lastController?.abort();
    if (this.lastPendingMsg) {
      this.lastPendingMsg.status = ChatAL.MessageStatus.Aborted;
    }
  }

  /**
   * 发送用户消息
   */
  async sendUserMessage(question: string) {
    // 以问题为内容创建用户消息加到消息列表用于提问
    const userMessage = Message.createUserMessage(question);
    this.context.messages.push(userMessage);

    // 创建助手消息加到消息列表用于接收响应结果
    const assistantMessage = Message.createAssistantMessage();
    this.context.messages.push(assistantMessage);

    // 如果查询到参考资料就插入到用户提的问题的前面
    const references = await this.queryKnowledgeBases(question);
    if (references) {
      const referencesMessage = Message.createUserMessage(references);
      referencesMessage.hidden = true;
      this.context.messages.splice(
        this.context.messages.length - 2,
        0,
        referencesMessage
      );
    }

    // 发送聊天到服务器
    return this.send();
  }

  /**
   * 查询知识库内容
   * 注意：该函数可能废弃，不如通过 Tool 外挂知识库
   */
  async queryKnowledgeBases(question: string) {
    const results = await Promise.all(
      this.context.knowledge_bases.map(async (kb) => {
        // 获取模型服务端
        const endpoint = this.endpoints[kb.model_key];

        // 创建模型实例
        const embeddingModel = new EmbeddingModels[kb.model_key]({
          endpoint_config: endpoint?.endpoint_config,
          model_config: kb.model_config,
        }) as EmbeddingModel;

        if (!embeddingModel) return;

        // 创建嵌入
        const vector = await embeddingModel.createEmbedding(question as string);

        // 从知识库查询相关信息
        const records = kb.search(vector, 5, 0.8);
        const texts = records.map((record) => record.text);

        return texts;
      })
    );

    const texts = results.flat().filter((text) => text) as string[];
    if (!texts.length) return;
    return `参考资料：\n\n${texts
      .map((text, index) => `${index + 1}. ${text}`)
      .join("\n")}`;
  }
}

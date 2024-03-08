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
import { FunctionCallContext } from "./FunctionCallContext.js";

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
    if (!endpoint) throw new Error("Endpoint not found");

    // 创建模型实例
    const model = new ChatCompletionModels[model_key]({
      model_config: this.context.model_config,
      endpoint_config: endpoint.endpoint_config,
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
        (x) =>
          (x.status == undefined ||
            x.status == ChatAL.MessageStatus.Completed) &&
          !x.omit
      )
      .map((x) => ({
        role: x.role,
        content: x.content,
        function_call: x.function_call ? x.function_call : undefined,
        tool_calls: x.tool_calls?.length ? x.tool_calls : undefined,
        tool_call_id: x.tool_call_id ?? undefined,
        name: x.name ?? undefined,
      }));

    // 从聊天代理和聊天工具合并为模型工具，并去除无用字段。
    const tools = [...this.context.agents, ...this.context.tools].map((x) => ({
      type: x.type,
      function: {
        name: x.function.name,
        description: x.function.description,
        parameters: x.function.parameters,
      },
    }));

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
                // 判断新参数是否包含了旧参数的一部分
                if (
                  delta_tool_call.function.arguments.startsWith(
                    pendingMsg.tool_calls[index]["function"]!["arguments"]!
                  )
                ) {
                  // 适配智谱GLM，每次给的参数是全量的。
                  pendingMsg.tool_calls[index]["function"]!["arguments"] =
                    delta_tool_call.function.arguments;
                } else {
                  // 适配GPT，每次给的参数是增量的。
                  pendingMsg.tool_calls[index]["function"]!["arguments"] +=
                    delta_tool_call.function.arguments;
                }
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

      // 记录这一轮工具调用消息，用于检测是否正确完成了所有工具调用。
      const callTasks: {
        function_call: ChatAL.FunctionCall;
        result: ChatAL.Message;
      }[] = [];

      // 等消费完流式数据后，如果判断有并行工具函数调用，则记之
      if (pendingMsg.tool_calls?.length) {
        callTasks.push(
          ...pendingMsg.tool_calls
            .filter((x) => x.type == "function" && x.function)
            .map((tool_call) => ({
              function_call: tool_call.function!,
              result: this.push(Message.Tool(tool_call)),
            }))
        );
      }

      // 等消息完流式数据后，如果判断有函数调用，则记之
      if (pendingMsg.function_call) {
        callTasks.push({
          function_call: pendingMsg.function_call,
          result: this.push(Message.Function(pendingMsg.function_call)),
        });
      }

      // 并行执行所有函数调用
      await Promise.all(
        callTasks.map(async ({ function_call, result }) => {
          try {
            // 获取工具函数调用结果
            const content = await this.getFunctionCallResult(function_call);
            // 回显调用结果
            result.content = content;
            result.status = ChatAL.MessageStatus.Completed;
          } catch (error: any) {
            // 如果获取调用结果过程中发生了错误，则回显错误
            result.content = error?.message;
            result.status = ChatAL.MessageStatus.Error;
          }
        })
      );

      // 如果这一轮至少有一次工具调用，且所有工具调用都完成了
      // 另外值得注意的是，可以通过将调用结果消息设为非 Completed 状态防止自动进行下一轮对话。
      // 尤其是在需要长时间等待用户填写某些表单时，可以利用这一机制，等用户填写完毕后再手动修改结果消息状态并进行下一轮对话。
      if (
        callTasks.length &&
        callTasks.every(
          (x) => x.result.status === ChatAL.MessageStatus.Completed
        )
      ) {
        // 创建助手消息加到消息列表用于接收响应结果
        this.push(Message.Assistant());

        // 进行下一轮对话
        await this.send();
      }
    } catch (error: any) {
      // 处理消息和函数调用过程中发送错误时，将错误内容反映到消息上
      pendingMsg.status = ChatAL.MessageStatus.Error;
      pendingMsg.content = error.message;
      this.events.emit("error", error);
    }

    // 在对话彻底完成后返回消息列表
    return this.context.messages;
  }

  /**
   * 获取函数调用结果
   */
  async getFunctionCallResult(fc: ChatAL.FunctionCall) {
    if (!fc.name) return;

    // 创建函数调用上下文
    const ctx = new FunctionCallContext({
      chatInstance: this,
      functionCall: fc,
      // 解析函数调用的参数
      parsedArgs: fc.arguments ? JSON.parse(fc.arguments) : undefined,
    });

    // 查找与函数调用相匹配的代理
    const agent = this.context.agents.find(
      (x) => x.function.name == fc.name && x.type == "function"
    );

    // 查找与函数调用相匹配的工具
    const tool = this.context.tools.find(
      (x) => x.function.name == fc.name && x.type == "function"
    );

    // 如果找到代理
    if (agent) return agent.exec(ctx);

    // 如果找到工具
    if (tool) return tool.exec(ctx);
  }

  /**
   * 是否存在悬而未决的消息
   */
  get isHasPendingMessage() {
    return (
      this.context.messages.some(
        (x) =>
          x.status === ChatAL.MessageStatus.Pending ||
          x.status == ChatAL.MessageStatus.Writing
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
    this.push(Message.User(question));

    // 创建助手消息加到消息列表用于接收响应结果
    this.push(Message.Assistant());

    // 如果查询到参考资料就插入到用户提的问题的前面
    const references = await this.queryKnowledgeBases(question);
    if (references) {
      this.context.messages.splice(this.context.messages.length - 2, 0, {
        ...Message.User(references),
        hidden: true,
      });
    }

    // 发送聊天到服务器
    return this.send();
  }

  /**
   * 为消息列表加一条消息
   */
  push(message: ChatAL.Message) {
    this.context.messages.push(message);
    return this.context.messages.at(-1)!;
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
        const texts = records.map((x) => x.text);

        return texts;
      })
    );

    const texts = results.flat().filter((x) => x) as string[];
    if (!texts.length) return;
    return `参考资料：\n\n${texts.map((x, i) => `${i + 1}. ${x}`).join("\n")}`;
  }
}

import { AsyncQueue } from "@ai-zen/async-queue";
import EventBus from "@ai-zen/event-bus";
import { ChatAL } from "./ChatAL.js";
import { ChatContext } from "./ChatContext.js";
import { PickRequired } from "./Common.js";
import { Endpoint } from "./Endpoint.js";
import { FunctionCallContext } from "./FunctionCallContext.js";
import { Message } from "./Message.js";
import { ChatCompletionModel } from "./Models/ChatCompletionModel.js";
import { ChatCompletionModels } from "./Models/index.js";
import { Tool } from "./Tool.js";
import { AgentTool } from "./Tools/AgentTool.js";
import { EmbeddingSearch } from "./Rags/EmbeddingSearch.js";

export class Chat extends ChatContext {
  events = new EventBus();

  constructor(options: PickRequired<ChatContext, "model_key" | "endpoints">) {
    super(options);
    this.inheritEndpoints();
  }

  private lastController: AbortController | undefined = undefined;
  private lastReceiver: ChatAL.Message | undefined = undefined;

  /**
   * Run the conversation to the server.
   */
  async run() {
    const modelKey = this.model_key;
    if (!modelKey) throw new Error("Model key not found");

    const endpoint = Endpoint.match(this.endpoints, modelKey);
    if (!endpoint) throw new Error(`Endpoint not found of ${modelKey}`);

    const model = new ChatCompletionModels[modelKey]({
      model_config: this.model_config,
      request_config: await endpoint.build(modelKey),
    }) as ChatCompletionModel;
    if (!model) throw new Error("Model not found");

    const receiver = this.messages.at(-1) as Message;
    if (!receiver) throw new Error("No pending message found");

    const controller = new AbortController();

    this.lastController = controller;
    this.lastReceiver = receiver;

    const stream = model.createStream({
      signal: controller.signal,
      messages: this.formatHistory(),
      tools: this.formatTools(),
      onOpen: () => {
        receiver.status = ChatAL.MessageStatus.Writing;
        this.events.emit("open");
      },
      onError: (error) => {
        receiver.status = ChatAL.MessageStatus.Error;
        receiver.content = error.message;
        this.events.emit("error", error);
      },
      onFinally: () => {
        this.events.emit("finally");
      },
    });

    try {
      await this.parseStreamData(receiver, stream);

      receiver.status = ChatAL.MessageStatus.Completed;

      if (await this.handelToolCall(receiver)) {
        this.append(Message.Assistant());
        await this.run();
      }
    } catch (error: any) {
      receiver.status = ChatAL.MessageStatus.Error;
      receiver.content = error.message;
      this.events.emit("error", error);
    }

    return this.messages;
  }

  /**
   * Get the available tool definitions.
   */
  formatTools() {
    return this.tools.map((x) => ({
      type: x.type,
      function: {
        name: x.function.name,
        description: x.function.description,
        parameters: x.function.parameters,
      },
    }));
  }

  /**
   * Get the conversation history in a format suitable for the request.
   */
  formatHistory() {
    return this.messages
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
  }

  /**
   * Parse the streamed response data.
   */
  async parseStreamData(
    receiver: ChatAL.Message,
    stream: AsyncQueue<ChatAL.StreamResponseData>
  ) {
    for await (const chunk of stream) {
      this.events.emit("chunk", chunk);

      if (chunk?.error) {
        throw new Error(chunk.error.message);
      }

      if (chunk?.choices?.[0]) {
        let finishReason = chunk.choices[0].finish_reason;
        if (finishReason) {
          receiver.finish_reason = finishReason;
        }

        let delta = chunk.choices[0].delta;

        if (delta?.content) {
          if (delta.content instanceof Array) {
            if (delta.content[0]) {
              let deltaSection = delta.content[0];
              let index = deltaSection.index!;

              if (!(receiver.content instanceof Array)) {
                receiver.content = [];
              }

              if (!receiver.content[index]) {
                receiver.content[index] = {
                  index,
                  ...deltaSection,
                };
              }

              if ("image_url" in deltaSection) {
                let currentSection = receiver.content[
                  index
                ] as ChatAL.ImageUrlContentSection;
                currentSection["type"] = "image_url";
                currentSection["image_url"] ??= { url: "" };
                currentSection["image_url"].url += deltaSection.image_url;
              }

              if ("text" in deltaSection) {
                let currentSection = receiver.content[
                  index
                ] as ChatAL.TextContentSection;
                currentSection["type"] = "text";
                currentSection["text"] ??= "";
                currentSection["text"] += currentSection.text;
              }
            }
          } else {
            if (typeof receiver.content != "string") {
              receiver.content = "";
            }

            receiver.content += delta.content;
          }
        }

        if (delta?.tool_calls) {
          if (delta.tool_calls[0]) {
            let deltaToolCall = delta.tool_calls[0];
            let index = deltaToolCall.index!;

            if (!receiver.tool_calls) {
              receiver.tool_calls = [];
            }

            if (!receiver.tool_calls[index]) {
              receiver.tool_calls[index] = {
                index,
                function: {
                  name: "",
                  arguments: "",
                  ...deltaToolCall.function,
                },
                ...deltaToolCall,
              };
            }

            if (deltaToolCall.id) {
              receiver.tool_calls[index]["id"] = deltaToolCall.id;
            }

            if (deltaToolCall.function?.name) {
              receiver.tool_calls[index]["function"]!["name"] =
                deltaToolCall.function.name;
            }

            if (deltaToolCall.function?.arguments) {
              if (
                deltaToolCall.function.arguments.startsWith(
                  receiver.tool_calls[index]["function"]!["arguments"]!
                )
              ) {
                receiver.tool_calls[index]["function"]!["arguments"] =
                  deltaToolCall.function.arguments;
              } else {
                receiver.tool_calls[index]["function"]!["arguments"] +=
                  deltaToolCall.function.arguments;
              }
            }
          }
        }

        if (delta?.function_call) {
          if (!receiver.function_call) {
            receiver.function_call = {
              name: "",
              arguments: "",
              ...delta.function_call,
            };
          }

          if (delta.function_call.name) {
            receiver.function_call!.name = delta.function_call.name;
          }

          if (delta.function_call.arguments) {
            receiver.function_call!.arguments += delta.function_call.arguments;
          }
        }
      }
    }

    this.events.emit("parsed", receiver);
  }

  /**
   * Handle the tool call.
   * @returns This function returns a result indicating whether a new round of chat is needed.
   */
  async handelToolCall(receiver: ChatAL.Message): Promise<boolean> {
    const tasks: ChatAL.ToolCall[] = [];

    if (receiver.tool_calls?.length) {
      tasks.push(
        ...receiver.tool_calls.filter((x) => x.type == "function" && x.function)
      );
    }

    if (receiver.function_call) {
      tasks.push({ function: receiver.function_call });
    }

    const promises = tasks.map(async (task) => {
      const resultReceiver = this.append(
        task.id ? Message.Tool(task) : Message.Function(task.function!)
      );

      const matchTools: Tool | undefined = this.tools.find(
        (x) => x.function.name == task.function!.name && x.type == "function"
      );

      let ctx = new FunctionCallContext({
        function_call: task.function!,
        chat_instance: this,
        result_message: resultReceiver,
      });

      try {
        resultReceiver.content = await matchTools?.exec(ctx);
        resultReceiver.status = ChatAL.MessageStatus.Completed;
      } catch (error: any) {
        resultReceiver.content = error?.message;
        resultReceiver.status = ChatAL.MessageStatus.Error;
      }

      return {
        is_prevent_default: ctx.is_prevent_default,
        status: resultReceiver.status,
      };
    });

    const results = await Promise.all(promises);

    const isNeedNext = Boolean(
      results.length &&
        results.every(
          (x) =>
            !x.is_prevent_default && x.status === ChatAL.MessageStatus.Completed
        )
    );

    return isNeedNext;
  }

  /**
   * Check if there is a pending message.
   */
  get isHasPendingMessage() {
    return (
      this.messages.some(
        (x) =>
          x.status === ChatAL.MessageStatus.Pending ||
          x.status == ChatAL.MessageStatus.Writing
      ) ?? false
    );
  }

  /**
   * Abort the last send request.
   */
  abort() {
    this.lastController?.abort();
    if (this.lastReceiver) {
      this.lastReceiver.status = ChatAL.MessageStatus.Aborted;
    }
  }

  /**
   * Send a user question.
   */
  async send(question: string) {
    // Create an question message.
    const questionMessage = this.append(Message.User(question));

    // Create an assistant reply message.
    this.append(Message.Assistant());

    // Rewrite the user question.
    await this.rag?.rewrite(questionMessage, this.messages);

    // Run the chat.
    return this.run();
  }

  /**
   * Inherit endpoints of AgentTool, EmbeddingSearch.
   */
  inheritEndpoints() {
    this.tools?.forEach((x) => {
      if (x instanceof AgentTool && !x.endpoints?.length) {
        x.endpoints = this.endpoints;
      }
    });

    if (this.rag instanceof EmbeddingSearch && !this.rag.endpoints?.length) {
      this.rag.endpoints = this.endpoints;
    }
  }
}

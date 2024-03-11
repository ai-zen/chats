import { AsyncQueue } from "@ai-zen/async-queue";
import EventBus from "@ai-zen/event-bus";
import { ChatAL } from "./ChatAL.js";
import { ChatContext } from "./ChatContext.js";
import { Endpoint } from "./Endpoints/Endpoint.js";
import { Message } from "./Message.js";
import { ChatCompletionModel } from "./Models/ChatCompletionModel.js";
import { EmbeddingModel } from "./Models/EmbeddingModel.js";
import { ChatCompletionModels, EmbeddingModels } from "./Models/index.js";
import {
  ExecutableFunctionDefine,
  FunctionCallContext,
} from "./FunctionCallContext.js";

export class Chat extends ChatContext {
  endpoints: Endpoint[];
  events = new EventBus();

  constructor(options: ChatContext & { endpoints: Endpoint[] }) {
    super(options);
    this.endpoints = options.endpoints;
  }

  private lastController: AbortController | undefined = undefined;
  private lastReceiver: ChatAL.Message | undefined = undefined;

  /**
   * Send the conversation to the server.
   */
  async send() {
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
      messages: this.getHistory(),
      tools: this.getTools(),
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
        this.push(Message.Assistant());
        await this.send();
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
  getTools() {
    return [...this.agents, ...this.tools].map((x) => ({
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
  getHistory() {
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
    receiver: Message,
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
  }

  /**
   * Handle the tool call.
   * @returns This function returns a result indicating whether a new round of chat is needed.
   */
  async handelToolCall(receiver: ChatAL.Message): Promise<boolean> {
    const callTasks: ChatAL.ToolCall[] = [];

    if (receiver.tool_calls?.length) {
      callTasks.push(
        ...receiver.tool_calls.filter((x) => x.type == "function" && x.function)
      );
    }

    if (receiver.function_call) {
      callTasks.push({ function: receiver.function_call });
    }

    const callPromises = callTasks.map(async (task) => {
      const resultMsg = this.push(
        task.id ? Message.Tool(task) : Message.Function(task.function!)
      );

      const executable: ExecutableFunctionDefine | undefined = [
        ...this.agents,
        ...this.tools,
      ].find(
        (x) => x.function.name == task.function!.name && x.type == "function"
      );

      let ctx = new FunctionCallContext({
        function_call: task.function!,
        chat_instance: this,
      });

      try {
        resultMsg.content = await executable?.exec(ctx);
        resultMsg.status = ChatAL.MessageStatus.Completed;
      } catch (error: any) {
        resultMsg.content = error?.message;
        resultMsg.status = ChatAL.MessageStatus.Error;
      }

      return {
        is_prevent_default: ctx.is_prevent_default,
        status: resultMsg.status,
      };
    });

    const callResults = await Promise.all(callPromises);

    const isNeedNext = Boolean(
      callResults.length &&
        callResults.every(
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
  abortLastSend() {
    this.lastController?.abort();
    if (this.lastReceiver) {
      this.lastReceiver.status = ChatAL.MessageStatus.Aborted;
    }
  }

  /**
   * Send a user message.
   */
  async sendUserMessage(question: string) {
    this.push(Message.User(question));
    this.push(Message.Assistant());

    const references = await this.queryKnowledge(question);
    if (references) {
      this.messages.splice(this.messages.length - 2, 0, {
        ...Message.User(references),
        hidden: true,
      });
    }

    return this.send();
  }

  /**
   * Add a message to the message list.
   */
  push(message: ChatAL.Message) {
    this.messages.push(message);
    return this.messages.at(-1)!;
  }

  /**
   * Query the knowledge base for related information.
   */
  async queryKnowledge(question: string) {
    const results = await Promise.all(
      this.knowledge_bases.map(async (kb) => {
        const endpoint = Endpoint.match(this.endpoints, kb.model_key);
        if (!endpoint) return;

        const embeddingModel = new EmbeddingModels[kb.model_key]({
          model_config: kb.model_config,
          request_config: await endpoint.build(kb.model_key),
        }) as EmbeddingModel;
        if (!embeddingModel) return;

        const vector = await embeddingModel.createEmbedding(question as string);
        const records = kb.search(vector, 5, 0.8);
        const texts = records.map((x) => x.text);

        return texts;
      })
    );

    const texts = results.flat().filter((x) => x) as string[];
    if (!texts.length) return;
    return `References: \n\n${texts
      .map((x, i) => `${i + 1}. ${x}`)
      .join("\n")}`;
  }
}

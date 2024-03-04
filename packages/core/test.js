import {
  Chat,
  ChatAL,
  ChatContext,
  Endpoint,
  Tool,
  Agent,
} from "./dist/index.js";

async function main() {
  const URL = ""; // 这里填链接
  const OPENAI_API_KEY = ""; // 这里填 openai 密钥
  const AZURE_API_KEY = ""; // 这里填 azure 密钥
  // openai 和 azure 二选一

  if (!URL) throw new Error("请填写测试用的URL");

  if (!(OPENAI_API_KEY || AZURE_API_KEY)) throw new Error("请填写测试用的密钥");

  const endpoint = new Endpoint({
    model_key: "GPT35Turbo_1106",
    endpoint_config: {
      url: URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: OPENAI_API_KEY ? `Bearer ${OPENAI_API_KEY}` : undefined,
        "api-key": AZURE_API_KEY ? AZURE_API_KEY : undefined,
      },
    },
  });

  const chat = new Chat({
    endpoints: {
      GPT35Turbo_1106: endpoint,
    },
    context: new ChatContext({
      model_key: "GPT35Turbo_1106",
      messages: [
        {
          role: ChatAL.Role.System,
          content: "你是是一个AI助手，专门帮助用户回答问题。",
        },
      ],
      tools: [
        new Tool({
          function: {
            name: "getNowTime",
            description: "获取指定时区当前时间",
            parameters: {
              type: "object",
              properties: {
                timezone: {
                  type: "number",
                  description: "时区，东八区填8，西八区填-8",
                },
              },
              required: ["timezone"],
            },
          },
          callback(timezone) {
            var now = new Date();
            var utcTimestamp = now.getTime();
            var targetTimezoneOffset = timezone * 60 * 60 * 1000;
            var targetTimestamp = utcTimestamp + targetTimezoneOffset;
            var targetDate = new Date(targetTimestamp);
            return {
              timezone,
              time: targetDate.toISOString().replace(/[TZ]/g, " ").trim(),
            };
          },
        }),
      ],
      agents: [
        new Agent({
          model_key: "GPT35Turbo_1106",
          function: {
            name: "getWeather",
            description: "当你需要获取某个城市某天的天气时可以调用此函数",
            parameters: {
              type: "object",
              properties: {
                city: {
                  type: "string",
                  description: "城市",
                },
                date: {
                  type: "string",
                  description: "日期，格式为 yyyy-MM-dd",
                },
              },
              required: ["city", "date"],
            },
          },
          messages: [
            {
              role: ChatAL.Role.System,
              content: "你是一个 mock 数据生成大师，专门帮助用户生成MOCK信息。",
            },
            {
              role: ChatAL.Role.User,
              content:
                "请为这个城市 {{ city }} 时间 {{ date }} 生成 mock 天气预报数据，直接返回 JSON 数据，不需要进行其他说明。",
            },
          ],
        }),
      ],
    }),
  });

  console.log("send...");
  const messages = await chat.sendUserMessage("当前时间纽约天气如何？");
  console.log("messages", messages);
}

await main();

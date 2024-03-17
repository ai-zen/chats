import { ChatAL } from "../ChatAL.js";
import { PickRequired } from "../Common.js";
import { FunctionCallContext } from "../FunctionCallContext.js";
import { Tool } from "../Tool.js";

export class IndexedSearchTool implements Tool {
  type: "function";
  function: ChatAL.FunctionDefine;
  entries: { title: string; text: string }[];

  constructor(options: PickRequired<IndexedSearchTool, "entries">) {
    this.type = options.type ?? "function";
    this.entries = options.entries ?? [];

    const indexed = options.entries.map((x) => x.title).join(", ");

    this.function = {
      name: "indexedSearch",
      description: `You can use this function to query the following relevant information: ${indexed}`,
      parameters: {
        type: "object",
        properties: {
          keywords: {
            type: "string",
            description:
              "Enter the keywords you want to search, separated by commas. For example: A, B, C.",
          },
        },
      },
    };
  }

  async exec(ctx: FunctionCallContext) {
    const result: Record<string, string[]> = {};
    const keywords = ctx.parsed_args.keywords
      .split(",")
      .map((x: string) => x.trim());

    this.entries.forEach((x) => {
      if (keywords.includes(x.title)) {
        result[x.title] ??= [];
        result[x.title].push(x.text);
      }
    });

    return JSON.stringify(result);
  }
}

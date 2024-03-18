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
    this.function = {
      name: "indexedSearch",
      description: `You can use this function to query the following relevant information`,
      parameters: {
        type: "object",
        properties: {
          keywords: {
            description: "Enter the keywords you want to search",
            type: "array",
            items: {
              enum: options.entries.map((x) => x.title),
            },
          },
        },
      },
    };
  }

  async exec(ctx: FunctionCallContext) {
    // GPT may mistakenly input a string instead of an array when there is only one keyword.
    const keywords: string[] =
      ctx.parsed_args.keywords instanceof Array
        ? ctx.parsed_args.keywords
        : [ctx.parsed_args.keywords];

    const result: Record<string, string[]> = {};

    this.entries.forEach((x) => {
      if (keywords.includes(x.title)) {
        result[x.title] ??= [];
        result[x.title].push(x.text);
      }
    });

    return JSON.stringify(result);
  }
}

import { ChatAL } from "./ChatAL.js";
import { PickRequired } from "./Common.js";
import { FunctionCallContext } from "./FunctionCallContext.js";

export abstract class Tool implements ChatAL.ToolDefine {
  type: "function";
  function: ChatAL.FunctionDefine;

  constructor(options: PickRequired<Tool, "function">) {
    if (!options.function) throw new Error("Tool must have a function");
    this.type = options.type ?? "function";
    this.function = options.function;
  }

  abstract exec(ctx: FunctionCallContext): Promise<string>;
}

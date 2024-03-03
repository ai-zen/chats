import { ChatAL } from "./ChatAL.js";
import { PickRequired } from "./Common.js";

export class Tool implements ChatAL.Tool {
  type: "function";
  function: ChatAL.FunctionDefine;
  code?: string;
  callback?: (...args: any[]) => any;

  constructor(options: PickRequired<Tool, "function">) {
    if (!options.function) throw new Error("Tool must have a function");
    this.type = options.type ?? "function";
    this.function = options.function;
    this.code = options.code;
    this.callback = options.callback;
  }

  async exec(parsedArgs: any) {
    if (this.callback) {
      return JSON.stringify(await this.callback(...Object.values(parsedArgs)));
    }

    if (this.code) {
      return JSON.stringify(
        await new Function(...Object.keys(parsedArgs), this.code)(
          ...Object.values(parsedArgs)
        )
      );
    }
  }
}
